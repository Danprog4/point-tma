import { getCookie, getEvent } from "@tanstack/react-start/server";
import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import superjson from "superjson";

import { db } from "../../db";
import { usersTable } from "../../db/schema";

const t = initTRPC.create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// Supabase JWKS endpoint for verifying JWTs
const SUPABASE_URL = process.env.SUPABASE_URL || "https://dbyuvsgmthognoznrllh.supabase.co";
const SUPABASE_JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

const authMiddleware = middleware(async ({ ctx, next }) => {
  const event = getEvent();
  const authHeader = event.headers.get("Authorization");

  // Mobile: Bearer token (Supabase JWT)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, SUPABASE_JWKS);

      if (!payload.sub) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid Supabase JWT token",
        });
      }

      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.supabaseId, payload.sub),
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      return next({
        ctx: {
          ...ctx,
          userId: user.id,
        },
      });
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid Supabase JWT token",
      });
    }
  }

  // Web: Cookie JWT (Telegram)
  const authToken = getCookie(event, "auth");

  if (!authToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No JWT token found",
    });
  }

  const { payload } = await jwtVerify(authToken, JWT_SECRET);

  if (!payload) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid JWT token",
    });
  }

  if (!payload.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid JWT token",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: payload.userId as number,
    },
  });
});

// Mobile-only middleware (requires Bearer token, passes supabaseId)
const mobileAuthMiddleware = middleware(async ({ ctx, next }) => {
  const event = getEvent();
  const authHeader = event.headers.get("Authorization");

  console.log("[mobileAuth] Starting auth check");

  if (!authHeader?.startsWith("Bearer ")) {
    console.log("[mobileAuth] No Bearer token found");
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Mobile auth required",
    });
  }

  const token = authHeader.slice(7);
  try {
    console.log("[mobileAuth] Verifying JWT with JWKS...");
    const { payload } = await jwtVerify(token, SUPABASE_JWKS);
    console.log("[mobileAuth] JWT verified, sub:", payload.sub);

    if (!payload.sub) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid Supabase JWT token",
      });
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.supabaseId, payload.sub),
    });

    console.log("[mobileAuth] User lookup result:", user ? `found id=${user.id}` : "NOT FOUND");

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found. Call mobileLogin first to register.",
      });
    }

    return next({
      ctx: {
        ...ctx,
        userId: user.id,
        supabaseId: payload.sub,
      },
    });
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    console.log("[mobileAuth] JWT verification failed:", error);
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid Supabase JWT token",
    });
  }
});

const crmMiddleware = middleware(async ({ ctx, next }) => {
  const event = getEvent();
  const adminPassword = event.headers.get("x-admin-password");

  if (
    adminPassword === process.env.CRM_SUPER_PASSWORD ||
    adminPassword === process.env.CRM_ADMIN_PASSWORD
  ) {
    return next({ ctx: { ...ctx, isAdmin: true } });
  }

  throw new TRPCError({ code: "UNAUTHORIZED" });
});

const creatorMiddleware = middleware(async ({ ctx, next }) => {
  const event = getEvent();
  const adminPassword = event.headers.get("x-admin-password");

  if (
    adminPassword === process.env.CREATOR_PASSWORD ||
    adminPassword === process.env.CRM_SUPER_PASSWORD ||
    adminPassword === process.env.CRM_ADMIN_PASSWORD
  ) {
    return next({ ctx: { ...ctx, isCreator: true } });
  }

  throw new TRPCError({ code: "UNAUTHORIZED" });
});

export const procedure = t.procedure.use(authMiddleware);
export const mobileProcedure = t.procedure.use(mobileAuthMiddleware);
export const crmProcedure = t.procedure.use(crmMiddleware);
export const creatorProcedure = t.procedure.use(creatorMiddleware);

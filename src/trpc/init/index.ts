import { getCookie, getEvent } from "@tanstack/react-start/server";
import { initTRPC, TRPCError } from "@trpc/server";
import { jwtVerify } from "jose";
import superjson from "superjson";

const t = initTRPC.create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const authMiddleware = middleware(async ({ ctx, next }) => {
  const event = getEvent();
  const authToken = getCookie(event, "auth");

  console.log(authToken, "authToken");
  console.log(event, "event");

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

const crmMiddleware = middleware(async ({ ctx, next }) => {
  const event = getEvent();
  const adminPassword = event.headers.get("x-admin-password");

  if (adminPassword === process.env.CRM_PASSWORD) {
    return next({ ctx: { ...ctx, isAdmin: true } });
  }

  throw new TRPCError({ code: "UNAUTHORIZED" });
});

export const procedure = t.procedure.use(authMiddleware);
export const crmProcedure = t.procedure.use(crmMiddleware);

import { getEvent, setCookie } from "@tanstack/react-start/server";
import { parse, validate } from "@telegram-apps/init-data-node";
import { TRPCError, TRPCRouterRecord } from "@trpc/server";
import { eq, and, gt } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { db } from "~/db";
import { linkCodesTable, usersTable } from "~/db/schema";
import { sendTelegram } from "~/lib/utils/sendTelegram";
import { giveXP, ActionType } from "~/systems/progression";
import { mobileProcedure, publicProcedure } from "./init";

const SUPABASE_JWT_SECRET = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);

// Generate random 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authRouter = {
  login: publicProcedure
    .input(
      z.object({
        initData: z.string(),
        startParam: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        console.log(input.initData, "input.initData");
        console.log(process.env.BOT_TOKEN, "process.env.BOT_TOKEN");
        validate(input.initData, process.env.BOT_TOKEN!, {
          expiresIn: 0,
        });
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid init data",
        });
      }
      const parsedData = parse(input.initData);

      console.log(parsedData, "parsedData");

      const telegramUser = parsedData.user;
      const referrerId = input.startParam?.split("_")[1];
      console.log(referrerId, "startParam");

      if (!telegramUser) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid init data",
        });
      }

      const token = await new SignJWT({ userId: telegramUser.id })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1y")
        .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

      console.log(token, "token auth");

      const event = getEvent();

      setCookie(event, "auth", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });

      console.log(event, "event auth");

      const existingUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, telegramUser.id),
      });
      const name =
        telegramUser.first_name +
        (telegramUser.last_name ? ` ${telegramUser.last_name}` : "");

      if (!existingUser) {
        const newUser = await db
          .insert(usersTable)
          .values({
            id: telegramUser.id,
            referrerId: referrerId ? Number(referrerId) : null,
            name,
            photoUrl: telegramUser.photo_url || null,
            email: null,
            phone: null,
            bio: null,
            interests: null,
            city: null,
            inventory: [],
            balance: 0,
            birthday: null,
            surname: null,
            sex: null,
            photo: null,
            gallery: [],
            isOnboarded: false,
            lastLogin: new Date(),
          })
          .returning();

        console.log(newUser, "newUser");

        if (referrerId) {
          const referrerIdNumber = Number(referrerId);

          const referrer = await db.query.usersTable.findFirst({
            where: eq(usersTable.id, referrerIdNumber),
          });

          if (referrer) {
            // Начисляем XP и поинты рефереру
            await giveXP({
              userId: referrerIdNumber,
              actionType: ActionType.REFERRAL_JOINED,
            });

            await db
              .update(usersTable)
              .set({
                balance: (referrer?.balance ?? 0) + 100,
              })
              .where(eq(usersTable.id, referrerIdNumber));
          }

          await sendTelegram(
            `Вы пригласили друга и получили бонусы! 🎉\n\nСледите за своими достижениями в приложении.`,
            referrerIdNumber,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "🚀 Перейти в приложение",
                      web_app: {
                        url: "https://point-tma.vercel.app/",
                      },
                    },
                  ],
                ],
              },
              parse_mode: "Markdown",
            },
          );
        }

        return newUser[0];
      }

      await db
        .update(usersTable)
        .set({ lastLogin: new Date() })
        .where(eq(usersTable.id, existingUser.id));

      return existingUser;
    }),

  // Mobile login - links Supabase user to internal user
  mobileLogin: publicProcedure
    .input(
      z.object({
        token: z.string(),
        name: z.string().optional(),
        email: z.string().optional(),
        photoUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      let payload;
      try {
        const result = await jwtVerify(input.token, SUPABASE_JWT_SECRET);
        payload = result.payload;
      } catch (error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid Supabase token",
        });
      }

      if (!payload.sub) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid token payload",
        });
      }

      const supabaseId = payload.sub;

      // Check if user with this supabaseId already exists
      const existingUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.supabaseId, supabaseId),
      });

      if (existingUser) {
        // Update last login
        await db
          .update(usersTable)
          .set({ lastLogin: new Date() })
          .where(eq(usersTable.id, existingUser.id));

        return existingUser;
      }

      // Create new user with supabaseId
      // Generate a unique numeric ID for the new user
      const maxIdResult = await db.query.usersTable.findFirst({
        orderBy: (users, { desc }) => [desc(users.id)],
      });
      const newId = (maxIdResult?.id ?? 0) + 1;

      const newUser = await db
        .insert(usersTable)
        .values({
          id: newId,
          supabaseId,
          name: input.name || null,
          email: input.email || null,
          photoUrl: input.photoUrl || null,
          phone: null,
          bio: null,
          interests: null,
          city: null,
          inventory: [],
          balance: 0,
          birthday: null,
          surname: null,
          sex: null,
          photo: null,
          gallery: [],
          isOnboarded: false,
          lastLogin: new Date(),
        })
        .returning();

      return newUser[0];
    }),

  // Generate link code for mobile user to link Telegram account
  generateLinkCode: mobileProcedure.mutation(async ({ ctx }) => {
    const supabaseId = ctx.supabaseId;

    // Delete any existing codes for this user
    await db.delete(linkCodesTable).where(eq(linkCodesTable.supabaseId, supabaseId));

    // Generate unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.query.linkCodesTable.findFirst({
        where: eq(linkCodesTable.code, code),
      });
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    // Save code with 15 min expiration
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await db.insert(linkCodesTable).values({
      code,
      supabaseId,
      expiresAt,
    });

    return { code, expiresAt };
  }),
} satisfies TRPCRouterRecord;

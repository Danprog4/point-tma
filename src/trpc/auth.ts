import { getEvent, setCookie } from "@tanstack/react-start/server";
import { parse, validate } from "@telegram-apps/init-data-node";
import { TRPCError, TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { z } from "zod";
import { db } from "~/db";
import { usersTable } from "~/db/schema";
import { sendTelegram } from "~/lib/utils/sendTelegram";
import { publicProcedure } from "./init";

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
          })
          .returning();

        console.log(newUser, "newUser");

        if (referrerId) {
          const referrerIdNumber = Number(referrerId);

          const referrer = await db.query.usersTable.findFirst({
            where: eq(usersTable.id, referrerIdNumber),
          });

          if (referrer) {
            await db
              .update(usersTable)
              .set({
                xp: (referrer?.xp ?? 0) + 10,
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
                      url: "https://point-tma.vercel.app/",
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

      return existingUser;
    }),
} satisfies TRPCRouterRecord;

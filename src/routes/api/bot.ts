import { createAPIFileRoute } from "@tanstack/react-start/api";
import { eq, and, gt } from "drizzle-orm";
import { Bot, webhookCallback } from "grammy";
import { db } from "~/db";
import { linkCodesTable, telegramLinksTable, usersTable } from "~/db/schema";

const bot = new Bot(process.env.PROD_BOT_TOKEN!);

// Handle 6-digit link codes
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();

  // Check if it's a 6-digit code
  if (/^\d{6}$/.test(text)) {
    const code = text;
    const telegramId = ctx.from.id;

    try {
      await db.transaction(async (tx) => {
        // Find the link code (not expired)
        const linkRequest = await tx.query.linkCodesTable.findFirst({
          where: and(
            eq(linkCodesTable.code, code),
            gt(linkCodesTable.expiresAt, new Date()),
          ),
        });

        if (!linkRequest) {
          throw new Error("LINK_CODE_NOT_FOUND");
        }

        const supabaseId = linkRequest.supabaseId;

        // Explicit one-to-one mapping guard: one Telegram -> one Supabase.
        const linkByTelegram = await tx.query.telegramLinksTable.findFirst({
          where: eq(telegramLinksTable.telegramId, telegramId),
        });

        if (linkByTelegram && linkByTelegram.supabaseId !== supabaseId) {
          throw new Error("TELEGRAM_ALREADY_LINKED_TO_ANOTHER_SUPABASE");
        }

        // Explicit one-to-one mapping guard: one Supabase -> one Telegram.
        const linkBySupabase = await tx.query.telegramLinksTable.findFirst({
          where: eq(telegramLinksTable.supabaseId, supabaseId),
        });

        if (linkBySupabase && linkBySupabase.telegramId !== telegramId) {
          throw new Error("SUPABASE_ALREADY_LINKED_TO_ANOTHER_TELEGRAM");
        }

        // Find mobile user by supabaseId
        const mobileUser = await tx.query.usersTable.findFirst({
          where: eq(usersTable.supabaseId, supabaseId),
        });

        if (!mobileUser) {
          throw new Error("MOBILE_USER_NOT_FOUND");
        }

        // Check if TG user exists
        const tgUser = await tx.query.usersTable.findFirst({
          where: eq(usersTable.id, telegramId),
        });

        if (tgUser) {
          // Prevent Telegram account takeover across Supabase users.
          if (tgUser.supabaseId && tgUser.supabaseId !== supabaseId) {
            throw new Error("TELEGRAM_ALREADY_LINKED_TO_ANOTHER_SUPABASE");
          }

          if (mobileUser.id !== telegramId) {
            const newBalance = (tgUser.balance ?? 0) + (mobileUser.balance ?? 0);
            const newXp = (tgUser.xp ?? 0) + (mobileUser.xp ?? 0);

            await tx.delete(usersTable).where(eq(usersTable.id, mobileUser.id));

            await tx
              .update(usersTable)
              .set({
                supabaseId,
                balance: newBalance,
                xp: newXp,
                lastLogin: new Date(),
              })
              .where(eq(usersTable.id, telegramId));
          } else {
            await tx
              .update(usersTable)
              .set({
                supabaseId,
                lastLogin: new Date(),
              })
              .where(eq(usersTable.id, telegramId));
          }
        } else {
          // Recreate user under Telegram id (Telegram becomes source of truth).
          const newTelegramUser = {
            ...mobileUser,
            id: telegramId,
            supabaseId,
            lastLogin: new Date(),
          };

          await tx.delete(usersTable).where(eq(usersTable.id, mobileUser.id));
          await tx.insert(usersTable).values(newTelegramUser);
        }

        await tx
          .insert(telegramLinksTable)
          .values({
            telegramId,
            supabaseId,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: telegramLinksTable.telegramId,
            set: {
              supabaseId,
              updatedAt: new Date(),
            },
          });

        // Delete used code
        await tx.delete(linkCodesTable).where(eq(linkCodesTable.code, code));
      });

      return ctx.reply("✅ Аккаунты успешно связаны! Теперь вы можете входить и с Telegram, и с мобильного приложения.");
    } catch (error) {
      console.error("Link accounts error:", error);
      if (error instanceof Error) {
        if (error.message === "LINK_CODE_NOT_FOUND") {
          return ctx.reply("❌ Код не найден или истёк. Запросите новый код в приложении.");
        }
        if (error.message === "MOBILE_USER_NOT_FOUND") {
          return ctx.reply("❌ Мобильный аккаунт не найден.");
        }
        if (error.message === "TELEGRAM_ALREADY_LINKED_TO_ANOTHER_SUPABASE") {
          return ctx.reply("❌ Этот Telegram уже привязан к другому аккаунту. Используйте другой Telegram.");
        }
        if (error.message === "SUPABASE_ALREADY_LINKED_TO_ANOTHER_TELEGRAM") {
          return ctx.reply("❌ К этому аккаунту уже привязан другой Telegram. Сначала отвяжите его.");
        }
      }
      return ctx.reply("❌ Произошла ошибка. Попробуйте ещё раз.");
    }
  }

  // Default response for other messages
  ctx.reply("Привет! Открой мини-приложение, чтобы продолжить.");
});

bot.command("start", (ctx) => {
  ctx.reply("Добро пожаловать в Point! Открой мини-приложение, чтобы начать.");
});

const update = webhookCallback(bot, "std/http");

const handleUpdate = async (request: Request) => {
  return await update(request);
};

export const APIRoute = createAPIFileRoute("/api/bot")({
  GET: async ({ request }) => handleUpdate(request),
  POST: async ({ request }) => handleUpdate(request),
});

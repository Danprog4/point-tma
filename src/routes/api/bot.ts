import { createAPIFileRoute } from "@tanstack/react-start/api";
import { eq, and, gt } from "drizzle-orm";
import { Bot, webhookCallback } from "grammy";
import { db } from "~/db";
import { linkCodesTable, usersTable } from "~/db/schema";

const bot = new Bot(process.env.PROD_BOT_TOKEN!);

// Handle 6-digit link codes
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();

  // Check if it's a 6-digit code
  if (/^\d{6}$/.test(text)) {
    const code = text;
    const telegramId = ctx.from.id;

    try {
      // Find the link code (not expired)
      const linkRequest = await db.query.linkCodesTable.findFirst({
        where: and(
          eq(linkCodesTable.code, code),
          gt(linkCodesTable.expiresAt, new Date())
        ),
      });

      if (!linkRequest) {
        return ctx.reply("❌ Код не найден или истёк. Запросите новый код в приложении.");
      }

      const supabaseId = linkRequest.supabaseId;

      // Find mobile user by supabaseId
      const mobileUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.supabaseId, supabaseId),
      });

      if (!mobileUser) {
        return ctx.reply("❌ Мобильный аккаунт не найден.");
      }

      // Check if TG user exists
      const tgUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, telegramId),
      });

      if (tgUser) {
        // TG user exists → link supabaseId to them and merge data
        await db
          .update(usersTable)
          .set({
            supabaseId: supabaseId,
            balance: (tgUser.balance ?? 0) + (mobileUser.balance ?? 0),
            xp: (tgUser.xp ?? 0) + (mobileUser.xp ?? 0),
          })
          .where(eq(usersTable.id, telegramId));

        // Delete mobile user (different record)
        if (mobileUser.id !== telegramId) {
          await db.delete(usersTable).where(eq(usersTable.id, mobileUser.id));
        }
      } else {
        // TG user doesn't exist → create new with telegram id and mobile data
        await db.insert(usersTable).values({
          id: telegramId,
          supabaseId: supabaseId,
          name: mobileUser.name,
          email: mobileUser.email,
          phone: mobileUser.phone,
          bio: mobileUser.bio,
          photoUrl: mobileUser.photoUrl,
          photo: mobileUser.photo,
          gallery: mobileUser.gallery,
          interests: mobileUser.interests,
          city: mobileUser.city,
          birthday: mobileUser.birthday,
          sex: mobileUser.sex,
          balance: mobileUser.balance,
          xp: mobileUser.xp,
          level: mobileUser.level,
          inventory: mobileUser.inventory,
          isOnboarded: mobileUser.isOnboarded,
          lastLogin: new Date(),
        });

        // Delete old mobile user record
        await db.delete(usersTable).where(eq(usersTable.id, mobileUser.id));
      }

      // Delete used code
      await db.delete(linkCodesTable).where(eq(linkCodesTable.code, code));

      return ctx.reply("✅ Аккаунты успешно связаны! Теперь вы можете входить и с Telegram, и с мобильного приложения.");
    } catch (error) {
      console.error("Link accounts error:", error);
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

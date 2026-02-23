import { eq } from "drizzle-orm";
import { Bot, type Api } from "grammy";
import { db } from "~/db";
import { telegramLinksTable, usersTable } from "~/db/schema";

const BOT_TOKEN = process.env.PROD_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set");
}

const bot = new Bot(BOT_TOKEN);

async function resolveTelegramChatId(userId: number): Promise<number | null> {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });

  if (!user) {
    console.warn(`[sendTelegram] user not found: ${userId}`);
    return null;
  }

  // Mobile users are identified by Supabase auth and can be linked later to Telegram.
  if (user.supabaseId) {
    const link = await db.query.telegramLinksTable.findFirst({
      where: eq(telegramLinksTable.supabaseId, user.supabaseId),
    });

    if (link?.telegramId) {
      return link.telegramId;
    }

    return null;
  }

  // Telegram-first users use Telegram id as primary id.
  return user.id;
}

export const sendTelegram = async (
  message: string,
  telegramUserId: number,
  options?: Parameters<Api["sendMessage"]>[2],
) => {
  const chatId = await resolveTelegramChatId(telegramUserId);

  if (!chatId) {
    console.info(`[sendTelegram] skipped: no linked telegram for user ${telegramUserId}`);
    return false;
  }

  try {
    await bot.api.sendMessage(chatId, message, options);
    return true;
  } catch (error) {
    console.warn(`[sendTelegram] send failed for chat ${chatId}:`, error);
    return false;
  }
};

import { eq } from "drizzle-orm";
import { Bot, type Api } from "grammy";
import { db } from "~/db";
import { usersTable } from "~/db/schema";

const BOT_TOKEN = process.env.PROD_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set");
}

const bot = new Bot(BOT_TOKEN);

export const sendTelegram = async (
  message: string,
  telegramUserId: number,
  options?: Parameters<Api["sendMessage"]>[2],
) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, telegramUserId),
  });

  if (!user) {
    throw new Error("User not found");
  }

  await bot.api.sendMessage(user.id, message, options);
};

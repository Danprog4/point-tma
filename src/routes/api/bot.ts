import { createAPIFileRoute } from "@tanstack/react-start/api";
import { Bot, webhookCallback } from "grammy";

const bot = new Bot(process.env.PROD_BOT_TOKEN!);

bot.on("message", (ctx) => {
  ctx.reply("Hello!");
});

bot.command("start", (ctx) => {
  ctx.reply("Hello!");
});

const update = webhookCallback(bot, "std/http");

const handleUpdate = async (request: Request) => {
  return await update(request);
};

export const APIRoute = createAPIFileRoute("/api/bot")({
  GET: async ({ request }) => handleUpdate(request),
  POST: async ({ request }) => handleUpdate(request),
});

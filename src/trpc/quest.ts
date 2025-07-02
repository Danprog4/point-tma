import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { questsData } from "~/config/quests";
import { db } from "~/db";
import { activeQuestsTable, usersTable } from "~/db/schema";
import { sendTelegram } from "~/lib/utils/sendTelegram";
import { createTRPCRouter, procedure } from "./init";

export const questRouter = createTRPCRouter({
  getMyQuests: procedure.query(async ({ ctx }) => {
    const quests = await db.query.activeQuestsTable.findMany({
      where: eq(activeQuestsTable.userId, ctx.userId),
    });
    return quests;
  }),

  buyQuest: procedure
    .input(
      z.object({
        questId: z.number(),
      }),
    )

    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const questData = questsData.find((quest) => quest.id === input.questId);

      if (!questData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quest not found",
        });
      }

      if (user.balance! < questData.price) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not enough balance",
        });
      }

      if (user.inventory?.find((ticket) => ticket.questId === input.questId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quest already bought",
        });
      }

      await db
        .update(usersTable)
        .set({
          inventory: [
            ...(user.inventory || []),
            { type: "ticket", questId: input.questId, isActive: false },
          ],
        })
        .where(eq(usersTable.id, ctx.userId));
    }),

  activateQuest: procedure
    .input(
      z.object({
        questId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const ticket = user.inventory?.find(
        (ticket) => ticket.type === "ticket" && ticket.questId === input.questId,
      );

      if (!ticket) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Билет не найден",
        });
      }

      if (ticket.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Билет уже активирован",
        });
      }

      const newInventory = user.inventory?.map((ticket) => {
        if (ticket.questId === input.questId) {
          return { ...ticket, isActive: true };
        }
        return ticket;
      });

      const questData = questsData.find((quest) => quest.id === input.questId);

      if (!questData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quest not found",
        });
      }

      await db
        .update(usersTable)
        .set({
          inventory: newInventory,
          balance: user.balance! - questData.price,
        })
        .where(eq(usersTable.id, ctx.userId));

      await db.insert(activeQuestsTable).values({
        userId: ctx.userId,
        questId: input.questId,
        isCompleted: false,
      });

      await sendTelegram(
        `Вы успешно активировали билет на квест *${questData?.title}* 🎟️\n\nЗаходи в канал и начинай выполнение:`,
        user.id,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🚀 Перейти в канал",
                  url: "https://t.me/+uyQGDiDmRsc0YTcy",
                },
              ],
            ],
          },
          parse_mode: "Markdown",
        },
      );
    }),
});

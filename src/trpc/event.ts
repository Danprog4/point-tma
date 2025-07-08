import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { activeEventsTable, usersTable } from "~/db/schema";
import { getEventData } from "~/lib/utils/getEventData";
import { sendTelegram } from "~/lib/utils/sendTelegram";
import { createTRPCRouter, procedure } from "./init";

export const eventRouter = createTRPCRouter({
  getMyEvents: procedure.query(async ({ ctx }) => {
    const events = await db.query.activeEventsTable.findMany({
      where: eq(activeEventsTable.userId, ctx.userId),
    });
    return events;
  }),

  buyEvent: procedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
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

      const eventData = getEventData(input.name, input.id);

      if (!eventData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      if (user.balance! < eventData.price) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not enough balance",
        });
      }

      if (
        user.inventory?.find(
          (ticket) => ticket.eventId === input.id && ticket.name === input.name,
        )
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quest already bought",
        });
      }

      const newInventory = [
        ...(user.inventory || []),
        { type: "ticket", eventId: input.id, name: input.name, isActive: false },
      ];

      const newBalance = user.balance! - eventData.price;

      console.log(newInventory, newBalance);

      await db
        .update(usersTable)
        .set({
          inventory: newInventory,
          balance: newBalance,
        })
        .where(eq(usersTable.id, ctx.userId));
    }),

  activateQuest: procedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
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
        (ticket) =>
          ticket.type === "ticket" &&
          ticket.eventId === input.id &&
          ticket.name === input.name,
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
        if (ticket.eventId === input.id && ticket.name === input.name) {
          return { ...ticket, isActive: true };
        }
        return ticket;
      });

      console.log(newInventory);

      const eventData = getEventData(input.name, input.id);

      if (!eventData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      await db
        .update(usersTable)
        .set({
          inventory: newInventory,
        })
        .where(eq(usersTable.id, ctx.userId));

      await db.insert(activeEventsTable).values({
        userId: ctx.userId,
        name: input.name,
        eventId: input.id,
        isCompleted: false,
      });

      await sendTelegram(
        `Вы успешно активировали билет на мероприятие *${eventData?.title}* 🎟️\n\nЗаходи в канал и начинай выполнение:`,
        user.id,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🚀 Перейти в канал",
                  url: "https://t.me/joinchat/uyQGDiDmRsc0YTcy",
                },
              ],
            ],
          },
          parse_mode: "Markdown",
        },
      );
    }),
});

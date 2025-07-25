import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
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

  endQuest: procedure
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

      // Ищем первый НЕ завершённый активный квест
      const quest = await db.query.activeEventsTable.findFirst({
        where: and(
          eq(activeEventsTable.userId, ctx.userId),
          eq(activeEventsTable.eventId, input.id),
          eq(activeEventsTable.name, input.name),
          eq(activeEventsTable.isCompleted, false),
        ),
      });

      if (!quest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Активный незавершённый квест не найден",
        });
      }

      await db
        .update(activeEventsTable)
        .set({
          isCompleted: true,
        })
        .where(eq(activeEventsTable.id, quest.id));
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

      const relatedTickets = (user.inventory || []).filter(
        (ticket) => ticket.eventId === input.id && ticket.name === input.name,
      );
      const hasAnyTicket = relatedTickets.length > 0;
      const hasActiveTicket = relatedTickets.some((t) => t.isActive);

      const completedEvent = await db.query.activeEventsTable.findFirst({
        where: and(
          eq(activeEventsTable.userId, ctx.userId),
          eq(activeEventsTable.eventId, input.id),
          eq(activeEventsTable.name, input.name),
          eq(activeEventsTable.isCompleted, true),
        ),
      });

      if (hasAnyTicket && !(hasActiveTicket && completedEvent)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quest not completed yet",
        });
      }

      const newInventory = [
        ...(user.inventory || []),
        {
          type: "ticket",
          eventId: input.id,
          name: input.name,
          isActive: false,
          id: Date.now(),
        },
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

  activateEvent: procedure
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

      // Ищем неактивированный билет пользователя для активации
      const inactiveTicket = user.inventory?.find(
        (ticket) =>
          ticket.type === "ticket" &&
          ticket.eventId === input.id &&
          ticket.name === input.name &&
          ticket.isActive === false,
      );

      if (!inactiveTicket) {
        // Если все билеты уже активны, выводим ошибку
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Нет неактивных билетов для активации",
        });
      }

      const newInventory = user.inventory?.map((ticket) => {
        if (
          ticket.eventId === input.id &&
          ticket.name === input.name &&
          ticket.id === inactiveTicket.id
        ) {
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
        type: eventData.category,
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

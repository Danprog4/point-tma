import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import {
  activeEventsTable,
  calendarTable,
  eventsTable,
  tasksProgressTable,
  usersTable,
} from "~/db/schema";
import { getNewEvents } from "~/lib/utils/getNewEvents";
import { logAction } from "~/lib/utils/logger";
import { sendTelegram } from "~/lib/utils/sendTelegram";
import { giveXP, ActionType, checkAchievements } from "~/systems/progression";
import { createTRPCRouter, procedure, publicProcedure } from "./init";

export const eventRouter = createTRPCRouter({
  getMyEvents: procedure.query(async ({ ctx }) => {
    const events = await db.query.activeEventsTable.findMany({
      where: eq(activeEventsTable.userId, ctx.userId),
    });
    return events;
  }),

  getCategories: publicProcedure.query(async () => {
    return await db.query.categoriesTable.findMany({
      orderBy: (categories, { desc }) => [desc(categories.createdAt)],
    });
  }),
  getOrganizers: publicProcedure.query(async () => {
    const events = await db.query.eventsTable.findMany();
    const organizers = [...new Set(events.map((event) => event.organizer))];
    return organizers;
  }),

  getNewEvents: procedure.query(async () => {
    const events = await getNewEvents();
    return events;
  }),

  getUserEvents: procedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const events = await db.query.activeEventsTable.findMany({
        where: eq(activeEventsTable.userId, input.userId),
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

      const eventData = await db.query.eventsTable.findFirst({
        where: and(eq(eventsTable.id, input.id), eq(eventsTable.category, input.name)),
      });

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

      const cases = await db.query.casesTable.findMany();

      if (eventData.rewards?.some((reward: any) => reward.type === "case")) {
        const caseId = eventData.rewards.find(
          (reward: any) => reward.type === "case",
        )?.value;

        await db
          .update(usersTable)
          .set({
            inventory: [
              ...(user.inventory || []),
              {
                type: "case",
                eventId: caseId as number,
                eventType: eventData.category || "",
              },
            ],
          })
          .where(eq(usersTable.id, ctx.userId));
      }
      if (eventData.rewards?.some((reward: any) => reward.type === "key")) {
        const keyId = eventData.rewards.find(
          (reward: any) => reward.type === "key",
        )?.caseId;

        await db
          .update(usersTable)
          .set({
            inventory: [
              ...(user.inventory || []),
              { type: "key", caseId: keyId as number },
            ],
          })
          .where(eq(usersTable.id, ctx.userId));
      }

      if (eventData.skills) {
        await db
          .update(usersTable)
          .set({
            skills: [...(user.skills || []), ...eventData.skills],
          })
          .where(eq(usersTable.id, ctx.userId));
      }

      if (eventData.achievements) {
        await db
          .update(usersTable)
          .set({
            achievements: [...(user.achievements || []), ...eventData.achievements],
          })
          .where(eq(usersTable.id, ctx.userId));
      }

      await logAction({
        userId: ctx.userId,
        type: "quest_end",
        eventId: input.id,
        eventType: eventData.category ?? input.name,
      });

      // Определяем тип квеста по редкости для начисления XP
      let actionType = ActionType.QUEST_COMPLETE;
      const rarity = (eventData as any).rarity;
      if (rarity === "legendary") {
        actionType = ActionType.QUEST_COMPLETE_LEGENDARY;
      } else if (rarity === "epic") {
        actionType = ActionType.QUEST_COMPLETE_EPIC;
      } else if (rarity === "rare") {
        actionType = ActionType.QUEST_COMPLETE_RARE;
      }

      // Начисляем XP с учётом множителей
      const xpResult = await giveXP({
        userId: ctx.userId,
        actionType,
      });

      // Проверяем достижения
      const newAchievements = await checkAchievements(ctx.userId);

      // Уведомляем о повышении уровня
      if (xpResult.leveledUp) {
        const rewardsText = xpResult.rewards
          .map((r) => `• ${r.description}`)
          .join("\n");

        await sendTelegram(
          `🎉 Поздравляем!\n\nВы достигли *${xpResult.newLevel} уровня*!\n\n*Награды:*\n${rewardsText}`,
          ctx.userId,
          { parse_mode: "Markdown" }
        );
      }

      // Уведомляем о новых достижениях
      if (newAchievements.length > 0) {
        await sendTelegram(
          `🏆 Получено достижение${newAchievements.length > 1 ? "я" : ""}!\n\n${newAchievements.map((id) => `• ${id}`).join("\n")}`,
          ctx.userId
        );
      }
    }),

  buyEvent: procedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        count: z.number(),
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

      const eventData = await db.query.eventsTable.findFirst({
        where: and(eq(eventsTable.id, input.id), eq(eventsTable.category, input.name)),
      });

      if (!eventData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      if (user.balance! < eventData.price! * input.count) {
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
        ...Array.from({ length: input.count }, (_, index) => ({
          type: "ticket",
          eventId: input.id,
          name: input.name,
          isActive: false,
          id: Date.now() + index,
        })),
      ];

      const newBalance = user.balance! - eventData.price! * input.count;

      console.log(newInventory, newBalance);

      await db
        .update(usersTable)
        .set({
          inventory: newInventory,
          balance: newBalance,
        })
        .where(eq(usersTable.id, ctx.userId));

      if (eventData.date && eventData.date.includes(".")) {
        await db.insert(calendarTable).values({
          eventId: input.id,
          eventType: eventData.category,
          date: new Date(eventData.date.split(".").reverse().join("-")),
          userId: ctx.userId,
          isTicket: true,
        });
      }

      await logAction({
        userId: ctx.userId,
        type: "event_buy",
        eventId: input.id,
        eventType: eventData.category ?? input.name,
        amount: eventData.price ? eventData.price * input.count : null,
      });

      // Начисляем XP за покупку события
      await giveXP({
        userId: ctx.userId,
        actionType: ActionType.EVENT_BUY,
      });

      const existingTask = await db.query.tasksProgressTable.findFirst({
        where: and(
          eq(tasksProgressTable.userId, ctx.userId),
          eq(tasksProgressTable.taskId, "buy-event"),
        ),
      });

      if (existingTask && !existingTask.isCompleted) {
        await db
          .update(tasksProgressTable)
          .set({
            progress: (existingTask.progress ?? 0) + 1,
          })
          .where(eq(tasksProgressTable.id, existingTask.id));
      }

      const created = newInventory.slice(-input.count);
      return created;
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

      const eventData = await db.query.eventsTable.findFirst({
        where: and(eq(eventsTable.id, input.id), eq(eventsTable.category, input.name)),
      });

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

      await logAction({
        userId: ctx.userId,
        type: "event_activate",
        eventId: input.id,
        eventType: eventData.category ?? input.name,
      });

      const existingTask = await db.query.tasksProgressTable.findFirst({
        where: and(
          eq(tasksProgressTable.userId, ctx.userId),
          eq(tasksProgressTable.taskId, "active-event"),
        ),
      });

      if (existingTask && !existingTask.isCompleted) {
        await db
          .update(tasksProgressTable)
          .set({
            progress: (existingTask.progress ?? 0) + 1,
          })
          .where(eq(tasksProgressTable.id, existingTask.id));
      }
    }),

  getEvents: procedure.query(async () => {
    const events = await db.query.eventsTable.findMany({
      where: and(eq(eventsTable.isApproved, true), eq(eventsTable.isReviewed, true)),
    });
    return events;
  }),

  getEventByTitle: procedure
    .input(z.object({ title: z.string() }))
    .query(async ({ input }) => {
      const event = await db.query.eventsTable.findFirst({
        where: and(eq(eventsTable.title, input.title), eq(eventsTable.isApproved, true)),
      });
      return event;
    }),

  getEventsByCategory: procedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const events = await db.query.eventsTable.findMany({
        where: and(
          eq(eventsTable.category, input.category),
          eq(eventsTable.isApproved, true),
          eq(eventsTable.isReviewed, true),
        ),
        orderBy: [desc(eventsTable.createdAt)],
      });
      return events;
    }),

  getEvent: procedure
    .input(z.object({ id: z.number(), category: z.string() }))
    .query(async ({ input }) => {
      const event = await db.query.eventsTable.findFirst({
        where: and(
          eq(eventsTable.id, input.id),
          eq(eventsTable.category, input.category),
          eq(eventsTable.isApproved, true),
          eq(eventsTable.isReviewed, true),
        ),
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      return event;
    }),
});

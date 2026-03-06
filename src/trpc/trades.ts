import { TRPCError } from "@trpc/server";
import { desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { tradesTable, usersTable } from "~/db/schema";
import { logAction } from "~/lib/utils/logger";
import { ActionType, giveXP } from "~/systems/progression";
import { createTRPCRouter, procedure } from "./init";

const normalizeTicketType = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();

const isMatchingTradeTicket = (
  item: {
    type?: string;
    eventId?: number;
    name?: string;
    eventType?: string;
    isActive?: boolean;
    isInTrade?: boolean;
    isInSelling?: boolean;
  },
  eventId: number,
  eventType: string,
) => {
  if (item.type !== "ticket") return false;
  if (item.eventId !== eventId) return false;
  const normalizedInputType = normalizeTicketType(eventType);
  const normalizedItemType =
    normalizeTicketType(item.name) || normalizeTicketType(item.eventType);
  return normalizedInputType.length > 0 && normalizedItemType === normalizedInputType;
};

export const tradesRouter = createTRPCRouter({
  getTrades: procedure.query(async () => {
    return await db.query.tradesTable.findMany();
  }),

  getMyTrades: procedure.query(async ({ ctx }) => {
    return await db.query.tradesTable.findMany({
      where: or(
        eq(tradesTable.fromUserId, ctx.userId),
        eq(tradesTable.toUserId, ctx.userId),
      ),
      orderBy: [desc(tradesTable.createdAt)],
    });
  }),

  sendTrade: procedure
    .input(
      z.object({
        toUserId: z.number().optional(),
        typeOfGiving: z.enum(["case", "item", "ticket"]),
        typeOfReceiving: z.enum(["case", "item", "ticket"]),
        eventIdOfGiving: z.number().optional(),
        eventTypeOfGiving: z.string().optional(),
        caseIdOfGiving: z.number().optional(),
        itemIdOfGiving: z.number().optional(),
        amountOfGiving: z.number().optional(),
        eventIdOfReceiving: z.number().optional(),
        eventTypeOfReceiving: z.string().optional(),
        caseIdOfReceiving: z.number().optional(),
        itemIdOfReceiving: z.number().optional(),
        amountOfReceiving: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      db.transaction(async (tx) => {
        const user = await tx.query.usersTable.findFirst({
          where: eq(usersTable.id, ctx.userId),
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        if (!input.toUserId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Recipient is required",
          });
        }

        if (input.toUserId === ctx.userId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot trade with yourself",
          });
        }

        // Update user inventory to mark items as in trade
        if (input.eventIdOfGiving && input.typeOfGiving === "ticket") {
          if (!input.eventTypeOfGiving) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "eventTypeOfGiving is required for ticket trade",
            });
          }

          const amountToReserve = Math.max(1, input.amountOfGiving || 1);
          const availableTickets = (user.inventory || []).filter((item) => {
            if (!isMatchingTradeTicket(item, input.eventIdOfGiving!, input.eventTypeOfGiving!)) {
              return false;
            }
            return !item.isActive && !item.isInTrade && !item.isInSelling;
          });

          if (availableTickets.length < amountToReserve) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Not enough tickets for trade. Available: ${availableTickets.length}`,
            });
          }

          let reserved = 0;
          await tx
            .update(usersTable)
            .set({
              inventory: user.inventory?.map((item) => {
                if (
                  reserved < amountToReserve &&
                  isMatchingTradeTicket(item, input.eventIdOfGiving!, input.eventTypeOfGiving!) &&
                  !item.isActive &&
                  !item.isInTrade &&
                  !item.isInSelling
                ) {
                  reserved += 1;
                  return { ...item, isInTrade: true };
                }
                return item;
              }),
            })
            .where(eq(usersTable.id, ctx.userId));
        } else if (input.itemIdOfGiving) {
          const itemToReserve = (user.inventory || []).find(
            (item) => item.id === input.itemIdOfGiving,
          );

          if (!itemToReserve) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Giving item not found in inventory",
            });
          }

          if (itemToReserve.isInTrade) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Item is already used in another trade",
            });
          }

          await tx
            .update(usersTable)
            .set({
              inventory: user.inventory?.map((item) =>
                item.id === input.itemIdOfGiving ? { ...item, isInTrade: true } : item,
              ),
            })
            .where(eq(usersTable.id, ctx.userId));
        }

        const trade = await tx
          .insert(tradesTable)
          .values({
            ...input,
            fromUserId: ctx.userId,
            toUserId: input.toUserId,
            status: "pending",
          })
          .returning();

        return trade[0];
      })),

  approveTrade: procedure
    .input(
      z.object({
        tradeId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const trade = await db.query.tradesTable.findFirst({
        where: eq(tradesTable.id, input.tradeId),
      });

      if (!trade) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trade not found",
        });
      }

      if (trade.toUserId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only recipient can approve this trade",
        });
      }

      if (trade.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Trade is no longer pending",
        });
      }

      if (
        trade.fromUserId &&
        trade.typeOfGiving === "ticket" &&
        trade.eventIdOfGiving &&
        trade.eventTypeOfGiving
      ) {
        const fromUser = await db.query.usersTable.findFirst({
          where: eq(usersTable.id, trade.fromUserId),
        });

        if (fromUser) {
          const amountToRelease = Math.max(1, trade.amountOfGiving || 1);
          let released = 0;
          const releasedInventory = (fromUser.inventory || []).map((item) => {
            if (
              released < amountToRelease &&
              isMatchingTradeTicket(item, trade.eventIdOfGiving!, trade.eventTypeOfGiving!) &&
              item.isInTrade
            ) {
              released += 1;
              return { ...item, isInTrade: false };
            }
            return item;
          });

          await db
            .update(usersTable)
            .set({
              inventory: releasedInventory,
            })
            .where(eq(usersTable.id, trade.fromUserId));
        }
      }

      await db
        .update(tradesTable)
        .set({
          status: "completed",
        })
        .where(eq(tradesTable.id, input.tradeId));

      const userIdsForReward = Array.from(
        new Set(
          [trade.fromUserId, trade.toUserId].filter(
            (userId): userId is number => typeof userId === "number",
          ),
        ),
      );

      await Promise.all(
        userIdsForReward.map((userId) =>
          logAction({
            userId,
            type: "trade_complete",
            itemId: trade.id,
          }),
        ),
      );

      await Promise.all(
        userIdsForReward.map((userId) =>
          giveXP({
            userId,
            actionType: ActionType.TRADE_COMPLETE,
          }),
        ),
      );

      return trade;
    }),

  rejectTrade: procedure
    .input(
      z.object({
        tradeId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const trade = await db.query.tradesTable.findFirst({
        where: eq(tradesTable.id, input.tradeId),
      });

      if (!trade) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trade not found",
        });
      }

      if (trade.toUserId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only recipient can reject this trade",
        });
      }

      if (trade.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Trade is no longer pending",
        });
      }

      if (
        trade.fromUserId &&
        trade.typeOfGiving === "ticket" &&
        trade.eventIdOfGiving &&
        trade.eventTypeOfGiving
      ) {
        const fromUser = await db.query.usersTable.findFirst({
          where: eq(usersTable.id, trade.fromUserId),
        });

        if (fromUser) {
          const amountToRelease = Math.max(1, trade.amountOfGiving || 1);
          let released = 0;
          const releasedInventory = (fromUser.inventory || []).map((item) => {
            if (
              released < amountToRelease &&
              isMatchingTradeTicket(item, trade.eventIdOfGiving!, trade.eventTypeOfGiving!) &&
              item.isInTrade
            ) {
              released += 1;
              return { ...item, isInTrade: false };
            }
            return item;
          });

          await db
            .update(usersTable)
            .set({
              inventory: releasedInventory,
            })
            .where(eq(usersTable.id, trade.fromUserId));
        }
      }

      await db
        .update(tradesTable)
        .set({
          status: "rejected",
        })
        .where(eq(tradesTable.id, input.tradeId));

      return trade;
    }),
});

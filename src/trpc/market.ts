import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { sellingTable, usersTable } from "~/db/schema";
import { logAction } from "~/lib/utils/logger";
import { ActionType, giveXP } from "~/systems/progression";
import { createTRPCRouter, procedure } from "./init";

const normalizeTicketType = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();

const isMatchingTicket = (
  item: {
    type?: string;
    eventId?: number;
    name?: string;
    eventType?: string;
    isActive?: boolean;
    isInSelling?: boolean;
    isInTrade?: boolean;
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

export const marketRouter = createTRPCRouter({
  sellItem: procedure
    .input(
      z.object({
        type: z.enum(["ticket"]),
        eventId: z.number(),
        eventType: z.string().trim().min(1),
        amount: z.number().min(1),
        price: z.number().min(1),
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

      const userInventory = user.inventory || [];

      const availableItems = userInventory.filter((item) => {
        if (!isMatchingTicket(item, input.eventId, input.eventType)) return false;
        if (item.isActive || item.isInSelling || item.isInTrade) return false;
        return true;
      });

      if (availableItems.length < input.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Not enough items available. You have ${availableItems.length} but trying to sell ${input.amount}`,
        });
      }

      let markedCount = 0;
      const updatedInventory = userInventory.map((item) => {
        if (
          markedCount < input.amount &&
          isMatchingTicket(item, input.eventId, input.eventType) &&
          !item.isActive &&
          !item.isInSelling &&
          !item.isInTrade
        ) {
          markedCount++;
          return { ...item, isInSelling: true };
        }
        return item;
      });

      await db
        .update(usersTable)
        .set({ inventory: updatedInventory })
        .where(eq(usersTable.id, ctx.userId));

      const newItem = {
        ...input,
        userId: ctx.userId,
      };

      return await db.insert(sellingTable).values(newItem);
    }),

  getSellings: procedure.query(async () => {
    return await db.query.sellingTable.findMany({
      orderBy: [desc(sellingTable.createdAt)],
      where: eq(sellingTable.status, "selling"),
    });
  }),

  getMySellings: procedure.query(async ({ ctx }) => {
    return await db.query.sellingTable.findMany({
      where: eq(sellingTable.userId, ctx.userId),
      orderBy: [desc(sellingTable.createdAt)],
    });
  }),

  buyItem: procedure
    .input(
      z.object({
        sellingId: z.number(),
        amount: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await db.transaction(async (tx) => {
        const buyer = await tx.query.usersTable.findFirst({
          where: eq(usersTable.id, ctx.userId),
        });

        if (!buyer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        const selling = await tx.query.sellingTable.findFirst({
          where: eq(sellingTable.id, input.sellingId),
        });

        if (!selling) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Selling not found",
          });
        }

        if (!selling.userId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selling owner is missing",
          });
        }

        if (selling.userId === ctx.userId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot buy your own listing",
          });
        }

        if (selling.status !== "selling") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selling is not active",
          });
        }

        if (!selling.amount || selling.amount < input.amount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Not enough quantity",
          });
        }

        if (!selling.price) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selling price is missing",
          });
        }

        const sellingEventId = selling.eventId;
        const sellingEventType = selling.eventType;

        if (!sellingEventId || !sellingEventType) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selling event metadata is missing",
          });
        }

        const seller = await tx.query.usersTable.findFirst({
          where: eq(usersTable.id, selling.userId),
        });

        if (!seller) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Seller user not found",
          });
        }

        const totalPrice = selling.price * input.amount;
        if ((buyer.balance ?? 0) < totalPrice) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Not enough balance",
          });
        }

        const sellerInventory = seller.inventory || [];
        const sellerTicketsToTransfer = sellerInventory.filter((item) => {
          if (!isMatchingTicket(item, sellingEventId, sellingEventType)) return false;
          return item.isInSelling === true;
        });

        if (sellerTicketsToTransfer.length < input.amount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Seller inventory is out of sync with selling amount",
          });
        }

        const soldTickets = sellerTicketsToTransfer.slice(0, input.amount);
        const soldIds = new Set(
          soldTickets.map((item) => item.id).filter((id): id is number => typeof id === "number"),
        );

        let remainingWithoutIdToRemove =
          soldTickets.length - soldIds.size;

        const newSellerInventory = sellerInventory.filter((item) => {
          if (!isMatchingTicket(item, sellingEventId, sellingEventType)) return true;
          if (item.isInSelling !== true) return true;

          if (typeof item.id === "number") {
            return !soldIds.has(item.id);
          }

          if (remainingWithoutIdToRemove > 0) {
            remainingWithoutIdToRemove -= 1;
            return false;
          }

          return true;
        });

        const ticketIdBase = Date.now();
        const newBuyerInventory = [
          ...(buyer.inventory || []),
          ...Array.from({ length: input.amount }, (_, index) => ({
            type: "ticket",
            eventId: sellingEventId,
            eventType: sellingEventType,
            name: sellingEventType,
            isActive: false,
            isInSelling: false,
            isInTrade: false,
            id: ticketIdBase + index,
          })),
        ];

        const isSellingFinished = selling.amount - input.amount === 0;
        const buyersIds = {
          ...(selling.buyersIds || {}),
          [ctx.userId]: Date.now(),
        } as Record<number, number>;

        await tx
          .update(sellingTable)
          .set({
            amount: selling.amount - input.amount,
            buyersIds,
            status: isSellingFinished ? "sold" : "selling",
          })
          .where(eq(sellingTable.id, input.sellingId));

        await tx
          .update(usersTable)
          .set({
            balance: (buyer.balance ?? 0) - totalPrice,
            inventory: newBuyerInventory,
          })
          .where(eq(usersTable.id, buyer.id));

        await tx
          .update(usersTable)
          .set({
            balance: (seller.balance ?? 0) + totalPrice,
            inventory: newSellerInventory,
          })
          .where(eq(usersTable.id, seller.id));

        return {
          success: true,
          purchasedAmount: input.amount,
          sellingId: selling.id,
          buyerId: buyer.id,
          sellerId: seller.id,
          eventId: sellingEventId,
          eventType: sellingEventType,
          totalPrice,
        };
      });

      await Promise.all([
        logAction({
          userId: result.buyerId,
          type: "market_buy",
          eventId: result.eventId,
          eventType: result.eventType,
          amount: result.totalPrice,
          itemId: result.sellingId,
        }),
        logAction({
          userId: result.sellerId,
          type: "market_sell",
          eventId: result.eventId,
          eventType: result.eventType,
          amount: result.totalPrice,
          itemId: result.sellingId,
        }),
      ]);

      await Promise.all([
        giveXP({
          userId: result.buyerId,
          actionType: ActionType.MARKET_BUY,
        }),
        giveXP({
          userId: result.sellerId,
          actionType: ActionType.MARKET_SELL,
        }),
      ]);

      return {
        success: result.success,
        purchasedAmount: result.purchasedAmount,
        sellingId: result.sellingId,
        sellerId: result.sellerId,
        totalPrice: result.totalPrice,
      };
    }),

  getMyPurchases: procedure.query(async ({ ctx }) => {
    return await db.query.sellingTable.findMany({
      where: (fields, { sql }) => sql`${fields.buyersIds} ? ${ctx.userId.toString()}`,
      orderBy: [desc(sellingTable.createdAt)],
    });
  }),

  getItemStats: procedure
    .input(
      z.object({
        eventId: z.number(),
        eventType: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const allSellings = await db.query.sellingTable.findMany({
        where: and(
          eq(sellingTable.eventId, input.eventId),
          eq(sellingTable.eventType, input.eventType),
        ),
      });

      // Создаем массив последних 7 дней
      const last7Days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        last7Days.push(date.toISOString().split("T")[0]);
      }

      const pricesByDay: Record<string, number[]> = {};
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      let totalBuyers = 0;

      allSellings.forEach((selling) => {
        const buyers = selling.buyersIds || {};
        const buyersCount = Object.keys(buyers).length;

        // Только реальные покупки (не непроданные товары)
        if (buyersCount > 0) {
          Object.values(buyers).forEach((purchaseTimestamp) => {
            const dayKey = new Date(purchaseTimestamp).toISOString().split("T")[0];

            if (!pricesByDay[dayKey]) {
              pricesByDay[dayKey] = [];
            }

            pricesByDay[dayKey].push(selling.price || 0);
            minPrice = Math.min(minPrice, selling.price || 0);
            maxPrice = Math.max(maxPrice, selling.price || 0);
          });

          totalBuyers += buyersCount;
        }
      });

      // Создаем данные для всех 7 дней
      const priceRangePerDay = last7Days.map((day) => {
        const prices = pricesByDay[day] || [];

        if (prices.length > 0) {
          return {
            day,
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
            avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
            soldCount: prices.length,
          };
        } else {
          // День без продаж - показываем 0
          return {
            day,
            minPrice: 0,
            maxPrice: 0,
            avgPrice: 0,
            soldCount: 0,
          };
        }
      });

      return {
        minPrice: minPrice === Infinity ? 0 : minPrice,
        maxPrice: maxPrice === -Infinity ? 0 : maxPrice,
        totalBuyers,
        priceRangePerDay,
        allSellings,
      };
    }),
});

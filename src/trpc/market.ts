import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { sellingTable, usersTable } from "~/db/schema";
import { createTRPCRouter, procedure } from "./init";

export const marketRouter = createTRPCRouter({
  sellItem: procedure
    .input(
      z.object({
        type: z.enum(["ticket"]),
        eventId: z.number(),
        eventType: z.string(),
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

      const availableItems = userInventory.filter(
        (item) =>
          item.eventId === input.eventId &&
          item.name === input.eventType &&
          !item.isActive &&
          !item.isInSelling,
      );

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
          item.eventId === input.eventId &&
          item.name === input.eventType &&
          !item.isActive &&
          !item.isInSelling
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
        sellerId: z.number(),
        eventId: z.number(),
        eventType: z.string(),
        amount: z.number().min(1),
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

      const sellerUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, input.sellerId),
      });

      if (!sellerUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seller user not found",
        });
      }

      const selling = await db.query.sellingTable.findFirst({
        where: eq(sellingTable.id, input.sellingId),
      });

      if (!selling) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Selling not found",
        });
      }

      if (selling.amount! < input.amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not enough quantity",
        });
      }

      if (selling.price! * input.amount > user.balance!) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not enough balance",
        });
      }

      const isSellingFinished = selling.amount! - input.amount === 0;

      await db
        .update(sellingTable)
        .set({
          amount: selling.amount! - input.amount,
          buyersIds: {
            ...(selling.buyersIds || {}),
            [ctx.userId]: Date.now(),
          } as Record<number, number>,
          status: isSellingFinished ? "sold" : "selling",
        })
        .where(eq(sellingTable.id, input.sellingId));

      await db
        .update(usersTable)
        .set({
          balance: user.balance! - selling.price! * input.amount,
          inventory: [
            ...(user.inventory || []),
            ...Array(input.amount)
              .fill(0)
              .map(() => ({
                type: "ticket",
                eventId: selling.eventId!,
                eventType: selling.eventType!,
                isActive: false,
                id: Date.now(),
              })),
          ],
        })
        .where(eq(usersTable.id, ctx.userId!));

      const matchingInventory = (sellerUser.inventory || []).filter(
        (item) =>
          item.eventId === selling.eventId &&
          item.eventType === selling.eventType &&
          item.isInSelling === true,
      );

      const itemsToRemove = matchingInventory.slice(0, input.amount);

      const newSellerInventory = (sellerUser.inventory || []).filter(
        (item) =>
          !itemsToRemove.some(
            (removeItem) =>
              item.eventId === removeItem.eventId &&
              item.eventType === removeItem.eventType &&
              item.isInSelling === true &&
              item.id === removeItem.id,
          ),
      );

      await db
        .update(usersTable)
        .set({
          balance: sellerUser.balance! + selling.price! * input.amount,
          inventory: newSellerInventory,
        })
        .where(eq(usersTable.id, sellerUser.id!));

      return {
        success: true,
        newSellerInventory,
        newBuyerInventory: user.inventory,
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

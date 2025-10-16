import { TRPCError } from "@trpc/server";
import { desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { tradesTable, usersTable } from "~/db/schema";
import { createTRPCRouter, procedure } from "./init";

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

      const trade = await db
        .insert(tradesTable)
        .values({
          ...input,
          fromUserId: ctx.userId,
          toUserId: input.toUserId,
          status: "pending",
        })
        .returning();

      // Update user inventory to mark items as in trade
      if (input.eventIdOfGiving && input.typeOfGiving === "ticket") {
        await db
          .update(usersTable)
          .set({
            inventory: user.inventory?.map((item: any) =>
              item.eventId === input.eventIdOfGiving &&
              item.type === "ticket" &&
              item.name === input.eventTypeOfGiving
                ? { ...item, isInTrade: true }
                : item,
            ),
          })
          .where(eq(usersTable.id, ctx.userId));
      } else if (input.itemIdOfGiving) {
        await db
          .update(usersTable)
          .set({
            inventory: user.inventory?.map((item: any) =>
              item.id === input.itemIdOfGiving ? { ...item, isInTrade: true } : item,
            ),
          })
          .where(eq(usersTable.id, ctx.userId));
      }

      return trade[0];
    }),

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

      await db
        .update(tradesTable)
        .set({
          status: "completed",
        })
        .where(eq(tradesTable.id, input.tradeId));

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

      await db
        .update(tradesTable)
        .set({
          status: "rejected",
        })
        .where(eq(tradesTable.id, input.tradeId));

      return trade;
    }),
});

import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
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
    return await db.query.sellingTable.findMany();
  }),

  getMySellings: procedure.query(async ({ ctx }) => {
    return await db.query.sellingTable.findMany({
      where: eq(sellingTable.userId, ctx.userId),
      orderBy: [desc(sellingTable.createdAt)],
    });
  }),
});

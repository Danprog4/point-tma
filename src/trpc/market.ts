import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { sellingTable } from "~/db/schema";
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
      return await db.insert(sellingTable).values(input);
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

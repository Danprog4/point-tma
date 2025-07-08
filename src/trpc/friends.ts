import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { friendRequestsTable } from "~/db/schema";
import { createTRPCRouter, procedure } from "./init";

export const friendsRouter = createTRPCRouter({
  getRequests: procedure.query(async ({ ctx }) => {
    const requests = await db.query.friendRequestsTable.findMany({
      where: eq(friendRequestsTable.toUserId, ctx.userId),
    });

    return requests;
  }),

  sendRequest: procedure
    .input(
      z.object({
        userId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await db.insert(friendRequestsTable).values({
        fromUserId: ctx.userId,
        toUserId: input.userId,
      });

      return request;
    }),

  declineRequest: procedure
    .input(
      z.object({
        userId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await db
        .update(friendRequestsTable)
        .set({ status: "rejected" })
        .where(
          and(
            eq(friendRequestsTable.fromUserId, input.userId),
            eq(friendRequestsTable.toUserId, ctx.userId),
          ),
        );

      return request;
    }),

  acceptRequest: procedure
    .input(
      z.object({
        userId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await db
        .update(friendRequestsTable)
        .set({ status: "accepted" })
        .where(
          and(
            eq(friendRequestsTable.fromUserId, input.userId),
            eq(friendRequestsTable.toUserId, ctx.userId),
          ),
        );

      return request;
    }),
});

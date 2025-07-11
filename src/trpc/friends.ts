import { and, eq, or } from "drizzle-orm";
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

  getFriends: procedure.query(async ({ ctx }) => {
    const friends = await db.query.friendRequestsTable.findMany({
      where: or(
        eq(friendRequestsTable.toUserId, ctx.userId),
        eq(friendRequestsTable.fromUserId, ctx.userId),
      ),
    });

    const acceptedFriends = friends.filter((friend) => friend.status === "accepted");

    return acceptedFriends;
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

  unSendRequest: procedure
    .input(
      z.object({
        userId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await db
        .delete(friendRequestsTable)
        .where(
          and(
            eq(friendRequestsTable.fromUserId, ctx.userId),
            eq(friendRequestsTable.toUserId, input.userId),
          ),
        );

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

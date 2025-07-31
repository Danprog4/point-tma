import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { friendRequestsTable, notificationsTable } from "~/db/schema";
import { createTRPCRouter, procedure } from "./init";

export const friendsRouter = createTRPCRouter({
  getRequests: procedure.query(async ({ ctx }) => {
    const requests = await db.query.friendRequestsTable.findMany({
      where: eq(friendRequestsTable.toUserId, ctx.userId),
    });

    return requests;
  }),

  getFriends: procedure
    .input(z.object({ userId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const friends = await db.query.friendRequestsTable.findMany({
        where: or(
          eq(friendRequestsTable.toUserId, input?.userId || ctx.userId),
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
      const existing = await db.query.friendRequestsTable.findFirst({
        where: or(
          and(
            eq(friendRequestsTable.fromUserId, ctx.userId),
            eq(friendRequestsTable.toUserId, input.userId),
          ),
          and(
            eq(friendRequestsTable.fromUserId, input.userId),
            eq(friendRequestsTable.toUserId, ctx.userId),
          ),
        ),
      });

      if (existing) {
        if (
          existing.status === "pending" &&
          existing.fromUserId === input.userId &&
          existing.toUserId === ctx.userId
        ) {
          await db
            .update(friendRequestsTable)
            .set({ status: "accepted" })
            .where(eq(friendRequestsTable.id, existing.id));

          return { ...existing, status: "accepted" };
        }

        return existing;
      }

      const request = await db.insert(friendRequestsTable).values({
        fromUserId: ctx.userId,
        toUserId: input.userId,
      });

      await db.insert(notificationsTable).values({
        fromUserId: ctx.userId,
        toUserId: input.userId,
        type: "friend request",
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

      await db
        .delete(notificationsTable)
        .where(
          and(
            eq(notificationsTable.fromUserId, ctx.userId),
            eq(notificationsTable.toUserId, input.userId),
            eq(notificationsTable.type, "friend request"),
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

  unFriend: procedure
    .input(
      z.object({
        userId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const deleted = await db
        .delete(friendRequestsTable)
        .where(
          and(
            eq(friendRequestsTable.status, "accepted"),
            or(
              and(
                eq(friendRequestsTable.fromUserId, ctx.userId),
                eq(friendRequestsTable.toUserId, input.userId),
              ),
              and(
                eq(friendRequestsTable.fromUserId, input.userId),
                eq(friendRequestsTable.toUserId, ctx.userId),
              ),
            ),
          ),
        );

      return deleted;
    }),
});

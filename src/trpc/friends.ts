import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { friendRequestsTable, notificationTable } from "~/db/schema";
import { logAction } from "~/lib/utils/logger";
import { createTRPCRouter, procedure } from "./init";

export const friendsRouter = createTRPCRouter({
  getRequests: procedure.query(async ({ ctx }) => {
    const requests = await db.query.friendRequestsTable.findMany({
      where: eq(friendRequestsTable.toUserId, ctx.userId),
    });

    return requests;
  }),

  getNotifications: procedure.query(async ({ ctx }) => {
    const notifications = await db.query.notificationTable.findMany({
      where: eq(notificationTable.fromUserId, ctx.userId),
    });

    return notifications;
  }),

  markNotificationsAsRead: procedure.mutation(async ({ ctx }) => {
    await db
      .update(notificationTable)
      .set({ isRead: true })
      .where(
        and(
          eq(notificationTable.toUserId, ctx.userId),
          eq(notificationTable.isRead, false),
        ),
      );
    return { success: true };
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

      await db.insert(notificationTable).values({
        fromUserId: ctx.userId,
        toUserId: input.userId,
        type: "friend request",
      });

      await logAction({
        userId: ctx.userId,
        type: "friend_request_send",
        itemId: input.userId,
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
        .delete(notificationTable)
        .where(
          and(
            eq(notificationTable.fromUserId, ctx.userId),
            eq(notificationTable.toUserId, input.userId),
            eq(notificationTable.type, "friend request"),
          ),
        );
      await logAction({
        userId: ctx.userId,
        type: "friend_request_unsend",
        itemId: input.userId,
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
      await logAction({
        userId: ctx.userId,
        type: "friend_request_decline",
        itemId: input.userId,
      });
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
      await logAction({
        userId: ctx.userId,
        type: "friend_request_accept",
        itemId: input.userId,
      });
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
      await logAction({
        userId: ctx.userId,
        type: "friend_unfriend",
        itemId: input.userId,
      });
      return deleted;
    }),
});

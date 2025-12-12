import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import {
  notificationTable,
  privateAccessRequestsTable,
  privateProfileAccessTable,
  subscriptionsTable,
  usersTable,
} from "~/db/schema";
import { logAction } from "~/lib/utils/logger";
import { createTRPCRouter, procedure } from "./init";

export const privateProfileRouter = createTRPCRouter({
  togglePrivateMode: procedure
    .input(z.object({ isPrivate: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(usersTable)
        .set({ isPrivate: input.isPrivate })
        .where(eq(usersTable.id, ctx.userId));

      if (!input.isPrivate) {
        // If turning OFF private mode:
        // 1. Get all users who had private access
        const privateUsers = await db.query.privateProfileAccessTable.findMany({
          where: eq(privateProfileAccessTable.ownerId, ctx.userId),
          columns: { allowedUserId: true },
        });

        const privateUserIds = privateUsers.map((u) => u.allowedUserId);

        // 2. Clear private access records
        await db
          .delete(privateProfileAccessTable)
          .where(eq(privateProfileAccessTable.ownerId, ctx.userId));

        // 3. Clear private requests
        await db
          .delete(privateAccessRequestsTable)
          .where(eq(privateAccessRequestsTable.ownerId, ctx.userId));

        if (privateUserIds.length > 0) {
          // 4. Remove these users from subscriptionsTable as per requirement "he is not subscriber"
          // Filter out nulls just in case, though allowedUserId shouldn't be null
          const validIds = privateUserIds.filter((id): id is number => id !== null);

          if (validIds.length > 0) {
            await db
              .delete(subscriptionsTable)
              .where(
                and(
                  eq(subscriptionsTable.targetUserId, ctx.userId),
                  inArray(subscriptionsTable.subscriberId, validIds),
                ),
              );
          }
        }
      }

      await logAction({
        userId: ctx.userId,
        type: "private_mode_toggle",
        details: { from: String(!input.isPrivate), to: String(input.isPrivate) } as any,
      });

      return { success: true };
    }),

  sendRequest: procedure
    .input(z.object({ targetUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existingRequest = await db.query.privateAccessRequestsTable.findFirst({
        where: and(
          eq(privateAccessRequestsTable.ownerId, input.targetUserId),
          eq(privateAccessRequestsTable.requesterId, ctx.userId),
        ),
      });

      if (existingRequest) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Request already sent",
        });
      }

      const existingAccess = await db.query.privateProfileAccessTable.findFirst({
        where: and(
          eq(privateProfileAccessTable.ownerId, input.targetUserId),
          eq(privateProfileAccessTable.allowedUserId, ctx.userId),
        ),
      });

      if (existingAccess) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have access",
        });
      }

      await db.insert(privateAccessRequestsTable).values({
        ownerId: input.targetUserId,
        requesterId: ctx.userId,
      });

      await db.insert(notificationTable).values({
        fromUserId: ctx.userId,
        toUserId: input.targetUserId,
        type: "private_request",
        isRequest: true,
      });

      await logAction({
        userId: ctx.userId,
        type: "private_request_send",
        itemId: input.targetUserId,
      });

      return { success: true };
    }),

  cancelRequest: procedure
    .input(z.object({ targetUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(privateAccessRequestsTable)
        .where(
          and(
            eq(privateAccessRequestsTable.ownerId, input.targetUserId),
            eq(privateAccessRequestsTable.requesterId, ctx.userId),
          ),
        );

      // Remove the notification
      await db
        .delete(notificationTable)
        .where(
          and(
            eq(notificationTable.fromUserId, ctx.userId),
            eq(notificationTable.toUserId, input.targetUserId),
            eq(notificationTable.type, "private_request"),
          ),
        );

      await logAction({
        userId: ctx.userId,
        type: "private_request_cancel",
        itemId: input.targetUserId,
      });

      return { success: true };
    }),

  acceptRequest: procedure
    .input(z.object({ requesterId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Add to allowed list
      await db
        .insert(privateProfileAccessTable)
        .values({
          ownerId: ctx.userId,
          allowedUserId: input.requesterId,
        })
        .onConflictDoNothing();

      // 2. Add to subscriptions table (so "You are subscribed" works and they see updates)
      await db
        .insert(subscriptionsTable)
        .values({
          subscriberId: input.requesterId,
          targetUserId: ctx.userId,
        })
        .onConflictDoNothing();

      // 3. Delete request
      await db
        .delete(privateAccessRequestsTable)
        .where(
          and(
            eq(privateAccessRequestsTable.ownerId, ctx.userId),
            eq(privateAccessRequestsTable.requesterId, input.requesterId),
          ),
        );

      // 4. Send notification
      await db.insert(notificationTable).values({
        fromUserId: ctx.userId,
        toUserId: input.requesterId,
        type: "private_request_accepted",
        isRequest: false,
      });

      // Remove original request notification
      await db
        .delete(notificationTable)
        .where(
          and(
            eq(notificationTable.toUserId, ctx.userId),
            eq(notificationTable.fromUserId, input.requesterId),
            eq(notificationTable.type, "private_request"),
          ),
        );

      await logAction({
        userId: ctx.userId,
        type: "private_request_accept",
        itemId: input.requesterId,
      });

      return { success: true };
    }),

  rejectRequest: procedure
    .input(z.object({ requesterId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(privateAccessRequestsTable)
        .where(
          and(
            eq(privateAccessRequestsTable.ownerId, ctx.userId),
            eq(privateAccessRequestsTable.requesterId, input.requesterId),
          ),
        );

      await db.insert(notificationTable).values({
        fromUserId: ctx.userId,
        toUserId: input.requesterId,
        type: "private_request_rejected",
        isRequest: false,
      });

      // Remove original request notification
      await db
        .delete(notificationTable)
        .where(
          and(
            eq(notificationTable.toUserId, ctx.userId),
            eq(notificationTable.fromUserId, input.requesterId),
            eq(notificationTable.type, "private_request"),
          ),
        );

      await logAction({
        userId: ctx.userId,
        type: "private_request_reject",
        itemId: input.requesterId,
      });

      return { success: true };
    }),

  unsubscribe: procedure
    .input(z.object({ targetUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Remove from private access
      await db
        .delete(privateProfileAccessTable)
        .where(
          and(
            eq(privateProfileAccessTable.ownerId, input.targetUserId),
            eq(privateProfileAccessTable.allowedUserId, ctx.userId),
          ),
        );

      // Remove from subscriptions
      await db
        .delete(subscriptionsTable)
        .where(
          and(
            eq(subscriptionsTable.targetUserId, input.targetUserId),
            eq(subscriptionsTable.subscriberId, ctx.userId),
          ),
        );

      await logAction({
        userId: ctx.userId,
        type: "private_unsubscribe",
        itemId: input.targetUserId,
      });

      return { success: true };
    }),

  checkAccess: procedure
    .input(z.object({ targetUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.userId === input.targetUserId) return { hasAccess: true, isPending: false };

      const targetUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, input.targetUserId),
        columns: { isPrivate: true },
      });

      if (!targetUser?.isPrivate) return { hasAccess: true, isPending: false };

      const access = await db.query.privateProfileAccessTable.findFirst({
        where: and(
          eq(privateProfileAccessTable.ownerId, input.targetUserId),
          eq(privateProfileAccessTable.allowedUserId, ctx.userId),
        ),
      });

      if (access) return { hasAccess: true, isPending: false };

      const pending = await db.query.privateAccessRequestsTable.findFirst({
        where: and(
          eq(privateAccessRequestsTable.ownerId, input.targetUserId),
          eq(privateAccessRequestsTable.requesterId, ctx.userId),
        ),
      });

      return { hasAccess: false, isPending: !!pending };
    }),
});

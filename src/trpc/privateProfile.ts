import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import {
  notificationsTable,
  privateAccessRequestsTable,
  privateProfileAccessTable,
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
        // If turning OFF private mode, clear all access and requests
        await db
          .delete(privateProfileAccessTable)
          .where(eq(privateProfileAccessTable.ownerId, ctx.userId));
        await db
          .delete(privateAccessRequestsTable)
          .where(eq(privateAccessRequestsTable.ownerId, ctx.userId));
      }

      await logAction({
        userId: ctx.userId,
        type: "private_mode_toggle",
        details: { isPrivate: input.isPrivate },
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

      await db.insert(notificationsTable).values({
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

      // 2. Delete request
      await db
        .delete(privateAccessRequestsTable)
        .where(
          and(
            eq(privateAccessRequestsTable.ownerId, ctx.userId),
            eq(privateAccessRequestsTable.requesterId, input.requesterId),
          ),
        );

      // 3. Send notification
      await db.insert(notificationsTable).values({
        fromUserId: ctx.userId,
        toUserId: input.requesterId,
        type: "private_request_accepted",
      });
      
       // Remove original request notification
      await db
        .delete(notificationsTable)
        .where(
          and(
            eq(notificationsTable.toUserId, ctx.userId),
            eq(notificationsTable.fromUserId, input.requesterId),
            eq(notificationsTable.type, "private_request")
          )
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

      await db.insert(notificationsTable).values({
        fromUserId: ctx.userId,
        toUserId: input.requesterId,
        type: "private_request_rejected",
      });
      
       // Remove original request notification
      await db
        .delete(notificationsTable)
        .where(
          and(
            eq(notificationsTable.toUserId, ctx.userId),
            eq(notificationsTable.fromUserId, input.requesterId),
            eq(notificationsTable.type, "private_request")
          )
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
      await db
        .delete(privateProfileAccessTable)
        .where(
          and(
            eq(privateProfileAccessTable.ownerId, input.targetUserId),
            eq(privateProfileAccessTable.allowedUserId, ctx.userId),
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


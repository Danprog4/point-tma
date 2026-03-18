import { TRPCError } from "@trpc/server";
import { and, desc, eq, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import {
  notificationTable,
  privacyAudienceValues,
  privacyProfileAccessValues,
  privateAccessRequestsTable,
  privateProfileAccessTable,
  subscriptionsTable,
  usersTable,
} from "~/db/schema";
import {
  buildPrivacyViewerContext,
  canDiscoverUser,
  canSendMeetingInvite,
  clearPrivateAccessState,
  getGrantedPrivateAccess,
  getPendingPrivateRequests,
  getProfileAccessState,
  normalizePrivacySettings,
  toPrivacyAwareUserPreview,
} from "~/lib/privacy";
import { logAction } from "~/lib/utils/logger";
import { createTRPCRouter, procedure } from "./init";

const privacySettingsSchema = z.object({
  profileAccess: z.enum(privacyProfileAccessValues),
  discoverInPeople: z.enum(privacyAudienceValues),
  discoverInSearch: z.enum(privacyAudienceValues),
  meetingInvites: z.enum(privacyAudienceValues),
  friendRequests: z.enum(["everyone", "nobody"]),
  showActivity: z.enum(privacyAudienceValues),
  showOnlineStatus: z.enum(privacyAudienceValues),
  showCity: z.enum(privacyAudienceValues),
  showAge: z.enum(privacyAudienceValues),
});

export const privateProfileRouter = createTRPCRouter({
  getSettings: procedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.userId),
      columns: {
        isPrivate: true,
        privacySettings: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return normalizePrivacySettings(user.privacySettings, user.isPrivate);
  }),

  updateSettings: procedure
    .input(z.object({ settings: privacySettingsSchema }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
        columns: {
          id: true,
          isPrivate: true,
          privacySettings: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const previousSettings = normalizePrivacySettings(user.privacySettings, user.isPrivate);
      const nextSettings = normalizePrivacySettings(input.settings, input.settings.profileAccess !== "everyone");

      if (
        previousSettings.profileAccess === "request" &&
        nextSettings.profileAccess !== "request"
      ) {
        await clearPrivateAccessState(ctx.userId);
      }

      await db
        .update(usersTable)
        .set({
          isPrivate: nextSettings.profileAccess !== "everyone",
          privacySettings: nextSettings,
        })
        .where(eq(usersTable.id, ctx.userId));

      await logAction({
        userId: ctx.userId,
        type: "privacy_settings_update",
        details: {
          from: previousSettings,
          to: nextSettings,
        },
      });

      return nextSettings;
    }),

  togglePrivateMode: procedure
    .input(z.object({ isPrivate: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
        columns: {
          isPrivate: true,
          privacySettings: true,
        },
      });

      if (!currentUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const nextSettings = {
        ...normalizePrivacySettings(currentUser.privacySettings, currentUser.isPrivate),
        profileAccess: input.isPrivate ? "request" : "everyone",
      } as const;

      await db
        .update(usersTable)
        .set({
          isPrivate: input.isPrivate,
          privacySettings: nextSettings,
        })
        .where(eq(usersTable.id, ctx.userId));

      if (!input.isPrivate) {
        await clearPrivateAccessState(ctx.userId);
      }

      await logAction({
        userId: ctx.userId,
        type: "private_mode_toggle",
        details: { from: String(!input.isPrivate), to: String(input.isPrivate) },
      });

      return { success: true };
    }),

  sendRequest: procedure
    .input(z.object({ targetUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const viewerContext = await buildPrivacyViewerContext(ctx.userId);
      const targetUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, input.targetUserId),
      });

      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const accessState = await getProfileAccessState(viewerContext, targetUser);
      if (!accessState.canRequestAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Profile access requests are disabled for this user",
        });
      }

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

  getPendingRequests: procedure.query(async ({ ctx }) => {
    return getPendingPrivateRequests(ctx.userId);
  }),

  getGrantedUsers: procedure.query(async ({ ctx }) => {
    return getGrantedPrivateAccess(ctx.userId);
  }),

  revokeAccess: procedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(privateProfileAccessTable)
        .where(
          and(
            eq(privateProfileAccessTable.ownerId, ctx.userId),
            eq(privateProfileAccessTable.allowedUserId, input.userId),
          ),
        );

      await db
        .delete(subscriptionsTable)
        .where(
          and(
            eq(subscriptionsTable.targetUserId, ctx.userId),
            eq(subscriptionsTable.subscriberId, input.userId),
          ),
        );

      await logAction({
        userId: ctx.userId,
        type: "private_access_revoke",
        itemId: input.userId,
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
      const targetUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, input.targetUserId),
      });

      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const viewerContext = await buildPrivacyViewerContext(ctx.userId);
      return getProfileAccessState(viewerContext, targetUser);
    }),

  getUserProfile: procedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const targetUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, input.userId),
      });

      if (!targetUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const viewerContext = await buildPrivacyViewerContext(ctx.userId);
      const access = await getProfileAccessState(viewerContext, targetUser);
      const user = await toPrivacyAwareUserPreview(viewerContext, targetUser);

      return { user, access };
    }),

  getDiscoverableUsersPagination: procedure
    .input(
      z.object({
        limit: z.number().min(1).max(100),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const viewerContext = await buildPrivacyViewerContext(ctx.userId);
      const users = await db.query.usersTable.findMany({
        where: input.cursor ? lt(usersTable.id, input.cursor) : undefined,
        orderBy: [desc(usersTable.id)],
      });

      const visibleUsers = [];
      for (const user of users) {
        if (user.id === ctx.userId) continue;
        if (!(await canDiscoverUser(viewerContext, user, "people"))) continue;
        visibleUsers.push(await toPrivacyAwareUserPreview(viewerContext, user));
      }

      const sliced = visibleUsers.slice(0, input.limit + 1);
      const nextCursor =
        sliced.length > input.limit ? sliced[input.limit]?.id : undefined;

      return {
        items: sliced.slice(0, input.limit),
        nextCursor,
      };
    }),

  searchUsers: procedure
    .input(
      z.object({
        query: z.string().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const viewerContext = await buildPrivacyViewerContext(ctx.userId);
      const users = await db.query.usersTable.findMany({
        orderBy: [desc(usersTable.id)],
      });

      const normalizedQuery = input.query.trim().toLowerCase();
      const visibleUsers = [];

      for (const user of users) {
        if (user.id === ctx.userId) continue;
        if (!(await canDiscoverUser(viewerContext, user, "search"))) continue;

        const preview = await toPrivacyAwareUserPreview(viewerContext, user);
        if (normalizedQuery) {
          const haystack =
            `${preview.name || ""} ${preview.surname || ""} ${preview.city || ""}`.toLowerCase();
          if (!haystack.includes(normalizedQuery)) continue;
        }

        visibleUsers.push(preview);
      }

      return visibleUsers;
    }),

  searchInvitableUsers: procedure
    .input(
      z.object({
        query: z.string().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const viewerContext = await buildPrivacyViewerContext(ctx.userId);
      const users = await db.query.usersTable.findMany({
        orderBy: [desc(usersTable.id)],
      });
      const normalizedQuery = input.query.trim().toLowerCase();
      const visibleUsers = [];

      for (const user of users) {
        if (user.id === ctx.userId) continue;
        if (!(await canSendMeetingInvite(viewerContext, user))) continue;
        const preview = await toPrivacyAwareUserPreview(viewerContext, user);
        if (normalizedQuery) {
          const haystack =
            `${preview.name || ""} ${preview.surname || ""} ${preview.city || ""}`.toLowerCase();
          if (!haystack.includes(normalizedQuery)) continue;
        }
        visibleUsers.push(preview);
      }

      return visibleUsers;
    }),
});

import { TRPCError } from "@trpc/server";
import { and, asc, eq, gt, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import {
  meetMessagesTable,
  meetParticipantsTable,
  meetTable,
  notificationsTable,
  usersTable,
} from "~/db/schema";
import { uploadBase64Image } from "~/lib/s3/uploadBase64";
import { getMeetings } from "~/lib/utils/getMeetings";
import { createTRPCRouter, procedure } from "./init";

export const meetingRouter = createTRPCRouter({
  createMeeting: procedure
    .input(
      z.object({
        date: z.string(),
        name: z.string(),
        description: z.string(),
        type: z.string(),
        subType: z.string().optional(),
        isBig: z.boolean().optional(),
        participants: z.number().optional(),
        locations: z
          .array(
            z.object({
              location: z.string(),
              address: z.string(),
              starttime: z.string().optional(),
              endtime: z.string().optional(),
              isCustom: z.boolean().optional(),
            }),
          )
          .optional(),
        reward: z.number().optional(),
        image: z.string().optional(),
        invitedId: z.string().optional(),
        gallery: z.array(z.string()).optional(),
        inventory: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        subType,
        name,
        description,
        type,
        isBig,
        invitedId,
        date,
        locations,
        reward,
        image,
        participants,
        gallery,
        inventory,
      } = input;
      const { userId } = ctx;

      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, userId),
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      let imageUrl = null;

      if (image) {
        imageUrl = await uploadBase64Image(image);
      }

      let itemsWithInfo = null;
      if (inventory) {
        itemsWithInfo = user.inventory?.filter((item) =>
          inventory.includes(item?.id?.toString() ?? ""),
        );
      }

      const [meet] = await db
        .insert(meetTable)
        .values({
          description,
          type,
          name,
          participantsIds: invitedId ? [parseInt(invitedId), user.id] : [user.id],
          userId: user.id,
          gallery,
          locations,
          subType,
          reward,
          items: itemsWithInfo,
          image: imageUrl,
          isBig,
          date,
          maxParticipants: participants,
        })
        .returning();

      if (inventory) {
        const newInventory = user.inventory?.filter(
          (item) => !inventory.includes(item?.id?.toString() ?? ""),
        );

        await db
          .update(usersTable)
          .set({
            inventory: newInventory,
          })
          .where(eq(usersTable.id, user.id));
      }

      if (reward) {
        await db
          .update(usersTable)
          .set({
            balance: (user.balance ?? 0) - reward * (participants ?? 0),
          })
          .where(eq(usersTable.id, user.id));
      }

      await db.insert(meetParticipantsTable).values({
        fromUserId: user.id,
        toUserId: user.id,
        meetId: meet.id,
        status: "accepted",
        isRequest: true,
      });

      return meet;
    }),

  getMeetings: procedure
    .input(z.object({ userId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = input?.userId;

      if (userId) {
        const meetings = await db.query.meetTable.findMany({
          where: eq(meetTable.userId, userId),
        });

        return meetings;
      } else {
        const meetings = await db.query.meetTable.findMany({});

        return meetings;
      }
    }),

  inviteUsers: procedure
    .input(
      z.object({
        meetId: z.number(),
        userIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { meetId, userIds } = input;

      const meet = await db.query.meetTable.findFirst({
        where: eq(meetTable.id, meetId),
      });

      if (!meet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });
      }

      const isOwner = await db.query.meetTable.findFirst({
        where: and(eq(meetTable.id, meetId), eq(meetTable.userId, ctx.userId)),
      });
      if (!isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not the owner of this meet",
        });
      }

      const existingRequests = await db.query.meetParticipantsTable.findMany({
        where: and(
          eq(meetParticipantsTable.meetId, meetId),
          eq(meetParticipantsTable.fromUserId, ctx.userId),
          inArray(meetParticipantsTable.toUserId, userIds),
          eq(meetParticipantsTable.status, "pending"),
        ),
      });

      const existingUserIds = existingRequests.map((req) => req.toUserId);
      const newUserIds = userIds.filter((userId) => !existingUserIds.includes(userId));

      const rows = newUserIds.map((toUserId) => ({
        fromUserId: ctx.userId,
        toUserId,
        meetId,
        status: "pending" as const,
        isRequest: false,
      }));

      if (rows.length) {
        await db.insert(meetParticipantsTable).values(rows).onConflictDoNothing();

        const notificationRows = newUserIds.map((toUserId) => ({
          fromUserId: ctx.userId,
          toUserId,
          type: "meet invite" as const,
          meetId,
          isRequest: false,
        }));

        await db.insert(notificationsTable).values(notificationRows);
      }
    }),

  getInvites: procedure.query(async ({ ctx }) => {
    return db.query.meetParticipantsTable.findMany({
      where: and(
        eq(meetParticipantsTable.toUserId, ctx.userId),
        eq(meetParticipantsTable.status, "pending"),
      ),
    });
  }),

  getMeetingsWithEvents: procedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    const meetings = await db.query.meetTable.findMany({});

    const meetingsWithEvents = getMeetings(meetings);

    return meetingsWithEvents;
  }),

  getMeetingById: procedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const meeting = await db.query.meetTable.findFirst({
        where: eq(meetTable.id, id),
      });

      return meeting;
    }),

  joinMeeting: procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const meet = await db.query.meetTable.findFirst({
        where: eq(meetTable.id, id),
      });

      if (!meet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });
      }

      const meetParticipant = await db.insert(meetParticipantsTable).values({
        fromUserId: user.id,
        toUserId: meet.userId,
        meetId: meet.id,
        status: "pending",
        isRequest: true,
      });

      await db.insert(notificationsTable).values({
        fromUserId: user.id,
        toUserId: meet.userId,
        type: "meet request",
        meetId: meet.id,
        isRequest: true,
      });

      return meetParticipant;
    }),

  getRequests: procedure.query(async ({ ctx }) => {
    const requests = await db.query.meetParticipantsTable.findMany({});

    return requests;
  }),

  getParticipants: procedure.query(async ({ ctx }) => {
    const participants = await db.query.meetParticipantsTable.findMany({
      where: or(
        eq(meetParticipantsTable.fromUserId, ctx.userId),
        eq(meetParticipantsTable.toUserId, ctx.userId),
      ),
    });

    return participants;
  }),

  deleteParticipant: procedure
    .input(z.object({ userId: z.number(), meetId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const participant = await db.query.meetParticipantsTable.findFirst({
        where: and(
          eq(meetParticipantsTable.meetId, input.meetId),
          eq(meetParticipantsTable.status, "accepted"),
          or(
            and(
              eq(meetParticipantsTable.fromUserId, input.userId),
              eq(meetParticipantsTable.toUserId, ctx.userId),
            ),
            and(
              eq(meetParticipantsTable.fromUserId, ctx.userId),
              eq(meetParticipantsTable.toUserId, input.userId),
            ),
          ),
        ),
      });
      if (!participant)
        throw new TRPCError({ code: "NOT_FOUND", message: "Participant not found" });

      await db
        .delete(meetParticipantsTable)
        .where(eq(meetParticipantsTable.id, participant.id));

      const meet = await db.query.meetTable.findFirst({
        where: eq(meetTable.id, input.meetId),
      });
      if (!meet) throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });

      await db
        .update(meetTable)
        .set({
          participantsIds: (meet.participantsIds || []).filter((p) => p !== input.userId),
        })
        .where(eq(meetTable.id, input.meetId));

      return participant;
    }),

  sendRequest: procedure
    .input(
      z.object({
        meetId: z.number(),
        toUserId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await db.insert(meetParticipantsTable).values({
        fromUserId: ctx.userId,
        toUserId: input.toUserId,
        meetId: input.meetId,
        status: "pending",
        isRequest: true,
      });

      await db.insert(notificationsTable).values({
        fromUserId: ctx.userId,
        toUserId: input.toUserId,
        type: "meet request",
        meetId: input.meetId,
        isRequest: true,
      });

      return request;
    }),

  unSendRequest: procedure
    .input(
      z.object({
        meetId: z.number(),
        toUserId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await db
        .delete(meetParticipantsTable)
        .where(
          and(
            eq(meetParticipantsTable.fromUserId, ctx.userId),
            eq(meetParticipantsTable.toUserId, input.toUserId),
            eq(meetParticipantsTable.meetId, input.meetId),
          ),
        );

      await db
        .delete(notificationsTable)
        .where(
          and(
            eq(notificationsTable.fromUserId, ctx.userId),
            eq(notificationsTable.toUserId, input.toUserId),
            eq(notificationsTable.type, "meet request"),
            eq(notificationsTable.meetId, input.meetId),
          ),
        );
      return request;
    }),

  declineRequest: procedure
    .input(
      z.object({
        meetId: z.number(),
        fromUserId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await db
        .update(meetParticipantsTable)
        .set({ status: "rejected" })
        .where(
          and(
            eq(meetParticipantsTable.fromUserId, input.fromUserId),
            eq(meetParticipantsTable.toUserId, ctx.userId),
            eq(meetParticipantsTable.meetId, input.meetId),
            eq(meetParticipantsTable.status, "pending"),
          ),
        );

      return request;
    }),

  acceptRequest: procedure
    .input(
      z.object({
        meetId: z.number(),
        fromUserId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Получаем текущую запись о заявке/приглашении, чтобы понять её тип
      const participantRow = await db.query.meetParticipantsTable.findFirst({
        where: and(
          eq(meetParticipantsTable.fromUserId, input.fromUserId),
          eq(meetParticipantsTable.toUserId, ctx.userId),
          eq(meetParticipantsTable.meetId, input.meetId),
          eq(meetParticipantsTable.status, "pending"),
        ),
      });

      if (!participantRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      // Обновляем статус на accepted
      const request = await db
        .update(meetParticipantsTable)
        .set({ status: "accepted" })
        .where(eq(meetParticipantsTable.id, participantRow.id));

      const meet = await db.query.meetTable.findFirst({
        where: eq(meetTable.id, input.meetId),
      });

      if (!meet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });
      }

      // Для заявки (isRequest = true) в участники добавляем fromUserId,
      // для приглашения (isRequest = false) — текущего пользователя (ctx.userId)
      const participantIdToAdd = participantRow.isRequest ? input.fromUserId : ctx.userId;

      const newParticipantsIds = Array.from(
        new Set([...(meet.participantsIds || []), participantIdToAdd.toString()]),
      );

      await db
        .update(meetTable)
        .set({
          participantsIds: newParticipantsIds.map((p) =>
            typeof p === "string" ? parseInt(p) : p,
          ),
        })
        .where(eq(meetTable.id, input.meetId));

      return request;
    }),

  leaveMeeting: procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const request = await db
        .delete(meetParticipantsTable)
        .where(
          and(
            or(
              eq(meetParticipantsTable.fromUserId, ctx.userId),
              eq(meetParticipantsTable.toUserId, ctx.userId),
            ),
            eq(meetParticipantsTable.meetId, id),
          ),
        );

      const meet = await db.query.meetTable.findFirst({
        where: eq(meetTable.id, id),
      });

      if (!meet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });
      }

      if (meet.participantsIds) {
        const newParticipantsIds = meet.participantsIds.filter(
          (uid) => uid !== ctx.userId,
        );

        await db
          .update(meetTable)
          .set({ participantsIds: newParticipantsIds })
          .where(eq(meetTable.id, id));
      }

      return request;
    }),

  endMeeting: procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      const request = await db
        .update(meetTable)
        .set({ isCompleted: true })
        .where(eq(meetTable.id, id));

      // TODO: Send notification to participants that the meet was ended

      return request;
    }),

  // Chat ------------------------------------------------------------------

  sendMessage: procedure
    .input(
      z.object({
        meetId: z.number(),
        message: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { meetId, message } = input;

      // Rate limit: max 2 messages per minute per user
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

      const recentMessages = await db.query.meetMessagesTable.findMany({
        where: and(
          eq(meetMessagesTable.meetId, meetId),
          eq(meetMessagesTable.userId, ctx.userId),
          gt(meetMessagesTable.createdAt, oneMinuteAgo),
        ),
      });

      if (recentMessages.length >= 2) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Можно отправлять не более 2 сообщений в минуту",
        });
      }

      const [msg] = await db
        .insert(meetMessagesTable)
        .values({
          meetId,
          userId: ctx.userId,
          message,
        })
        .returning();

      return msg;
    }),

  getMessages: procedure
    .input(z.object({ meetId: z.number() }))
    .query(async ({ input }) => {
      const messages = await db.query.meetMessagesTable.findMany({
        where: eq(meetMessagesTable.meetId, input.meetId),
        orderBy: asc(meetMessagesTable.createdAt),
      });

      return messages;
    }),
});

export type Router = typeof meetingRouter;

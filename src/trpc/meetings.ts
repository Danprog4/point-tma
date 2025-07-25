import { TRPCError } from "@trpc/server";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import {
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
        name: z.string(),
        description: z.string(),
        type: z.string().optional(),

        invitedId: z.string().optional(),
        idOfEvent: z.number().optional(),
        typeOfEvent: z.string().optional(),
        isCustom: z.boolean().optional(),
        image: z.string().optional(),
        participants: z.number().optional(),
        location: z.string().optional(),
        reward: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        name,
        description,
        type,

        invitedId,
        idOfEvent,
        typeOfEvent,
        participants,
        location,
        reward,
        image,
        isCustom,
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

      const [meet] = await db
        .insert(meetTable)
        .values({
          description,
          type,

          participantsIds: invitedId ? [invitedId] : [],
          idOfEvent,
          typeOfEvent,
          userId: user.id,

          location,
          reward,
          image: imageUrl,
          isCustom,
        })
        .returning();

      await db.insert(meetParticipantsTable).values({
        fromUserId: user.id,
        toUserId: user.id,
        meetId: meet.id,
        status: "accepted",
        isCreator: true,
      });

      return meet;
    }),

  getMeetings: procedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    const meetings = await db.query.meetTable.findMany({});

    return meetings;
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

      const isParticipant = await db.query.meetParticipantsTable.findFirst({
        where: and(
          eq(meetParticipantsTable.meetId, meetId),
          eq(meetParticipantsTable.toUserId, ctx.userId),
        ),
      });

      if (!isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant of this meet",
        });
      }

      const rows = userIds.map((toUserId) => ({
        fromUserId: ctx.userId,
        toUserId,
        meetId,
        status: "pending" as const,
        isCreator: true,
      }));

      if (rows.length) {
        await db.insert(meetParticipantsTable).values(rows).onConflictDoNothing();

        const notificationRows = userIds.map((toUserId) => ({
          fromUserId: ctx.userId,
          toUserId,
          type: "meet invite" as const,
          meetId,
          isCreator: true,
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
      });

      await db.insert(notificationsTable).values({
        fromUserId: user.id,
        toUserId: meet.userId,
        type: "meet request",
        meetId: meet.id,
        isCreator: false,
      });

      return meetParticipant;
    }),

  getRequests: procedure.query(async ({ ctx }) => {
    const requests = await db.query.meetParticipantsTable.findMany({
      where: eq(meetParticipantsTable.toUserId, ctx.userId),
    });

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
      });

      await db.insert(notificationsTable).values({
        fromUserId: ctx.userId,
        toUserId: input.toUserId,
        type: "meet request",
        meetId: input.meetId,
        isCreator: false,
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
      const request = await db
        .update(meetParticipantsTable)
        .set({ status: "accepted" })
        .where(
          and(
            eq(meetParticipantsTable.fromUserId, input.fromUserId),
            eq(meetParticipantsTable.toUserId, ctx.userId),
            eq(meetParticipantsTable.meetId, input.meetId),
          ),
        );

      const meet = await db.query.meetTable.findFirst({
        where: eq(meetTable.id, input.meetId),
      });

      if (!meet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });
      }

      const newParticipantsIds = [
        ...(meet.participantsIds || []),
        input.fromUserId.toString(),
      ];

      await db
        .update(meetTable)
        .set({
          participantsIds: newParticipantsIds,
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
            eq(meetParticipantsTable.fromUserId, ctx.userId),
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
          (uid) => uid !== ctx.userId.toString(),
        );

        await db
          .update(meetTable)
          .set({ participantsIds: newParticipantsIds })
          .where(eq(meetTable.id, id));
      }

      return request;
    }),
});

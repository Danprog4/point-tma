import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { meetParticipantsTable, meetTable, usersTable } from "~/db/schema";
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
        invited: z.array(z.string()).optional(),
        locations: z.array(z.string()).optional(),
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
        invited,
        locations,
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

      const meet = await db.insert(meetTable).values({
        name,
        description,
        type,
        invited,
        locations,
        idOfEvent,
        typeOfEvent,
        userId: user.id,
        participants,
        location,
        reward,
        image: imageUrl,
        isCustom,
      });

      return meet;
    }),

  getMeetings: procedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    const meetings = await db.query.meetTable.findMany({});

    return meetings;
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
      where: eq(meetParticipantsTable.fromUserId, ctx.userId),
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

      return request;
    }),
});

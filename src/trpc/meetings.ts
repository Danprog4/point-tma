import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { meetTable, usersTable } from "~/db/schema";
import { createTRPCRouter, procedure } from "./init";

export const meetingRouter = createTRPCRouter({
  createMeeting: procedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        type: z.string(),
        invited: z.array(z.string()).optional(),
        locations: z.array(z.string()).optional(),
        idOfEvent: z.number(),
        typeOfEvent: z.string(),
        numberOfParticipants: z.number().optional(),
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
        numberOfParticipants,
      } = input;
      const { userId } = ctx;

      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, userId),
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
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
        numberOfParticipants,
      });

      return meet;
    }),

  getMeetings: procedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    const meetings = await db.query.meetTable.findMany({
      where: eq(meetTable.userId, userId),
    });

    return meetings;
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
});

import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import {
  calendarTable,
  fastMeetParticipantsTable,
  fastMeetTable,
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
        invitedIds: z.array(z.number()).optional(),
        gallery: z.array(z.string()).optional(),
        inventory: z.array(z.string()).optional(),
        important: z.string().optional(),
        calendarDate: z.string().optional(),
        time: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        subType,
        name,
        description,
        type,
        isBig,
        invitedIds,
        date,
        locations,
        reward,
        image,
        participants,
        gallery,
        inventory,
        important,
        calendarDate,
        time,
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
          participantsIds: invitedIds ? [...invitedIds, user.id] : [user.id],
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
          important,
          time,
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

      if (time && date) {
        await db.insert(calendarTable).values({
          userId: user.id,
          meetId: meet.id,
          date: new Date(date.split(".").reverse().join("-")),
        });
      }

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

  getMeetingsPagination: procedure

    .input(
      z.object({
        limit: z.number(),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const meetings = await db.query.meetTable.findMany({
        where: cursor ? gt(meetTable.id, cursor) : undefined,
        limit: limit + 1,
        orderBy: [desc(meetTable.id)],
      });

      let nextCursor: number | undefined = undefined;
      if (meetings.length > limit) {
        const nextItem = meetings.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: meetings,
        nextCursor,
      };
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

  joinFastMeet: procedure
    .input(z.object({ meetId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { meetId } = input;

      const meet = await db.query.fastMeetTable.findFirst({
        where: eq(fastMeetTable.id, meetId),
      });

      if (!meet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });
      }

      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const existingParticipant = await db.query.fastMeetParticipantsTable.findFirst({
        where: and(
          eq(fastMeetParticipantsTable.meetId, meetId),
          eq(fastMeetParticipantsTable.userId, ctx.userId),
        ),
      });

      if (existingParticipant) {
        await db
          .delete(fastMeetParticipantsTable)
          .where(
            and(
              eq(fastMeetParticipantsTable.meetId, meetId),
              eq(fastMeetParticipantsTable.userId, ctx.userId),
            ),
          );

        return;
      }

      const participant = await db.insert(fastMeetParticipantsTable).values({
        meetId,
        userId: ctx.userId,
        status: "pending",
      });

      return participant;
    }),

  acceptFastMeet: procedure
    .input(z.object({ meetId: z.number(), userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { meetId, userId } = input;

      const meet = await db.query.fastMeetTable.findFirst({
        where: eq(fastMeetTable.id, meetId),
      });

      if (!meet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });
      }

      const participant = await db.query.fastMeetParticipantsTable.findFirst({
        where: and(
          eq(fastMeetParticipantsTable.meetId, meetId),
          eq(fastMeetParticipantsTable.userId, userId),
        ),
      });

      if (!participant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Participant not found" });
      }

      await db
        .update(fastMeetParticipantsTable)
        .set({ status: "accepted" })
        .where(eq(fastMeetParticipantsTable.id, participant.id));

      return participant;
    }),

  declineFastMeet: procedure

    .input(z.object({ meetId: z.number(), userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { meetId, userId } = input;

      const meet = await db.query.fastMeetTable.findFirst({
        where: eq(fastMeetTable.id, meetId),
      });

      if (!meet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });
      }

      const participant = await db.query.fastMeetParticipantsTable.findFirst({
        where: and(
          eq(fastMeetParticipantsTable.meetId, meetId),
          eq(fastMeetParticipantsTable.userId, userId),
        ),
      });

      if (!participant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Participant not found" });
      }

      await db
        .update(fastMeetParticipantsTable)
        .set({ status: "rejected" })
        .where(eq(fastMeetParticipantsTable.id, participant.id));

      return participant;
    }),

  getFastMeetParticipants: procedure
    .input(z.object({ meetId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const meetId = input?.meetId;

      if (meetId) {
        const participants = await db.query.fastMeetParticipantsTable.findMany({
          where: eq(fastMeetParticipantsTable.meetId, meetId),
        });

        return participants;
      } else {
        const participants = await db.query.fastMeetParticipantsTable.findMany({});

        return participants;
      }
    }),

  createFastMeet: procedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        city: z.string(),
        locations: z.array(
          z.object({
            location: z.string(),
            starttime: z.string().optional(),
            endtime: z.string().optional(),
            address: z.string(),
            coordinates: z.tuple([z.number(), z.number()]).optional(),
          }),
        ),
        type: z.string(),
        subType: z.string(),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { name, description, locations, type, subType, tags, city } = input;

      if (!locations[0]?.coordinates) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Location coordinates are required",
        });
      }

      const [fastMeet] = await db.insert(fastMeetTable).values({
        name,
        description,
        city,
        locations: locations.map((location) => ({
          ...location,
          coordinates: location.coordinates || ([0, 0] as [number, number]),
        })),
        coordinates: locations[0]?.coordinates as [number, number],
        userId: ctx.userId,
        createdAt: new Date(),
        type,
        subType,
        tags,
      });

      await db
        .delete(fastMeetParticipantsTable)
        .where(
          and(
            eq(fastMeetParticipantsTable.userId, ctx.userId),
            eq(fastMeetParticipantsTable.status, "pending"),
          ),
        );

      return fastMeet;
    }),

  getFastMeets: procedure.query(async ({ ctx }) => {
    const fastMeets = await db.query.fastMeetTable.findMany({});
    return fastMeets;
  }),

  deleteUserFromFastMeet: procedure
    .input(
      z.object({
        meetId: z.number(),
        userId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { meetId, userId } = input;
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const meet = await db.query.fastMeetTable.findFirst({
        where: eq(fastMeetTable.id, meetId),
      });

      if (!meet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });
      }

      if (meet.userId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not the owner of this meet",
        });
      }

      const participant = await db
        .delete(fastMeetParticipantsTable)
        .where(
          and(
            eq(fastMeetParticipantsTable.userId, userId),
            eq(fastMeetParticipantsTable.meetId, meetId),
          ),
        );

      return participant;
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
        meetId: z.number().optional(),
        fastMeetId: z.number().optional(),
        message: z.string().max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { meetId, fastMeetId, message } = input;

      // Ensure at least one ID is provided
      if (!meetId && !fastMeetId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Either meetId or fastMeetId must be provided",
        });
      }

      // Rate limit: max 2 messages per minute per user
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

      let recentMessages = [];

      if (meetId) {
        recentMessages = await db.query.meetMessagesTable.findMany({
          where: and(
            eq(meetMessagesTable.meetId, meetId),
            eq(meetMessagesTable.userId, ctx.userId),
            gt(meetMessagesTable.createdAt, oneMinuteAgo),
          ),
        });
      } else if (fastMeetId) {
        recentMessages = await db.query.meetMessagesTable.findMany({
          where: and(
            eq(meetMessagesTable.fastMeetId, fastMeetId),
            eq(meetMessagesTable.userId, ctx.userId),
            gt(meetMessagesTable.createdAt, oneMinuteAgo),
          ),
        });
      }

      if (recentMessages.length >= 2) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Можно отправлять не более 2 сообщений в минуту",
        });
      }

      if (meetId) {
        const [msg] = await db
          .insert(meetMessagesTable)
          .values({
            meetId,
            userId: ctx.userId,
            message,
          })
          .returning();

        return msg;
      }

      if (fastMeetId) {
        const [fastMeetMsg] = await db
          .insert(meetMessagesTable)
          .values({
            fastMeetId,
            userId: ctx.userId,
            message,
          })
          .returning();

        return fastMeetMsg;
      }
    }),

  editFastMeet: procedure
    .input(
      z.object({
        meetId: z.number(),
        name: z.string(),
        description: z.string(),
        city: z.string(),
        locations: z.array(
          z.object({
            location: z.string(),
            address: z.string(),
            coordinates: z.tuple([z.number(), z.number()]),
          }),
        ),
        coordinates: z.tuple([z.number(), z.number()]),
        type: z.string(),
        subType: z.string(),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        meetId,
        name,
        description,
        locations,
        coordinates,
        type,
        subType,
        tags,
        city,
      } = input;

      const meet = await db.query.fastMeetTable.findFirst({
        where: eq(fastMeetTable.id, meetId),
      });

      if (!meet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });
      }

      await db
        .update(fastMeetTable)
        .set({
          name,
          description,
          locations: locations.map((l) => ({
            location: l.location,
            address: l.address,
            coordinates: l.coordinates as [number, number],
          })),
          coordinates: coordinates as [number, number],
          type,
          subType,
          tags,
          city,
        })
        .where(eq(fastMeetTable.id, meetId));

      return meet;
    }),

  getMessages: procedure
    .input(z.object({ meetId: z.number().optional(), fastMeetId: z.number().optional() }))
    .query(async ({ input }) => {
      const messages = await db.query.meetMessagesTable.findMany({
        where: and(
          or(
            eq(meetMessagesTable.meetId, input.meetId ?? 0),
            eq(meetMessagesTable.fastMeetId, input.fastMeetId ?? 0),
          ),
        ),
        orderBy: asc(meetMessagesTable.createdAt),
      });

      return messages;
    }),

  deleteFastMeet: procedure
    .input(z.object({ meetId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { meetId } = input;

      const meet = await db.query.fastMeetTable.findFirst({
        where: eq(fastMeetTable.id, meetId),
      });

      if (!meet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });
      }

      if (meet.userId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can't delete this meet",
        });
      }

      await db.delete(fastMeetTable).where(eq(fastMeetTable.id, meetId));

      await db
        .delete(fastMeetParticipantsTable)
        .where(eq(fastMeetParticipantsTable.meetId, meetId));

      return true;
    }),

  leaveFastMeet: procedure
    .input(z.object({ meetId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { meetId } = input;

      const meet = await db.query.fastMeetTable.findFirst({
        where: eq(fastMeetTable.id, meetId),
      });

      if (!meet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });
      }

      if (meet.userId === ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can't leave your own meet",
        });
      }

      const request = await db
        .delete(fastMeetParticipantsTable)
        .where(
          and(
            eq(fastMeetParticipantsTable.meetId, meetId),
            eq(fastMeetParticipantsTable.userId, ctx.userId),
          ),
        );

      return request;
    }),

  updateMeeting: procedure
    .input(
      z.object({
        id: z.number(),
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
        invitedIds: z.array(z.number()).optional(),
        gallery: z.array(z.string()).optional(),
        inventory: z.array(z.string()).optional(),
        important: z.string().optional(),
        calendarDate: z.string().optional(),
        time: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        id,
        subType,
        name,
        description,
        type,
        isBig,
        invitedIds,
        date,
        locations,
        reward,
        image,
        participants,
        gallery,
        inventory,
        important,
        calendarDate,
        time,
      } = input;
      const { userId } = ctx;

      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, userId),
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Check if user owns the meeting
      const existingMeet = await db.query.meetTable.findFirst({
        where: and(eq(meetTable.id, id), eq(meetTable.userId, userId)),
      });

      if (!existingMeet) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own meetings",
        });
      }

      let imageUrl = existingMeet.image;

      if (image && image !== existingMeet.image) {
        imageUrl = await uploadBase64Image(image);
      }

      let itemsWithInfo = null;
      if (inventory) {
        itemsWithInfo = user.inventory?.filter((item) =>
          inventory.includes(item?.id?.toString() ?? ""),
        );
      }

      const [meet] = await db
        .update(meetTable)
        .set({
          description,
          type,
          name,
          participantsIds: invitedIds ? [...invitedIds, user.id] : [user.id],
          gallery,
          locations,
          subType,
          reward,
          items: itemsWithInfo,
          image: imageUrl,
          isBig,
          date,
          maxParticipants: participants,
          important,
          time,
        })
        .where(eq(meetTable.id, id))
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

      // Update calendar entry if time and date are provided
      if (time && date) {
        await db
          .update(calendarTable)
          .set({
            date: new Date(date.split(".").reverse().join("-")),
          })
          .where(and(eq(calendarTable.userId, user.id), eq(calendarTable.meetId, id)));
      }

      return meet;
    }),
});

export type Router = typeof meetingRouter;

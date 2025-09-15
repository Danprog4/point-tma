import { TRPCError } from "@trpc/server";
import { count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import {
  activeEventsTable,
  calendarTable,
  casesTable,
  complaintsTable,
  eventsTable,
  fastMeetParticipantsTable,
  fastMeetTable,
  favoritesTable,
  friendRequestsTable,
  historyTable,
  meetMessagesTable,
  meetParticipantsTable,
  meetTable,
  notificationsTable,
  ratingsUserTable,
  reviewsTable,
  subscriptionsTable,
  usersTable,
} from "~/db/schema";
import { uploadBase64Image } from "~/lib/s3/uploadBase64";
import { sendTelegram } from "~/lib/utils/sendTelegram";
import { createTRPCRouter, creatorProcedure, crmProcedure } from "./init";

export const crmRouter = createTRPCRouter({
  // ===== ПОЛЬЗОВАТЕЛИ =====
  getUsers: crmProcedure.query(async () => {
    return await db.query.usersTable.findMany({
      orderBy: [desc(usersTable.id)],
    });
  }),

  getUser: crmProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, Number(input.id)),
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    return user;
  }),

  createUser: crmProcedure
    .input(
      z.object({
        name: z.string(),
        surname: z.string().optional(),
        login: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        city: z.string().optional(),
        sex: z.string().optional(),
        birthday: z.string().optional(),
        bio: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const newUser = await db
        .insert(usersTable)
        .values({
          id: Date.now(), // Простой способ генерации ID
          name: input.name,
          surname: input.surname,
          login: input.login,
          email: input.email,
          phone: input.phone,
          city: input.city,
          sex: input.sex,
          birthday: input.birthday,
          bio: input.bio,
          balance: 0,
          inventory: [],
          gallery: [],
          isOnboarded: false,
        })
        .returning();
      return newUser[0];
    }),

  updateUser: crmProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        surname: z.string().optional(),
        login: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        city: z.string().optional(),
        sex: z.string().optional(),
        birthday: z.string().optional(),
        bio: z.string().optional(),
        balance: z.number().optional(),
        photo: z.string().optional(),
        gallery: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const imageUUID = await uploadBase64Image(input.photo || "");
      const galleryUUIDs = await Promise.all(
        input.gallery?.map(async (image) => {
          if (image && image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/)) {
            const imageUUID = await uploadBase64Image(image || "");
            return imageUUID;
          }
          return image;
        }) || [],
      );

      const updatedUser = await db
        .update(usersTable)
        .set({
          name: input.name,
          surname: input.surname,
          login: input.login,
          email: input.email,
          phone: input.phone,
          city: input.city,
          sex: input.sex,
          birthday: input.birthday,
          bio: input.bio,
          balance: input.balance,
          photo: imageUUID,
          gallery: galleryUUIDs,
        })
        .where(eq(usersTable.id, Number(input.id)))
        .returning();
      if (!updatedUser[0])
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return updatedUser[0];
    }),

  deleteUser: crmProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(usersTable).where(eq(usersTable.id, Number(input.id)));
      return { success: true };
    }),

  // ===== ВСТРЕЧИ =====
  getMeets: crmProcedure.query(async () => {
    return await db.query.meetTable.findMany({
      orderBy: [desc(meetTable.createdAt)],
    });
  }),

  getMeet: crmProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const meet = await db.query.meetTable.findFirst({
      where: eq(meetTable.id, Number(input.id)),
    });
    if (!meet) throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });
    return meet;
  }),

  createMeeting: crmProcedure
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

        gallery: z.array(z.string()).optional(),

        important: z.string().optional(),

        time: z.string().optional(),
        userId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        subType,
        name,
        description,
        type,

        date,
        locations,
        reward,
        image,
        participants,
        gallery,

        important,

        time,
      } = input;

      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, input.userId),
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
          name,
          participantsIds: [user.id],
          userId: user.id,
          gallery,
          locations,
          subType,
          reward,
          image: imageUrl,
          date,
          maxParticipants: participants,
          important,
          time,
        })
        .returning();

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

  updateMeet: crmProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        type: z.string().optional(),
        date: z.string().optional(),
        city: z.string().optional(),
        reward: z.number().optional(),
        maxParticipants: z.number().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const updatedMeet = await db
        .update(meetTable)
        .set(updateData)
        .where(eq(meetTable.id, Number(id)))
        .returning();
      if (!updatedMeet[0])
        throw new TRPCError({ code: "NOT_FOUND", message: "Meet not found" });
      return updatedMeet[0];
    }),

  deleteMeet: crmProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(meetTable).where(eq(meetTable.id, Number(input.id)));
      return { success: true };
    }),

  // ===== БЫСТРЫЕ ВСТРЕЧИ =====
  getFastMeets: crmProcedure.query(async () => {
    return await db.query.fastMeetTable.findMany({
      orderBy: [desc(fastMeetTable.createdAt)],
    });
  }),

  getFastMeet: crmProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const fastMeet = await db.query.fastMeetTable.findFirst({
        where: eq(fastMeetTable.id, Number(input.id)),
      });
      if (!fastMeet)
        throw new TRPCError({ code: "NOT_FOUND", message: "Fast meet not found" });
      return fastMeet;
    }),

  // ===== ОТЗЫВЫ =====
  getReviews: crmProcedure.query(async () => {
    return await db.query.reviewsTable.findMany({
      orderBy: [desc(reviewsTable.createdAt)],
    });
  }),

  getReview: crmProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const review = await db.query.reviewsTable.findFirst({
      where: eq(reviewsTable.id, Number(input.id)),
    });
    if (!review) throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });
    return review;
  }),

  deleteReview: crmProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const review = await db.query.reviewsTable.findFirst({
        where: eq(reviewsTable.id, Number(input.id)),
      });
      if (!review)
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });

      await db.delete(reviewsTable).where(eq(reviewsTable.id, Number(input.id)));
      return { success: true };
    }),

  // ===== УВЕДОМЛЕНИЯ =====
  getNotifications: crmProcedure.query(async () => {
    return await db.query.notificationsTable.findMany({
      orderBy: [desc(notificationsTable.createdAt)],
    });
  }),

  getNotification: crmProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const notification = await db.query.notificationsTable.findFirst({
        where: eq(notificationsTable.id, Number(input.id)),
      });
      if (!notification)
        throw new TRPCError({ code: "NOT_FOUND", message: "Notification not found" });
      return notification;
    }),

  markNotificationAsRead: crmProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .update(notificationsTable)
        .set({ isRead: true })
        .where(eq(notificationsTable.id, Number(input.id)));
      return { success: true };
    }),

  // ===== ЖАЛОБЫ =====
  getComplaints: crmProcedure.query(async () => {
    return await db.query.complaintsTable.findMany({
      orderBy: [desc(complaintsTable.createdAt)],
    });
  }),

  getComplaint: crmProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const complaint = await db.query.complaintsTable.findFirst({
        where: eq(complaintsTable.id, Number(input.id)),
      });
      if (!complaint)
        throw new TRPCError({ code: "NOT_FOUND", message: "Complaint not found" });
      return complaint;
    }),

  deleteComplaint: crmProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const complaint = await db.query.complaintsTable.findFirst({
        where: eq(complaintsTable.id, Number(input.id)),
      });
      if (!complaint)
        throw new TRPCError({ code: "NOT_FOUND", message: "Complaint not found" });

      await db.delete(complaintsTable).where(eq(complaintsTable.id, Number(input.id)));
      return { success: true };
    }),

  // ===== ЗАЯВКИ В ДРУЗЬЯ =====
  getFriendRequests: crmProcedure.query(async () => {
    return await db.query.friendRequestsTable.findMany({
      orderBy: [desc(friendRequestsTable.createdAt)],
    });
  }),

  getFriendRequest: crmProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const request = await db.query.friendRequestsTable.findFirst({
        where: eq(friendRequestsTable.id, Number(input.id)),
      });
      if (!request)
        throw new TRPCError({ code: "NOT_FOUND", message: "Friend request not found" });
      return request;
    }),

  approveFriendRequest: crmProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .update(friendRequestsTable)
        .set({ status: "accepted" })
        .where(eq(friendRequestsTable.id, Number(input.id)));
      return { success: true };
    }),

  rejectFriendRequest: crmProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .update(friendRequestsTable)
        .set({ status: "rejected" })
        .where(eq(friendRequestsTable.id, Number(input.id)));
      return { success: true };
    }),

  // ===== ПОДПИСКИ =====
  getSubscriptions: crmProcedure.query(async () => {
    return await db.query.subscriptionsTable.findMany({
      orderBy: [desc(subscriptionsTable.createdAt)],
    });
  }),

  // ===== ИЗБРАННОЕ =====
  getFavorites: crmProcedure.query(async () => {
    return await db.query.favoritesTable.findMany({
      orderBy: [desc(favoritesTable.createdAt)],
    });
  }),

  // ===== АКТИВНЫЕ СОБЫТИЯ =====
  getActiveEvents: crmProcedure.query(async () => {
    return await db.query.activeEventsTable.findMany({
      orderBy: [desc(activeEventsTable.createdAt)],
    });
  }),

  getActiveEvent: crmProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const event = await db.query.activeEventsTable.findFirst({
        where: eq(activeEventsTable.id, Number(input.id)),
      });
      if (!event)
        throw new TRPCError({ code: "NOT_FOUND", message: "Active event not found" });
      return event;
    }),

  completeEvent: crmProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .update(activeEventsTable)
        .set({ isCompleted: true })
        .where(eq(activeEventsTable.id, Number(input.id)));
      return { success: true };
    }),

  // ===== КАЛЕНДАРЬ =====
  getCalendar: crmProcedure.query(async () => {
    return await db.query.calendarTable.findMany({
      orderBy: [desc(calendarTable.date)],
    });
  }),

  // ===== РЕЙТИНГИ =====
  getRatings: crmProcedure.query(async () => {
    return await db.query.ratingsUserTable.findMany({
      orderBy: [desc(ratingsUserTable.createdAt)],
    });
  }),

  // ===== ИСТОРИЯ =====
  getHistory: crmProcedure.query(async () => {
    return await db.query.historyTable.findMany({
      orderBy: [desc(historyTable.createdAt)],
    });
  }),

  // ===== УЧАСТНИКИ ВСТРЕЧ =====
  getMeetParticipants: crmProcedure
    .input(z.object({ meetId: z.string() }))
    .query(async ({ input }) => {
      return await db.query.meetParticipantsTable.findMany({
        where: eq(meetParticipantsTable.meetId, Number(input.meetId)),
        orderBy: [desc(meetParticipantsTable.createdAt)],
      });
    }),

  getFastMeetParticipants: crmProcedure
    .input(z.object({ fastMeetId: z.string() }))
    .query(async ({ input }) => {
      return await db.query.fastMeetParticipantsTable.findMany({
        where: eq(fastMeetParticipantsTable.meetId, Number(input.fastMeetId)),
        orderBy: [desc(fastMeetParticipantsTable.createdAt)],
      });
    }),

  approveParticipant: crmProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .update(meetParticipantsTable)
        .set({ status: "accepted" })
        .where(eq(meetParticipantsTable.id, Number(input.id)));
      return { success: true };
    }),

  rejectParticipant: crmProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .update(meetParticipantsTable)
        .set({ status: "rejected" })
        .where(eq(meetParticipantsTable.id, Number(input.id)));
      return { success: true };
    }),

  // ===== СООБЩЕНИЯ =====
  getMeetMessages: crmProcedure
    .input(z.object({ meetId: z.string() }))
    .query(async ({ input }) => {
      return await db.query.meetMessagesTable.findMany({
        where: eq(meetMessagesTable.meetId, Number(input.meetId)),
        orderBy: [desc(meetMessagesTable.createdAt)],
      });
    }),

  deleteMessage: crmProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .delete(meetMessagesTable)
        .where(eq(meetMessagesTable.id, Number(input.id)));
      return { success: true };
    }),

  // ===== АНАЛИТИКА =====
  getStats: crmProcedure.query(async () => {
    const [usersCount, meetsCount, fastMeetsCount, reviewsCount, complaintsCount] =
      await Promise.all([
        db.select({ count: count() }).from(usersTable),
        db.select({ count: count() }).from(meetTable),
        db.select({ count: count() }).from(fastMeetTable),
        db.select({ count: count() }).from(reviewsTable),
        db.select({ count: count() }).from(complaintsTable),
      ]);

    const activeUsers = await db
      .select({ count: count() })
      .from(usersTable)
      .where(eq(usersTable.isOnboarded, true));

    const completedEvents = await db
      .select({ count: count() })
      .from(activeEventsTable)
      .where(eq(activeEventsTable.isCompleted, true));

    const totalRevenue = await db
      .select({
        total: sql<number>`COALESCE(SUM(COALESCE(${usersTable.balance}, 0)), 0)`,
      })
      .from(usersTable);

    return {
      totalUsers: usersCount[0].count,
      totalMeets: meetsCount[0].count,
      totalFastMeets: fastMeetsCount[0].count,
      totalReviews: reviewsCount[0].count,
      totalComplaints: complaintsCount[0].count,
      activeUsers: activeUsers[0].count,
      completedEvents: completedEvents[0].count,
      totalRevenue: totalRevenue[0].total,
    };
  }),

  getUsersStats: crmProcedure.query(async () => {
    const users = await db.query.usersTable.findMany();

    const usersByCity = users.reduce(
      (acc, user) => {
        const city = user.city || "Не указан";
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const usersBySex = users.reduce(
      (acc, user) => {
        const sex = user.sex || "Не указан";
        acc[sex] = (acc[sex] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const newUsers = users.filter((user) => {
      const createdAt = new Date(user.lastLocationUpdate || Date.now());
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return createdAt > weekAgo;
    }).length;

    const activeUsers = users.filter((user) => user.isOnboarded).length;
    const bannedUsers = 0; // Нужно добавить поле banned в схему

    return {
      newUsers,
      activeUsers,
      bannedUsers,
      usersByCity,
      usersBySex,
    };
  }),

  getMeetsStats: crmProcedure.query(async () => {
    const meets = await db.query.meetTable.findMany();

    const meetsByType = meets.reduce(
      (acc, meet) => {
        const type = meet.type || "Не указан";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const completedMeets = meets.filter((meet) => meet.isCompleted).length;
    const pendingMeets = meets.filter((meet) => !meet.isCompleted).length;
    const averageParticipants =
      meets.reduce((sum, meet) => sum + (meet.participantsIds?.length || 0), 0) /
      Math.max(meets.length, 1);

    return {
      totalMeets: meets.length,
      completedMeets,
      pendingMeets,
      meetsByType,
      averageParticipants: Math.round(averageParticipants * 100) / 100,
    };
  }),

  getRevenueStats: crmProcedure.query(async () => {
    const users = await db.query.usersTable.findMany();

    const totalRevenue = users.reduce((sum, user) => sum + (user.balance || 0), 0);

    const topEarningUsers = users
      .sort((a, b) => (b.balance || 0) - (a.balance || 0))
      .slice(0, 10)
      .map((user) => ({
        userId: user.id,
        revenue: user.balance ?? 0,
        name: `${user.name} ${user.surname || ""}`.trim(),
      }));

    // Простая группировка по месяцам (нужно улучшить)
    const revenueByMonth = {
      "2024-01": totalRevenue * 0.1,
      "2024-02": totalRevenue * 0.15,
      "2024-03": totalRevenue * 0.2,
      "2024-04": totalRevenue * 0.25,
      "2024-05": totalRevenue * 0.3,
    };

    return {
      totalRevenue,
      revenueByMonth,
      topEarningUsers,
    };
  }),

  // ===== СТАТИСТИКА БЫСТРЫХ ВСТРЕЧ =====
  getFastMeetsStats: crmProcedure.query(async () => {
    const fastMeets = await db.query.fastMeetTable.findMany();
    const participants = await db.query.fastMeetParticipantsTable.findMany();

    const fastMeetsByType = fastMeets.reduce(
      (acc, meet) => {
        const type = meet.type || "Не указан";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const fastMeetsByCity = fastMeets.reduce(
      (acc, meet) => {
        const city = meet.city || "Не указан";
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const averageParticipants =
      fastMeets.length > 0 ? participants.length / fastMeets.length : 0;

    const activeFastMeets = fastMeets.filter((meet) => {
      if (!meet.createdAt) return false;
      const createdAt = new Date(meet.createdAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return createdAt > weekAgo;
    }).length;

    return {
      totalFastMeets: fastMeets.length,
      activeFastMeets,
      totalParticipants: participants.length,
      averageParticipants: Math.round(averageParticipants * 100) / 100,
      fastMeetsByType,
      fastMeetsByCity,
    };
  }),

  // ===== СТАТИСТИКА СОБЫТИЙ В КАЛЕНДАРЕ =====
  getCalendarStats: crmProcedure.query(async () => {
    const calendarEvents = await db.query.calendarTable.findMany();

    const eventsByType = calendarEvents.reduce(
      (acc, event) => {
        const type = event.eventType || "Не указан";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const ticketEvents = calendarEvents.filter((event) => event.isTicket).length;
    const plannedEvents = calendarEvents.filter((event) => event.isPlanned).length;

    const upcomingEvents = calendarEvents.filter((event) => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      const now = new Date();
      return eventDate > now;
    }).length;

    const pastEvents = calendarEvents.filter((event) => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      const now = new Date();
      return eventDate < now;
    }).length;

    return {
      totalEvents: calendarEvents.length,
      ticketEvents,
      plannedEvents,
      upcomingEvents,
      pastEvents,
      eventsByType,
    };
  }),

  approveItem: crmProcedure
    .input(
      z.object({
        type: z.enum(["meet", "review", "complaint", "friendRequest"]),
        id: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      switch (input.type) {
        case "meet":
          await db
            .update(meetTable)
            .set({ isCompleted: true })
            .where(eq(meetTable.id, Number(input.id)));
          break;
        case "friendRequest":
          await db
            .update(friendRequestsTable)
            .set({ status: "accepted" })
            .where(eq(friendRequestsTable.id, Number(input.id)));
          break;
        // Добавить другие типы по необходимости
      }
      return { success: true };
    }),

  rejectItem: crmProcedure
    .input(
      z.object({
        type: z.enum(["meet", "review", "complaint", "friendRequest"]),
        id: z.string(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      switch (input.type) {
        case "meet":
          await db.delete(meetTable).where(eq(meetTable.id, Number(input.id)));
          break;
        case "friendRequest":
          await db
            .update(friendRequestsTable)
            .set({ status: "rejected" })
            .where(eq(friendRequestsTable.id, Number(input.id)));
          break;
        // Добавить другие типы по необходимости
      }
      return { success: true };
    }),

  // ===== СИСТЕМНЫЕ =====
  getSystemInfo: crmProcedure.query(async () => {
    const startTime = Date.now();

    return {
      version: "1.0.0",
      uptime: Date.now() - startTime,
      databaseSize: 0, // Нужно реализовать
      activeConnections: 1,
    };
  }),

  clearCache: crmProcedure.mutation(async () => {
    // Здесь можно добавить логику очистки кэша
    return { success: true };
  }),

  backupDatabase: crmProcedure.mutation(async () => {
    // Здесь можно добавить логику бэкапа
    return { backupUrl: "https://example.com/backup.sql" };
  }),

  restoreDatabase: crmProcedure
    .input(z.object({ backupUrl: z.string() }))
    .mutation(async ({ input }) => {
      // Здесь можно добавить логику восстановления
      console.log("Restoring from:", input.backupUrl);
      return { success: true };
    }),

  // ===== ПРЕДУПРЕЖДЕНИЯ =====
  getWarnings: crmProcedure.query(async () => {
    return await db.query.usersTable.findMany({
      where: isNotNull(usersTable.warnings),
    });
  }),

  getBans: crmProcedure.query(async () => {
    return await db.query.usersTable.findMany({
      where: isNotNull(usersTable.bans),
    });
  }),

  getWarningsByUser: crmProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await db.query.usersTable.findFirst({
        where: eq(usersTable.id, Number(input.userId)),
      });
    }),

  getBansByUser: crmProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await db.query.usersTable.findFirst({
        where: eq(usersTable.id, Number(input.userId)),
      });
    }),

  addWarning: crmProcedure
    .input(z.object({ userId: z.string(), reason: z.string() }))
    .mutation(async ({ input }) => {
      // First get the current user data
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, Number(input.userId)),
      });

      const currentWarnings = user?.warnings || [];

      await db
        .update(usersTable)
        .set({
          warnings: [
            ...currentWarnings,
            { reason: input.reason, createdAt: new Date().toISOString() },
          ],
        })
        .where(eq(usersTable.id, Number(input.userId)));

      await sendTelegram(
        `Вы получили предупреждение по причине: ${input.reason}\n\nВы можете оспорить его, написав в поддержку`,
        user!.id,
      );
    }),

  addBan: crmProcedure
    .input(z.object({ userId: z.string(), reason: z.string(), duration: z.string() }))
    .mutation(async ({ input }) => {
      // First get the current user data
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, Number(input.userId)),
      });

      const currentBans = user?.bans || [];

      await db
        .update(usersTable)
        .set({
          bans: [...currentBans, { userId: Number(input.userId) }],
        })
        .where(eq(usersTable.id, Number(input.userId)));

      const date = new Date();
      const banDate = new Date(
        date.getTime() + Number(input.duration) * 24 * 60 * 60 * 1000,
      );

      await sendTelegram(
        `Вы получили бан до ${banDate.toLocaleDateString()} по причине: ${input.reason}\n\nВы можете оспорить его, написав в поддержку`,
        user!.id,
      );
    }),

  // ===== ПОКУПКИ =====
  getPurchases: crmProcedure.query(async () => {
    // Получаем купленные билеты из календаря
    const ticketPurchases = await db.query.calendarTable.findMany({
      where: eq(calendarTable.isTicket, true),
      orderBy: [desc(calendarTable.date)],
    });

    // Получаем квесты с ценами
    const quests = await db.query.eventsTable.findMany({
      where: sql`${eventsTable.price} > 0`,
    });

    // Получаем быстрые встречи
    const fastMeets = await db.query.fastMeetTable.findMany({
      orderBy: [desc(fastMeetTable.createdAt)],
    });

    // Получаем события в календаре
    const calendarEvents = await db.query.calendarTable.findMany({
      orderBy: [desc(calendarTable.date)],
    });

    // Получаем пользователей для связи данных
    const users = await db.query.usersTable.findMany();

    // Формируем список покупок
    const purchases = ticketPurchases.map((ticket) => {
      const user = users.find((u) => u.id === ticket.userId);
      return {
        id: ticket.id,
        userId: ticket.userId,
        userName: user
          ? `${user.name} ${user.surname || ""}`.trim()
          : "Неизвестный пользователь",
        eventId: ticket.eventId,
        eventType: ticket.eventType,
        date: ticket.date,
        isPlanned: ticket.isPlanned,
        type: "ticket",
        price: 0, // Цена не хранится в календаре
      };
    });

    // Добавляем покупки квестов (если есть данные о покупках)
    const questPurchases = quests.map((quest) => ({
      id: quest.id,
      userId: 0, // Нужно добавить поле userId в questsTable
      userName: "Неизвестный пользователь",
      eventId: quest.id,
      eventType: "quest",
      date: quest.createdAt,
      isPlanned: false,
      type: "quest",
      price: quest.price,
      title: quest.title,
    }));

    // Добавляем быстрые встречи
    const fastMeetPurchases = fastMeets.map((fastMeet) => {
      const user = users.find((u) => u.id === fastMeet.userId);
      return {
        id: fastMeet.id,
        userId: fastMeet.userId,
        userName: user
          ? `${user.name} ${user.surname || ""}`.trim()
          : "Неизвестный пользователь",
        eventId: fastMeet.id,
        eventType: "fastMeet",
        date: fastMeet.createdAt,
        isPlanned: false,
        type: "fastMeet",
        price: 0,
        title: fastMeet.name,
        description: fastMeet.description,
        city: fastMeet.city,
        meetType: fastMeet.type,
      };
    });

    // Добавляем события в календаре
    const calendarEventPurchases = calendarEvents.map((event) => {
      const user = users.find((u) => u.id === event.userId);
      return {
        id: event.id,
        userId: event.userId,
        userName: user
          ? `${user.name} ${user.surname || ""}`.trim()
          : "Неизвестный пользователь",
        eventId: event.eventId,
        eventType: event.eventType,
        date: event.date,
        isPlanned: event.isPlanned,
        type: "calendarEvent",
        price: 0,
        title: `${event.eventType} событие`,
      };
    });

    return [
      ...purchases,
      ...questPurchases,
      ...fastMeetPurchases,
      ...calendarEventPurchases,
    ];
  }),

  getPurchaseStats: crmProcedure.query(async () => {
    // Получаем статистику покупок
    const ticketPurchases = await db.query.calendarTable.findMany({
      where: eq(calendarTable.isTicket, true),
    });

    const quests = await db.query.eventsTable.findMany({
      where: sql`${eventsTable.price} > 0`,
    });

    const fastMeets = await db.query.fastMeetTable.findMany();
    const calendarEvents = await db.query.calendarTable.findMany();

    const totalPurchases =
      ticketPurchases.length + quests.length + fastMeets.length + calendarEvents.length;
    const totalRevenue = quests.reduce((sum, quest) => sum + (quest.price || 0), 0);

    // Группировка по месяцам
    const purchasesByMonth: Record<string, number> = {};
    const currentDate = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      purchasesByMonth[monthKey] = 0;
    }

    // Подсчитываем покупки по месяцам
    ticketPurchases.forEach((ticket) => {
      if (ticket.date) {
        const monthKey = new Date(ticket.date).toISOString().slice(0, 7);
        purchasesByMonth[monthKey] = (purchasesByMonth[monthKey] || 0) + 1;
      }
    });

    quests.forEach((quest) => {
      if (quest.createdAt) {
        const monthKey = new Date(quest.createdAt).toISOString().slice(0, 7);
        purchasesByMonth[monthKey] = (purchasesByMonth[monthKey] || 0) + 1;
      }
    });

    fastMeets.forEach((fastMeet) => {
      if (fastMeet.createdAt) {
        const monthKey = new Date(fastMeet.createdAt).toISOString().slice(0, 7);
        purchasesByMonth[monthKey] = (purchasesByMonth[monthKey] || 0) + 1;
      }
    });

    calendarEvents.forEach((event) => {
      if (event.date) {
        const monthKey = new Date(event.date).toISOString().slice(0, 7);
        purchasesByMonth[monthKey] = (purchasesByMonth[monthKey] || 0) + 1;
      }
    });

    // Топ продуктов (квесты по популярности)
    const topProducts = quests
      .sort((a, b) => (b.price || 0) - (a.price || 0))
      .slice(0, 10)
      .map((quest) => ({
        id: quest.id,
        name: quest.title,
        price: quest.price || 0,
        category: quest.category,
      }));

    // Статистика по типам событий
    const eventTypeStats = {
      tickets: ticketPurchases.length,
      quests: quests.length,
      fastMeets: fastMeets.length,
      calendarEvents: calendarEvents.length,
    };

    return {
      totalPurchases,
      totalRevenue,
      averagePurchaseValue: totalPurchases > 0 ? totalRevenue / totalPurchases : 0,
      purchasesByMonth,
      topProducts,
      eventTypeStats,
    };
  }),

  // ===== БЫСТРЫЕ ВСТРЕЧИ ДЕТАЛЬНО =====
  getFastMeetsDetailed: crmProcedure.query(async () => {
    const fastMeets = await db.query.fastMeetTable.findMany({
      orderBy: [desc(fastMeetTable.createdAt)],
    });

    const users = await db.query.usersTable.findMany();
    const participants = await db.query.fastMeetParticipantsTable.findMany();

    return fastMeets.map((fastMeet) => {
      const creator = users.find((u) => u.id === fastMeet.userId);
      const meetParticipants = participants.filter((p) => p.meetId === fastMeet.id);

      return {
        id: fastMeet.id,
        name: fastMeet.name,
        description: fastMeet.description,
        creator: creator
          ? `${creator.name} ${creator.surname || ""}`.trim()
          : "Неизвестный пользователь",
        creatorId: fastMeet.userId,
        city: fastMeet.city,
        type: fastMeet.type,
        subType: fastMeet.subType,
        tags: fastMeet.tags,
        locations: fastMeet.locations,
        coordinates: fastMeet.coordinates,
        createdAt: fastMeet.createdAt,
        participantsCount: meetParticipants.length,
        participants: meetParticipants.map((p) => {
          const participant = users.find((u) => u.id === p.userId);
          return {
            id: p.id,
            userId: p.userId,
            userName: participant
              ? `${participant.name} ${participant.surname || ""}`.trim()
              : "Неизвестный пользователь",
            status: p.status,
            createdAt: p.createdAt,
          };
        }),
      };
    });
  }),

  createUserBot: crmProcedure
    .input(
      z.object({
        photo: z.string(),
        name: z.string(),
        surname: z.string(),
        login: z.string(),
        email: z.string(),
        phone: z.string(),
        bio: z.string(),
        gallery: z.array(z.string()),
        birthday: z.string().optional(),
        city: z.string().optional(),
        sex: z.string().optional(),
        balance: z.number().default(0),
        isOnboarded: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      const photoUrl = await uploadBase64Image(input.photo);

      const galleryUrls = await Promise.all(
        input.gallery.map(async (gallery) => await uploadBase64Image(gallery)),
      );
      await db
        .insert(usersTable)
        .values({
          id: Date.now(),
          photo: photoUrl,
          name: input.name,
          surname: input.surname,
          login: input.login,
          email: input.email,
          phone: input.phone,
          birthday: input.birthday,
          city: input.city,
          bio: input.bio,
          sex: input.sex,
          balance: input.balance,
          isOnboarded: input.isOnboarded,
          interests: {},
          inventory: [],
          gallery: galleryUrls,
          notInterestedIds: [],
          savedIds: [],
          savedEvents: [],
          savedMeetsIds: [],
          warnings: [],
          bans: [],
        })
        .returning();
      return input;
    }),

  // ===== СОБЫТИЯ В КАЛЕНДАРЕ ДЕТАЛЬНО =====
  getCalendarEventsDetailed: crmProcedure.query(async () => {
    const calendarEvents = await db.query.calendarTable.findMany({
      orderBy: [desc(calendarTable.date)],
    });

    const users = await db.query.usersTable.findMany();

    return calendarEvents.map((event) => {
      const user = users.find((u) => u.id === event.userId);

      return {
        id: event.id,
        userId: event.userId,
        userName: user
          ? `${user.name} ${user.surname || ""}`.trim()
          : "Неизвестный пользователь",
        eventId: event.eventId,
        meetId: event.meetId,
        eventType: event.eventType,
        date: event.date,
        isTicket: event.isTicket,
        isPlanned: event.isPlanned,
        createdAt: event.date, // Используем date как createdAt для сортировки
      };
    });
  }),

  // ===== ТРАНЗАКЦИИ =====
  getTransactions: crmProcedure.query(async () => {
    // Получаем пользователей с балансом для анализа транзакций
    const users = await db.query.usersTable.findMany({
      where: sql`${usersTable.balance} != 0`,
      orderBy: [desc(usersTable.lastLocationUpdate)],
    });

    // Получаем квесты с ценами как транзакции
    const quests = await db.query.eventsTable.findMany({
      where: sql`${eventsTable.price} > 0`,
      orderBy: [desc(eventsTable.createdAt)],
    });

    // Формируем список транзакций
    const transactions = users.map((user) => ({
      id: user.id,
      userId: user.id,
      userName: `${user.name} ${user.surname || ""}`.trim(),
      amount: user.balance ?? 0,
      type: (user.balance ?? 0) > 0 ? "credit" : "debit",
      date: user.lastLocationUpdate || new Date(),
      description: "Баланс пользователя",
    }));

    // Добавляем транзакции покупок квестов
    const questTransactions = quests.map((quest) => ({
      id: quest.id,
      userId: 0, // Нужно добавить поле userId в questsTable
      userName: "Неизвестный пользователь",
      amount: quest.price || 0,
      type: "purchase",
      date: quest.createdAt,
      description: `Покупка квеста: ${quest.title}`,
    }));

    return [...transactions, ...questTransactions];
  }),

  getTransactionStats: crmProcedure.query(async () => {
    // Получаем статистику транзакций
    const users = await db.query.usersTable.findMany();
    const quests = await db.query.eventsTable.findMany({
      where: sql`${eventsTable.price} > 0`,
    });

    const totalTransactions = users.length + quests.length;
    const totalAmount =
      users.reduce((sum, user) => sum + (user.balance ?? 0), 0) +
      quests.reduce((sum, quest) => sum + (quest.price || 0), 0);

    // Группировка по месяцам
    const transactionsByMonth: Record<string, number> = {};
    const currentDate = new Date();

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      transactionsByMonth[monthKey] = 0;
    }

    // Подсчитываем транзакции по месяцам
    users.forEach((user) => {
      if (user.lastLocationUpdate) {
        const monthKey = new Date(user.lastLocationUpdate).toISOString().slice(0, 7);
        transactionsByMonth[monthKey] = (transactionsByMonth[monthKey] || 0) + 1;
      }
    });

    quests.forEach((quest) => {
      if (quest.createdAt) {
        const monthKey = new Date(quest.createdAt).toISOString().slice(0, 7);
        transactionsByMonth[monthKey] = (transactionsByMonth[monthKey] || 0) + 1;
      }
    });

    // Типы транзакций
    const transactionTypes = {
      credit: users.filter((user) => (user.balance ?? 0) > 0).length,
      debit: users.filter((user) => (user.balance ?? 0) < 0).length,
      purchase: quests.length,
    };

    return {
      totalTransactions,
      totalAmount,
      averageTransactionValue:
        totalTransactions > 0 ? totalAmount / totalTransactions : 0,
      transactionsByMonth,
      transactionTypes,
    };
  }),

  // ===== КВЕСТЫ =====
  getQuests: creatorProcedure.query(async () => {
    return await db.query.eventsTable.findMany();
  }),

  getQuest: creatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const quest = await db.query.eventsTable.findFirst({
        where: eq(eventsTable.id, Number(input.id)),
      });
      if (!quest) throw new TRPCError({ code: "NOT_FOUND", message: "Quest not found" });
      return quest;
    }),

  deleteQuest: creatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(eventsTable).where(eq(eventsTable.id, Number(input.id)));
      return { success: true };
    }),

  createEvent: creatorProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        category: z.string(),
        type: z.string(),
        rewards: z.array(
          z.object({ type: z.string(), value: z.union([z.number(), z.string()]) }),
        ),
        date: z.string(),
        city: z.string(),
        image: z.string(),
        location: z.string(),
        price: z.number(),
        stages: z.array(z.object({ title: z.string(), desc: z.string() })),
        hasAchievement: z.boolean(),
        organizer: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const imageUUID = await uploadBase64Image(input.image);
      const newInput = { ...input, image: imageUUID };
      const newQuest = await db.insert(eventsTable).values(newInput).returning();
      return newQuest[0];
    }),

  updateQuest: crmProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        type: z.string().optional(),
        rewards: z.array(z.object({ type: z.string(), value: z.number() })).optional(),
        date: z.string().optional(),
        city: z.string().optional(),
        image: z.string().optional(),
        location: z.string().optional(),
        price: z.number().optional(),
        quests: z.array(z.object({ title: z.string(), desc: z.string() })).optional(),
        hasAchievement: z.boolean().optional(),
        organizer: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const updatedQuest = await db
        .update(eventsTable)
        .set(updateData)
        .where(eq(eventsTable.id, Number(id)))
        .returning();
      return updatedQuest[0];
    }),

  reviewQuest: crmProcedure
    .input(z.object({ id: z.string(), isApproved: z.boolean() }))
    .mutation(async ({ input }) => {
      await db
        .update(eventsTable)
        .set({ isApproved: input.isApproved, isReviewed: true })
        .where(eq(eventsTable.id, Number(input.id)));
      return { success: true };
    }),

  getCases: crmProcedure.query(async () => {
    return await db.query.casesTable.findMany();
  }),

  getCase: crmProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const caseData = await db.query.casesTable.findFirst({
      where: eq(casesTable.id, input.id),
    });
    if (!caseData) throw new TRPCError({ code: "NOT_FOUND", message: "Case not found" });
    return caseData;
  }),

  createCase: crmProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        photo: z.string(),
        items: z.array(
          z.object({ type: z.string(), value: z.number(), rarity: z.string() }),
        ),
        price: z.number(),
        isWithKey: z.boolean(),
        eventType: z.string(),
        eventId: z.number(),
        rarity: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      let photoUrl = null;
      if (input.photo && input.photo.startsWith("data:image/")) {
        photoUrl = await uploadBase64Image(input.photo);
      } else {
        photoUrl = input.photo;
      }
      const newCase = await db
        .insert(casesTable)
        .values({ ...input, photo: photoUrl })
        .returning();
      return newCase[0];
    }),

  deleteCase: crmProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.delete(casesTable).where(eq(casesTable.id, input.id));
      return { success: true };
    }),

  updateCase: crmProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        photo: z.string(),
        items: z.array(
          z.object({ type: z.string(), value: z.number(), rarity: z.string() }),
        ),
        price: z.number(),
        isWithKey: z.boolean(),
        eventType: z.string(),
        eventId: z.number(),
        rarity: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      let photoUrl = null;
      if (input.photo && input.photo.startsWith("data:image/")) {
        photoUrl = await uploadBase64Image(input.photo);
      } else {
        photoUrl = input.photo;
      }
      const updatedCase = await db
        .update(casesTable)
        .set({ ...input, photo: photoUrl, id: Number(input.id) })
        .where(eq(casesTable.id, Number(input.id)))
        .returning();
      return updatedCase[0];
    }),

  getEvents: crmProcedure.query(async () => {
    return await db.query.eventsTable.findMany();
  }),
});

import { TRPCError } from "@trpc/server";
import { count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import {
  activeEventsTable,
  calendarTable,
  complaintsTable,
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
import { createTRPCRouter, crmProcedure } from "./init";

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
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const updatedUser = await db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, Number(id)))
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

  createMeet: crmProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        type: z.string(),
        date: z.string(),
        city: z.string().optional(),
        reward: z.number().optional(),
        maxParticipants: z.number().optional(),
        userId: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      const newMeet = await db
        .insert(meetTable)
        .values({
          name: input.name,
          description: input.description,
          type: input.type,
          date: input.date,
          city: input.city,
          reward: input.reward,
          maxParticipants: input.maxParticipants,
          userId: input.userId,
          participantsIds: [],
          locations: [],
          items: [],
          gallery: [],
          isCompleted: false,
          isBig: false,
        })
        .returning();
      return newMeet[0];
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
        isCompleted: z.boolean().optional(),
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
        total: sql<number>`COALESCE(SUM(${usersTable.balance}), 0)`,
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
        revenue: user.balance || 0,
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

  // ===== МОДЕРАЦИЯ =====
  getModerationQueue: crmProcedure.query(async () => {
    const [pendingMeets, pendingReviews, pendingComplaints, pendingFriendRequests] =
      await Promise.all([
        db.query.meetTable.findMany({
          where: eq(meetTable.isCompleted, false),
          orderBy: [desc(meetTable.createdAt)],
          limit: 10,
        }),
        db.query.reviewsTable.findMany({
          orderBy: [desc(reviewsTable.createdAt)],
          limit: 10,
        }),
        db.query.complaintsTable.findMany({
          orderBy: [desc(complaintsTable.createdAt)],
          limit: 10,
        }),
        db.query.friendRequestsTable.findMany({
          where: eq(friendRequestsTable.status, "pending"),
          orderBy: [desc(friendRequestsTable.createdAt)],
          limit: 10,
        }),
      ]);

    return {
      pendingMeets,
      pendingReviews,
      pendingComplaints,
      pendingFriendRequests,
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
});

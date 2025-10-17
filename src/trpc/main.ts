import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { getRewardForStreak } from "~/config/checkin";
import { db } from "~/db";
import {
  calendarTable,
  casesTable,
  complaintsTable,
  eventsTable,
  favoritesTable,
  friendRequestsTable,
  loggingTable,
  meetTable,
  notificationsTable,
  ratingsUserTable,
  reviewsTable,
  subscriptionsTable,
  usersTable,
} from "~/db/schema";
import { uploadBase64Image } from "~/lib/s3/uploadBase64";
import { calculateStreak } from "~/lib/utils/calculateStreak";
import { getPopularEvents } from "~/lib/utils/getPopularEvents";
import { giveXps } from "~/lib/utils/giveXps";
import { logAction } from "~/lib/utils/logger";
import { procedure, publicProcedure } from "./init";
export const router = {
  getHello: publicProcedure.query(() => {
    return {
      hello: "world",
    };
  }),
  getUser: procedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.userId),
    });

    return user;
  }),

  claimDailyCheckIn: procedure.mutation(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.userId),
    });

    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastCheck = user.lastCheckIn ? new Date(user.lastCheckIn) : undefined;
    const lastStart = lastCheck
      ? new Date(lastCheck.getFullYear(), lastCheck.getMonth(), lastCheck.getDate())
      : undefined;

    // Проверка: уже сделал чекин сегодня
    if (lastStart && lastStart.getTime() === startOfToday.getTime()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Вы уже получили награду сегодня",
      });
    }

    // Вычисляем новый стрик
    const newStreak = calculateStreak(user);

    // Получаем награду за новый день
    const reward = getRewardForStreak(newStreak);

    if (reward.type === "points") {
      await db
        .update(usersTable)
        .set({ balance: (user.balance || 0) + reward.value })
        .where(eq(usersTable.id, ctx.userId));
    }

    if (reward.type === "xp") {
      await giveXps(ctx.userId, user, reward.value);
    }

    // Обновляем стрик И lastCheckIn
    await db
      .update(usersTable)
      .set({ checkInStreak: newStreak, lastCheckIn: now })
      .where(eq(usersTable.id, ctx.userId));

    return { streak: newStreak };
  }),

  getReferrals: procedure.query(async ({ ctx }) => {
    const users = await db.query.usersTable.findMany({
      where: eq(usersTable.referrerId, ctx.userId),
    });

    return users;
  }),

  getPopularEvents: procedure.query(async ({ ctx }) => {
    return await getPopularEvents();
  }),

  getNotifications: procedure.query(async ({ ctx }) => {
    const notifications = await db.query.notificationsTable.findMany({
      where: eq(notificationsTable.toUserId, ctx.userId),
      orderBy: [desc(notificationsTable.createdAt), desc(notificationsTable.id)],
    });

    return notifications;
  }),

  readNotification: procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(notificationsTable)
        .set({ isRead: true })
        .where(
          and(
            eq(notificationsTable.id, input.id),
            eq(notificationsTable.toUserId, ctx.userId),
          ),
        );

      return true;
    }),

  getUsers: procedure.query(async ({ ctx }) => {
    const users = await db.query.usersTable.findMany();

    return users;
  }),

  getUserById: procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, Number(input.id)),
      });

      return user;
    }),

  // User activity history (logs)
  getMyLogs: procedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional(),
          cursor: z.number().nullish(), // last seen id for pagination
          type: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const pageSize = input?.limit ?? 50;

      const whereParts = [eq(loggingTable.userId, ctx.userId)];
      if (input?.type) whereParts.push(eq(loggingTable.type, input.type));
      if (input?.cursor) whereParts.push(lt(loggingTable.id, input.cursor));

      const items = await db.query.loggingTable.findMany({
        where: and(...whereParts, ne(loggingTable.type, "location_update")),
        orderBy: [desc(loggingTable.createdAt), desc(loggingTable.id)],
        limit: pageSize + 1,
        columns: {
          id: true,
          userId: true,
          type: true,
          amount: true,
          eventId: true,
          eventType: true,
          meetId: true,
          caseId: true,
          itemId: true,
          keyId: true,
          createdAt: true,
        },
      });

      const hasMore = items.length > pageSize;
      const pageItems = hasMore ? items.slice(0, pageSize) : items;

      // Collect referenced IDs
      const eventIds = pageItems.map((l) => l.eventId).filter((v): v is number => !!v);
      const meetIds = pageItems.map((l) => l.meetId).filter((v): v is number => !!v);
      const caseIds = pageItems.map((l) => l.caseId).filter((v): v is number => !!v);
      const userIds = pageItems
        .map((l) =>
          l.itemId &&
          typeof l.type === "string" &&
          (l.type.startsWith("friend_") ||
            l.type === "subscribe" ||
            l.type === "unsubscribe" ||
            l.type === "favorite_add" ||
            l.type === "favorite_remove")
            ? l.itemId
            : null,
        )
        .filter((v): v is number => !!v);

      // Load referenced entities
      const [events, meets, cases, users] = await Promise.all([
        eventIds.length
          ? db.query.eventsTable.findMany({
              where: inArray(eventsTable.id, Array.from(new Set(eventIds))),
              columns: { id: true, title: true, image: true, category: true },
            })
          : Promise.resolve(
              [] as {
                id: number;
                title: string | null;
                image: string | null;
                category: string | null;
              }[],
            ),
        meetIds.length
          ? db.query.meetTable.findMany({
              where: inArray(meetTable.id, Array.from(new Set(meetIds))),
              columns: { id: true, name: true, image: true },
            })
          : Promise.resolve(
              [] as { id: number; name: string | null; image: string | null }[],
            ),
        caseIds.length
          ? db.query.casesTable.findMany({
              where: inArray(casesTable.id, Array.from(new Set(caseIds))),
              columns: { id: true, name: true, photo: true },
            })
          : Promise.resolve(
              [] as { id: number; name: string | null; photo: string | null }[],
            ),
        userIds.length
          ? db.query.usersTable.findMany({
              where: inArray(usersTable.id, Array.from(new Set(userIds))),
              columns: { id: true, name: true, surname: true, photo: true },
            })
          : Promise.resolve(
              [] as {
                id: number;
                name: string | null;
                surname: string | null;
                photo: string | null;
              }[],
            ),
      ]);

      const eventById = new Map(events.map((e) => [e.id, e] as const));
      const meetById = new Map(meets.map((m) => [m.id, m] as const));
      const caseById = new Map(cases.map((c) => [c.id, c] as const));
      const userById = new Map(users.map((u) => [u.id, u] as const));

      const withRoute = pageItems.map((log) => {
        let route: string | null = null;
        let entityTitle: string | null = null;
        let entityImage: string | null = null;
        if (log.meetId) {
          route = `/meet/${log.meetId}`;
          const m = meetById.get(log.meetId);
          entityTitle = m?.name ?? null;
          entityImage = m?.image ?? null;
        } else if (log.caseId) {
          route = `/case/${log.caseId}`;
          const c = caseById.get(log.caseId);
          entityTitle = c?.name ?? null;
          entityImage = (c as any)?.photo ?? null;
        } else if (log.eventId) {
          const ev = eventById.get(log.eventId);
          if ((ev?.category || log.eventType) && log.eventId)
            route = `/event/${encodeURIComponent(log.eventType || ev?.category || "")}/${log.eventId}`;
          entityTitle = ev?.title ?? null;
          entityImage = ev?.image ?? null;
        } else if (
          log.itemId &&
          typeof log.type === "string" &&
          (log.type.startsWith("friend_") ||
            log.type === "subscribe" ||
            log.type === "unsubscribe" ||
            log.type === "favorite_add" ||
            log.type === "favorite_remove")
        ) {
          route = `/user-profile/${log.itemId}`;
          const u = userById.get(log.itemId);
          entityTitle = u ? `${u.name ?? ""} ${u.surname ?? ""}`.trim() : null;
          entityImage = u?.photo ?? null;
        }
        return { ...log, route, entityTitle, entityImage };
      });

      return {
        items: withRoute,
        nextCursor: hasMore ? withRoute[withRoute.length - 1]!.id : undefined,
      };
    }),

  getOnBoarding: procedure
    .input(
      z.object({
        name: z.string(),
        surname: z.string(),
        login: z.string(),
        birthday: z.string(),
        city: z.string(),
        bio: z.string(),
        sex: z.string(),
        photo: z.string(),
        isOnboarded: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const imageUUID = await uploadBase64Image(input.photo);

      await db
        .update(usersTable)
        .set({
          name: input.name,
          surname: input.surname,
          login: input.login,
          birthday: input.birthday,
          city: input.city,
          bio: input.bio,
          sex: input.sex,
          photo: imageUUID,
          isOnboarded: input.isOnboarded,
        })
        .where(eq(usersTable.id, ctx.userId));

      await logAction({ userId: ctx.userId, type: "onboarding_complete" });
      return user;
    }),

  updateProfile: procedure
    .input(
      z.object({
        email: z.string(),
        phone: z.string(),
        bio: z.string(),
        photo: z.string(),
        gallery: z.array(z.string()),
        name: z.string(),
        surname: z.string(),
        birthday: z.string(),
        city: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Handle photo: upload new, set existing ID, or clear if empty
      if (input.photo.startsWith("data:image/")) {
        const imageUUID = await uploadBase64Image(input.photo);
        await db
          .update(usersTable)
          .set({ photo: imageUUID })
          .where(eq(usersTable.id, ctx.userId));
      } else if (input.photo !== "") {
        // Set existing photo ID
        await db
          .update(usersTable)
          .set({ photo: input.photo })
          .where(eq(usersTable.id, ctx.userId));
      } else {
        // Clear photo
        await db
          .update(usersTable)
          .set({ photo: null })
          .where(eq(usersTable.id, ctx.userId));
      }

      if (input.gallery.length > 7) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Gallery must be less than 7 images",
        });
      }

      if (input.gallery) {
        const galleryUUIDs = await Promise.all(
          input.gallery.map(async (image) => {
            if (typeof image === "string" && image.startsWith("data:image/")) {
              const imageUUID = await uploadBase64Image(image);
              return imageUUID;
            }
            return image;
          }),
        );
        await db
          .update(usersTable)
          .set({
            gallery: galleryUUIDs,
          })
          .where(eq(usersTable.id, ctx.userId));
      }

      await db
        .update(usersTable)
        .set({
          email: input.email,
          phone: input.phone,
          bio: input.bio,
          name: input.name,
          surname: input.surname,
          birthday: input.birthday,
          city: input.city,
        })
        .where(eq(usersTable.id, ctx.userId));
      // Compute and store diffs for CRM
      const changes: Record<string, { from: unknown; to: unknown }> = {};
      const fields: Array<[string, unknown, unknown]> = [
        ["email", user?.email, input.email],
        ["phone", user?.phone, input.phone],
        ["bio", user?.bio, input.bio],
        ["name", user?.name, input.name],
        ["surname", user?.surname, input.surname],
        ["birthday", user?.birthday, input.birthday],
        ["city", user?.city, input.city],
      ];
      for (const [key, before, after] of fields) {
        if (before !== after) changes[key] = { from: before ?? null, to: after ?? null };
      }
      await logAction({ userId: ctx.userId, type: "profile_update", details: changes });
      return user;
    }),

  getSubscribers: procedure
    .input(z.object({ userId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const subscribers = await db.query.subscriptionsTable.findMany({
        where: eq(subscriptionsTable.targetUserId, input?.userId || ctx.userId),
      });

      const subscribersIds = subscribers
        .map((subscriber) => subscriber.subscriberId)
        .filter((id): id is number => id !== null);

      const subscribersUsers = await db.query.usersTable.findMany({
        where: inArray(usersTable.id, subscribersIds),
      });

      return subscribersUsers;
    }),

  addToFavorites: procedure
    .input(
      z.object({
        userId: z.number(),
        type: z.enum(["user", "event", "photo"]),
        photo: z.string().optional(),
        eventId: z.number().optional(),
        meetId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      await db.insert(favoritesTable).values({
        fromUserId: ctx.userId,
        toUserId: input.userId,
        type: input.type,
        photo: input.photo,
        eventId: input.eventId,
        meetId: input.meetId,
      });

      await db.insert(notificationsTable).values({
        fromUserId: ctx.userId,
        toUserId: input.userId,
        type: "like",
      });

      let eventCategoryForLog: string | undefined;
      if (input.eventId) {
        const ev = await db.query.eventsTable.findFirst({
          where: eq(eventsTable.id, input.eventId),
          columns: { category: true },
        });
        eventCategoryForLog = ev?.category ?? undefined;
      }
      await logAction({
        userId: ctx.userId,
        type: "favorite_add",
        itemId: input.userId,
        eventId: input.eventId,
        eventType: eventCategoryForLog,
        meetId: input.meetId,
      });

      return user;
    }),

  getMyRequests: procedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.userId),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return await db.query.friendRequestsTable.findMany({
      where: eq(friendRequestsTable.fromUserId, user.id),
    });
  }),

  getUserFavorites: procedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.userId),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return await db.query.favoritesTable.findMany({
      where: eq(favoritesTable.fromUserId, user.id),
    });
  }),

  deletePhoto: procedure
    .input(z.object({ photo: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const currentUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!currentUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (currentUser.photo === input.photo) {
        await db
          .update(usersTable)
          .set({ photo: null })
          .where(eq(usersTable.id, ctx.userId));
      } else if (currentUser.gallery && currentUser.gallery.includes(input.photo)) {
        const updatedGallery = currentUser.gallery.filter(
          (galleryPhoto) => galleryPhoto !== input.photo,
        );

        await db
          .update(usersTable)
          .set({ gallery: updatedGallery })
          .where(eq(usersTable.id, ctx.userId));
      }

      return user;
    }),

  setInterests: procedure
    .input(z.object({ interests: z.record(z.string(), z.string()) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await db
          .update(usersTable)
          .set({ interests: sql`${sql.param(JSON.stringify(input.interests))}::jsonb` })
          .where(eq(usersTable.id, ctx.userId));
      } catch (error) {
        const causeMessage =
          (error as any).cause?.message ||
          (error instanceof Error ? error.message : "Failed to update interests");
        console.error("Database error cause:", (error as any).cause || error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: causeMessage,
        });
      }

      return input.interests;
    }),

  removeFromFavorites: procedure
    .input(
      z.object({
        userId: z.number(),
        type: z.enum(["user", "event", "photo"]),
        photo: z.string().optional(),
        eventId: z.number().optional(),
        meetId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      await db
        .delete(favoritesTable)
        .where(
          and(
            eq(favoritesTable.fromUserId, ctx.userId),
            eq(favoritesTable.toUserId, input.userId),
            eq(favoritesTable.type, input.type),
          ),
        );
      let eventCategoryForLog: string | undefined;
      if (input.eventId) {
        const ev = await db.query.eventsTable.findFirst({
          where: eq(eventsTable.id, input.eventId),
          columns: { category: true },
        });
        eventCategoryForLog = ev?.category ?? undefined;
      }
      await logAction({
        userId: ctx.userId,
        type: "favorite_remove",
        itemId: input.userId,
        eventId: input.eventId,
        eventType: eventCategoryForLog,
        meetId: input.meetId,
      });
      return user;
    }),

  subscribe: procedure
    .input(
      z.object({
        userId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      await db.insert(subscriptionsTable).values({
        subscriberId: ctx.userId,
        targetUserId: input.userId,
      });

      await logAction({ userId: ctx.userId, type: "subscribe", itemId: input.userId });

      return user;
    }),

  unSubscribe: procedure
    .input(
      z.object({
        userId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      await db
        .delete(subscriptionsTable)
        .where(
          and(
            eq(subscriptionsTable.subscriberId, ctx.userId),
            eq(subscriptionsTable.targetUserId, input.userId),
          ),
        );
      await logAction({ userId: ctx.userId, type: "unsubscribe", itemId: input.userId });
      return user;
    }),

  getUserSubscribers: procedure
    .input(z.object({ userId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, input?.userId ?? ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      return await db.query.subscriptionsTable.findMany({
        where: eq(subscriptionsTable.targetUserId, user.id),
      });
    }),

  sendReview: procedure
    .input(
      z.object({
        eventId: z.number(),
        review: z.string(),
        rating: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      await db.insert(reviewsTable).values({
        eventId: input.eventId,
        review: input.review,
        rating: input.rating,
        userId: user.id,
      });
      let eventCategoryForLog: string | undefined;
      if (input.eventId) {
        const ev = await db.query.eventsTable.findFirst({
          where: eq(eventsTable.id, input.eventId),
          columns: { category: true },
        });
        eventCategoryForLog = ev?.category ?? undefined;
      }
      await logAction({
        userId: ctx.userId,
        type: "review_send",
        eventId: input.eventId,
        eventType: eventCategoryForLog,
      });
    }),

  getReviews: procedure.query(async ({ ctx }) => {
    return await db.query.reviewsTable.findMany();
  }),

  sendComplaint: procedure
    .input(
      z.object({
        eventId: z.number().optional(),
        complaint: z.string(),
        name: z.string().optional(),
        meetId: z.number().optional(),
        type: z.enum(["event", "user"]),
        toUserId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await db.insert(complaintsTable).values({
        eventId: input.eventId,
        name: input.name,
        complaint: input.complaint,
        fromUserId: ctx.userId,
        meetId: input.meetId,
        toUserId: input.toUserId,
        type: input.type,
      });
      let eventCategoryForLog: string | undefined;
      if (input.eventId) {
        const ev = await db.query.eventsTable.findFirst({
          where: eq(eventsTable.id, input.eventId),
          columns: { category: true },
        });
        eventCategoryForLog = ev?.category ?? undefined;
      }
      await logAction({
        userId: ctx.userId,
        type: "complaint_send",
        eventId: input.eventId,
        eventType: eventCategoryForLog,
        meetId: input.meetId,
        itemId: input.toUserId,
      });
      return res;
    }),

  getComplaints: procedure.query(async ({ ctx }) => {
    return await db.query.complaintsTable.findMany();
  }),

  unsendComplaint: procedure
    .input(
      z.object({
        type: z.enum(["event", "user"]),
        toUserId: z.number().optional(),
        meetId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.type === "user" && input.toUserId) {
        await db
          .delete(complaintsTable)
          .where(eq(complaintsTable.toUserId, input.toUserId!));
        await logAction({
          userId: ctx.userId,
          type: "complaint_unsend",
          itemId: input.toUserId,
        });
      } else {
        await db.delete(complaintsTable).where(eq(complaintsTable.meetId, input.meetId!));
        await logAction({
          userId: ctx.userId,
          type: "complaint_unsend",
          meetId: input.meetId,
        });
      }
    }),

  saveUser: procedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const userFavoritesIds = user.savedIds || [];
      const updatedIds = userFavoritesIds.includes(input.userId)
        ? userFavoritesIds.filter((id) => id !== input.userId)
        : [...userFavoritesIds, input.userId];

      await db
        .update(usersTable)
        .set({ savedIds: updatedIds })
        .where(eq(usersTable.id, ctx.userId));
      await logAction({
        userId: ctx.userId,
        type: "user_save_toggle",
        itemId: input.userId,
      });

      return user;
    }),

  saveEventOrMeet: procedure
    .input(
      z.object({
        meetId: z.number().optional(),
        eventId: z.number().optional(),
        type: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const savedMeetsIds = user.savedMeetsIds || [];
      const savedEvents = user.savedEvents || [];

      if (input.meetId) {
        const updatedMeetIds = savedMeetsIds.includes(input.meetId)
          ? savedMeetsIds.filter((id) => id !== input.meetId)
          : [...savedMeetsIds, input.meetId];

        await db
          .update(usersTable)
          .set({ savedMeetsIds: updatedMeetIds })
          .where(eq(usersTable.id, ctx.userId));
        await logAction({
          userId: ctx.userId,
          type: "meet_save_toggle",
          meetId: input.meetId,
        });
      } else if (input.eventId && input.type) {
        const updatedEvents = savedEvents.some((event) => event.eventId === input.eventId)
          ? savedEvents.filter((event) => event.eventId !== input.eventId)
          : [...savedEvents, { type: input.type, eventId: input.eventId }];

        await db
          .update(usersTable)
          .set({ savedEvents: updatedEvents })
          .where(eq(usersTable.id, ctx.userId));
        await logAction({
          userId: ctx.userId,
          type: "event_save_toggle",
          eventId: input.eventId,
          eventType: input.type,
        });
      }
    }),

  rateUsers: procedure
    .input(
      z.object({ userIds: z.array(z.number()), rating: z.number(), meetId: z.number() }),
    )
    .mutation(async ({ ctx, input }) => {
      const ratings = [];

      for (const userId of input.userIds) {
        const user = await db.query.usersTable.findFirst({
          where: eq(usersTable.id, userId),
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        const existingRating = await db.query.ratingsUserTable.findFirst({
          where: and(
            eq(ratingsUserTable.userId, userId),
            eq(ratingsUserTable.fromUserId, ctx.userId),
            eq(ratingsUserTable.meetId, input.meetId),
          ),
        });

        if (existingRating && existingRating.rating && existingRating.rating > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User already rated",
          });
        }

        const rating = await db.insert(ratingsUserTable).values({
          userId: userId,
          rating: input.rating,
          fromUserId: ctx.userId,
          meetId: input.meetId,
        });

        ratings.push(rating);
      }

      return ratings;
    }),

  getUserRating: procedure
    .input(z.object({ meetId: z.number() }))
    .query(async ({ ctx, input }) => {
      const userRating = await db.query.ratingsUserTable.findMany({
        where: and(
          eq(ratingsUserTable.meetId, input.meetId),
          eq(ratingsUserTable.fromUserId, ctx.userId),
        ),
      });

      return userRating;
    }),

  getMeetRating: procedure
    .input(z.object({ meetId: z.number() }))
    .query(async ({ ctx, input }) => {
      const meet = await db.query.meetTable.findFirst({
        where: eq(meetTable.id, input.meetId),
      });

      if (!meet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meet not found",
        });
      }
      const meetRating = await db.query.ratingsUserTable.findMany({
        where: and(
          eq(ratingsUserTable.meetId, input.meetId),
          eq(ratingsUserTable.userId, meet.userId!),
        ),
      });

      const averageRating =
        meetRating?.reduce((acc, curr) => acc + (curr.rating || 0), 0) /
        (meetRating?.length || 0);

      return averageRating;
    }),

  hideUser: procedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const notInterestedIds = user.notInterestedIds || [];
      const updatedIds = notInterestedIds.includes(input.userId)
        ? notInterestedIds.filter((id) => id !== input.userId)
        : [...notInterestedIds, input.userId];

      await db
        .update(usersTable)
        .set({ notInterestedIds: updatedIds })
        .where(eq(usersTable.id, ctx.userId));
    }),

  sendGift: procedure
    .input(
      z.object({
        userId: z.number(),
        item: z.object({
          type: z.string(),
          eventId: z.number(),
          isActive: z.boolean().optional(),
          name: z.string(),
          id: z.number(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const targetUser = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, input.userId),
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Target user not found",
        });
      }

      const currentInventory = user.inventory || [];
      const removeIdx = currentInventory.findIndex((i) => i.id === input.item.id);

      if (removeIdx < 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ticket id not found" });
      }

      const newUserInventory = [
        ...currentInventory.slice(0, removeIdx),
        ...currentInventory.slice(removeIdx + 1),
      ];

      const newTargetInventory = [
        ...(targetUser.inventory || []),
        { ...input.item, isActive: false },
      ];

      await db
        .update(usersTable)
        .set({
          inventory: newUserInventory,
        })
        .where(eq(usersTable.id, ctx.userId));

      await db
        .update(usersTable)
        .set({
          inventory: newTargetInventory,
        })
        .where(eq(usersTable.id, input.userId));

      return user;
    }),

  getCalendarEvents: procedure.query(async ({ ctx }) => {
    const calendar = await db.query.calendarTable.findMany({
      where: eq(calendarTable.userId, ctx.userId),
    });

    return calendar;
  }),

  addToCalendar: procedure
    .input(
      z.object({
        eventId: z.number().optional(),
        eventType: z.string().optional(),
        date: z.string().optional(),
        meetId: z.number().optional(),
        isPlanned: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.eventId) {
        await db.insert(calendarTable).values({
          userId: ctx.userId,
          eventId: input.eventId,
          eventType: input.eventType,
          date: input.date ? new Date(input.date) : null,
          isPlanned: input.isPlanned ?? false,
        });
      }

      if (input.meetId) {
        await db.insert(calendarTable).values({
          userId: ctx.userId,
          meetId: input.meetId,
          date: input.date ? new Date(input.date) : null,
        });
      }
    }),

  updateInventoryOrder: procedure
    .input(
      z.object({
        inventory: z.array(
          z.object({
            type: z.string(),
            caseId: z.number().optional(),
            eventId: z.number().optional(),
            eventType: z.string().optional(),
            isActive: z.boolean().optional(),
            name: z.string().optional(),
            id: z.number().optional(),
            isInTrade: z.boolean().optional(),
            index: z.number().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Обновляем inventory с новыми индексами
      await db
        .update(usersTable)
        .set({
          inventory: input.inventory,
        })
        .where(eq(usersTable.id, ctx.userId));

      return { success: true };
    }),

  updateLocation: procedure
    .input(
      z.object({
        coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      await db
        .update(usersTable)
        .set({
          coordinates: input.coordinates,
          lastLocationUpdate: new Date(),
        })
        .where(eq(usersTable.id, ctx.userId));
      await logAction({ userId: ctx.userId, type: "location_update" });
      return { success: true };
    }),

  markNotificationsAsRead: procedure.mutation(async ({ ctx }) => {
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(
        and(
          eq(notificationsTable.toUserId, ctx.userId),
          eq(notificationsTable.isRead, false),
        ),
      );
    return { success: true };
  }),

  // Log meet share action
  logShareMeet: procedure
    .input(z.object({ meetId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await logAction({ userId: ctx.userId, type: "share_meet", meetId: input.meetId });
      return { success: true };
    }),

  // Получить предупреждения пользователя
  getUserWarnings: procedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.userId),
    });

    return user?.warnings || [];
  }),

  // Получить баны пользователя
  getUserBans: procedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.userId),
    });

    return user?.bans || [];
  }),
};

export type Router = typeof router;

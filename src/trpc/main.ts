import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import {
  complaintsTable,
  favoritesTable,
  friendRequestsTable,
  notificationsTable,
  reviewsTable,
  subscriptionsTable,
  usersTable,
} from "~/db/schema";
import { uploadBase64Image } from "~/lib/s3/uploadBase64";
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

  getNotifications: procedure.query(async ({ ctx }) => {
    const notifications = await db.query.notificationsTable.findMany({
      where: eq(notificationsTable.toUserId, ctx.userId),
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
        })
        .where(eq(usersTable.id, ctx.userId));

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

      return user;
    }),

  getSubscribers: procedure.query(async ({ ctx }) => {
    const subscribers = await db.query.subscriptionsTable.findMany({
      where: eq(subscriptionsTable.targetUserId, ctx.userId),
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

      return user;
    }),

  getUserSubscriptions: procedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.userId),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }
    return await db.query.subscriptionsTable.findMany({
      where: eq(subscriptionsTable.subscriberId, ctx.userId),
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await db.insert(complaintsTable).values({
        eventId: input.eventId,
        name: input.name,
        complaint: input.complaint,
        userId: ctx.userId,
        meetId: input.meetId,
      });
    }),

  getComplaints: procedure.query(async ({ ctx }) => {
    return await db.query.complaintsTable.findMany();
  }),

  unsendComplaint: procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(complaintsTable).where(eq(complaintsTable.id, input.id));
    }),
};

export type Router = typeof router;

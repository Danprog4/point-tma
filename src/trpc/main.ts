import { TRPCError, TRPCRouterRecord } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import {
  favoritesTable,
  friendRequestsTable,
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

      await db.update(usersTable).set({
        name: input.name,
        surname: input.surname,
        login: input.login,
        birthday: input.birthday,
        city: input.city,
        bio: input.bio,
        sex: input.sex,
        photo: imageUUID,
      });

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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log("updateProfile input.photo:", input.photo?.slice(0, 100));
      console.log(
        "updateProfile input.gallery:",
        Array.isArray(input.gallery)
          ? input.gallery.map((i) => (typeof i === "string" ? i.slice(0, 40) : i))
          : input.gallery,
      );
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      if (input.photo && input.photo.startsWith("data:image/")) {
        const imageUUID = await uploadBase64Image(input.photo);
        await db
          .update(usersTable)
          .set({
            photo: imageUUID,
          })
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
              console.log("uploading");
              console.log(image);
              const imageUUID = await uploadBase64Image(image);
              console.log("uploaded");
              console.log(imageUUID);
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
        })
        .where(eq(usersTable.id, ctx.userId));

      return user;
    }),

  addToFavorites: procedure
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

      await db.insert(favoritesTable).values({
        fromUserId: ctx.userId,
        toUserId: input.userId,
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

  removeFromFavorites: procedure
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
        .delete(favoritesTable)
        .where(
          and(
            eq(favoritesTable.fromUserId, ctx.userId),
            eq(favoritesTable.toUserId, input.userId),
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
} satisfies TRPCRouterRecord;

export type Router = typeof router;

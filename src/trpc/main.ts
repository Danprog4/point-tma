import { TRPCError, TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { usersTable } from "~/db/schema";
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

      if (input.photo) {
        const imageUUID = await uploadBase64Image(input.photo);
        await db.update(usersTable).set({
          photo: imageUUID,
        });
      }

      if (input.gallery) {
        const galleryUUIDs = await Promise.all(
          input.gallery.map(async (image) => {
            const imageUUID = await uploadBase64Image(image);
            return imageUUID;
          }),
        );
        await db.update(usersTable).set({
          gallery: galleryUUIDs,
        });
      }

      await db.update(usersTable).set({
        email: input.email,
        phone: input.phone,
        bio: input.bio,
      });

      return user;
    }),
} satisfies TRPCRouterRecord;

export type Router = typeof router;

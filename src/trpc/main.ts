import { TRPCError, TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { usersTable } from "~/db/schema";
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
        age: z.number(),
        city: z.string(),
        interests: z.string(),
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

      await db.update(usersTable).set({
        name: input.name,
        age: input.age,
        city: input.city,
        interests: input.interests,
      });

      return user;
    }),
} satisfies TRPCRouterRecord;

export type Router = typeof router;

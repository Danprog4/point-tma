import { TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
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
} satisfies TRPCRouterRecord;

export type Router = typeof router;

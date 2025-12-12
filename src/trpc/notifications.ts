import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { notificationTable } from "~/db/schema";
import { createTRPCRouter, procedure } from "./init";

export const notificationsRouter = createTRPCRouter({
  getNotifications: procedure.query(async ({ ctx }) => {
    const notifications = await db.query.notificationTable.findMany({
      where: eq(notificationTable.fromUserId, ctx.userId),
      orderBy: [desc(notificationTable.createdAt)],
    });

    return notifications;
  }),

  readNotification: procedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(notificationTable)
        .set({ isRead: true })
        .where(
          and(
            eq(notificationTable.id, input.id),
            eq(notificationTable.toUserId, ctx.userId),
          ),
        );

      return true;
    }),

  markNotificationsAsRead: procedure.mutation(async ({ ctx }) => {
    await db
      .update(notificationTable)
      .set({ isRead: true })
      .where(
        and(
          eq(notificationTable.toUserId, ctx.userId),
          eq(notificationTable.isRead, false),
        ),
      );
    return { success: true };
  }),
});

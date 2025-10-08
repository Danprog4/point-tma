import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { tasksProgressTable } from "~/db/schema";
import { checkTask } from "~/lib/utils/checkTask";
import { createTRPCRouter, procedure } from "./init";

export const tasksRouter = createTRPCRouter({
  getTasksProgress: procedure.query(async ({ ctx }) => {
    return await db.query.tasksProgressTable.findMany({
      where: eq(tasksProgressTable.userId, ctx.userId),
    });
  }),

  startTask: procedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await db.insert(tasksProgressTable).values({
        userId: ctx.userId,
        taskId: input.taskId,
        progress: 0,
        isCompleted: false,
      });
    }),

  checkTask: procedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await db.query.tasksProgressTable.findFirst({
        where: and(
          eq(tasksProgressTable.userId, ctx.userId),
          eq(tasksProgressTable.taskId, input.taskId),
        ),
      });

      if (!task) {
        return false;
      }

      if (task.taskId === "buy-case") {
        return await checkTask({ userId: ctx.userId, taskId: input.taskId });
      }

      if (task.taskId === "buy-event") {
        return await checkTask({ userId: ctx.userId, taskId: input.taskId });
      }

      if (task.taskId === "active-event") {
        return await checkTask({ userId: ctx.userId, taskId: input.taskId });
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Task type not found",
      });
    }),
});

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "~/db";
import { tasksProgressTable, usersTable } from "~/db/schema";
import { giveXps } from "../giveXps";

interface BuyCaseProps {
  userId: number;
}

export const buyCase = async ({ userId }: BuyCaseProps) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  const existingTask = await db.query.tasksProgressTable.findFirst({
    where: and(
      eq(tasksProgressTable.userId, userId),
      eq(tasksProgressTable.taskId, "buy-case"),
    ),
  });

  if (!existingTask) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Task not started",
    });
  }

  if (existingTask.isCompleted) {
    return false;
  }

  if (existingTask.progress && existingTask.progress >= 1) {
    // Выдаем награду: поинты
    await db
      .update(usersTable)
      .set({
        balance: (user.balance || 0) + 200,
      })
      .where(eq(usersTable.id, userId));

    // Выдаем награду: XP
    await giveXps(userId, user, 50);

    // Отмечаем задание выполненным
    await db
      .update(tasksProgressTable)
      .set({ isCompleted: true })
      .where(eq(tasksProgressTable.id, existingTask.id));

    return true;
  }

  return false;
};

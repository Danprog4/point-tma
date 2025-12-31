import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { backendTasks } from "~/config/tasks";
import { db } from "~/db";
import { tasksProgressTable, usersTable } from "~/db/schema";
import { giveXP, ActionType } from "~/systems/progression";

interface CheckTaskProps {
  userId: number;
  taskId: string;
}

export const checkTask = async ({ userId, taskId }: CheckTaskProps) => {
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
      eq(tasksProgressTable.taskId, taskId),
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

  const task = backendTasks.find((task) => task.id === taskId);

  if (existingTask.progress && existingTask.progress >= 1) {
    // Выдаем награду: поинты
    await db
      .update(usersTable)
      .set({
        balance: (user.balance || 0) + (task?.reward?.points || 0),
      })
      .where(eq(usersTable.id, userId));

    // Выдаем награду: XP (используем базовое действие, можно создать специальный ActionType.TASK_COMPLETE)
    if (task?.reward?.xp && task.reward.xp > 0) {
      // Определяем тип действия по taskId
      let actionType = ActionType.QUEST_COMPLETE; // По умолчанию

      if (taskId === "buy-case") {
        actionType = ActionType.CASE_BUY;
      } else if (taskId === "buy-event") {
        actionType = ActionType.EVENT_BUY;
      } else if (taskId === "meet") {
        actionType = ActionType.MEET_CREATE;
      }

      await giveXP({
        userId,
        actionType,
        isFirstTime: true, // Задания обычно делаются первый раз
      });
    }

    // Отмечаем задание выполненным
    await db
      .update(tasksProgressTable)
      .set({ isCompleted: true })
      .where(eq(tasksProgressTable.id, existingTask.id));

    return true;
  }

  return false;
};

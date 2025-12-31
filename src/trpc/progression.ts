/**
 * TRPC Router для системы прогрессии
 *
 * API endpoints для получения статистики, уровней, навыков и достижений
 */

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { User, usersTable } from "~/db/schema";
import {
  ACHIEVEMENTS,
  ActionType,
  checkAchievements,
  getLevelConfig,
  getUserAchievements,
  getUserProgressStats,
  getUserSkills,
  giveXP,
  LEVEL_CONFIGS,
} from "~/systems/progression";
import { createTRPCRouter, procedure } from "./init";

export const progressionRouter = createTRPCRouter({
  /**
   * Получить полную статистику прогресса пользователя
   */
  getMyProgress: procedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    return getUserProgressStats(user);
  }),

  /**
   * Получить статистику прогресса другого пользователя
   */
  getUserProgress: procedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, input.userId),
      });

      if (!user) {
        throw new Error("User not found");
      }

      return getUserProgressStats(user);
    }),

  /**
   * Получить все навыки текущего пользователя
   */
  getMySkills: procedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    return getUserSkills(user);
  }),

  /**
   * Получить все достижения пользователя с прогрессом
   */
  getMyAchievements: procedure.query(async ({ ctx }) => {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, ctx.userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    return getUserAchievements(user);
  }),

  /**
   * Получить конфиг конкретного уровня
   */
  getLevelInfo: procedure.input(z.object({ level: z.number() })).query(({ input }) => {
    return getLevelConfig(input.level);
  }),

  /**
   * Получить все конфиги уровней
   */
  getAllLevels: procedure.query(() => {
    return LEVEL_CONFIGS;
  }),

  /**
   * Получить все доступные достижения
   */
  getAllAchievements: procedure.query(() => {
    return ACHIEVEMENTS;
  }),

  /**
   * Проверить достижения (вызывается автоматически после действий)
   */
  checkAchievements: procedure.mutation(async ({ ctx }) => {
    return await checkAchievements(ctx.userId);
  }),

  /**
   * Лидерборд по общему уровню
   */
  getLeaderboard: procedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      const users = await db.query.usersTable.findMany({
        orderBy: (users, { desc }) => [desc(users.level), desc(users.xp)],
        limit: input.limit,
        offset: input.offset,
        columns: {
          id: true,
          name: true,
          surname: true,
          photoUrl: true,
          level: true,
          xp: true,
        },
      });

      return users.map((user, index) => ({
        rank: input.offset + index + 1,
        user,
        levelConfig: getLevelConfig(user.level ?? 1),
      }));
    }),

  /**
   * Лидерборд по конкретному навыку
   */
  getSkillLeaderboard: procedure
    .input(
      z.object({
        skillCategory: z.string(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      // Получаем всех пользователей
      const allUsers = await db.query.usersTable.findMany({
        columns: {
          id: true,
          name: true,
          surname: true,
          photoUrl: true,
          skills: true,
        },
      });

      // Фильтруем и сортируем по уровню навыка
      const usersWithSkill = allUsers
        .map((user) => {
          const skills = getUserSkills(user as User);
          const skill = skills.find((s) => s.category === input.skillCategory);

          return {
            user,
            skill: skill ?? {
              category: input.skillCategory,
              level: 0,
              xp: 0,
              totalActions: 0,
            },
          };
        })
        .filter((item) => item.skill.level > 0)
        .sort((a, b) => {
          if (b.skill.level !== a.skill.level) {
            return b.skill.level - a.skill.level;
          }
          return b.skill.xp - a.skill.xp;
        })
        .slice(input.offset, input.offset + input.limit);

      return usersWithSkill.map((item, index) => ({
        rank: input.offset + index + 1,
        user: item.user,
        skill: item.skill,
      }));
    }),

  /**
   * DEBUG: Выдать XP (только для разработки)
   */
  debugGiveXP: procedure
    .input(
      z.object({
        actionType: z.nativeEnum(ActionType),
        isWithFriend: z.boolean().optional(),
        isFirstTime: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // В продакшене этот endpoint должен быть защищён или удалён
      return await giveXP({
        userId: ctx.userId,
        actionType: input.actionType,
        isWithFriend: input.isWithFriend,
        isFirstTime: input.isFirstTime,
      });
    }),
});

/**
 * Система прогрессии - Движок начисления XP
 *
 * Основная логика расчёта и начисления опыта, проверки уровней
 */

import { eq } from "drizzle-orm";
import { db } from "~/db";
import { User, usersTable } from "~/db/schema";
import { logAction } from "~/lib/utils/logger";
import {
  LEVEL_CONFIGS,
  PROGRESSION_CONFIG,
  XP_REWARDS,
  ACHIEVEMENTS,
} from "./config";
import {
  ActionType,
  LevelConfig,
  SkillCategory,
  SkillProgress,
  XPGainResult,
  XPMultiplier,
} from "./types";

// ============================================
// ПОЛУЧЕНИЕ КОНФИГА УРОВНЯ
// ============================================

export const getLevelConfig = (level: number): LevelConfig => {
  const config = LEVEL_CONFIGS.find((l) => l.level === level);
  if (!config) {
    // Если уровень больше максимального, возвращаем последний
    return LEVEL_CONFIGS[LEVEL_CONFIGS.length - 1];
  }
  return config;
};

// ============================================
// РАСЧЁТ УРОВНЯ ИЗ XP
// ============================================

export const calculateLevelFromXP = (totalXP: number): { level: number; remainingXP: number } => {
  let level = 1;

  for (const config of LEVEL_CONFIGS) {
    if (totalXP >= config.xpRequired + config.xpToNext) {
      level = config.level + 1;
    } else {
      const remainingXP = totalXP - config.xpRequired;
      return { level: config.level, remainingXP };
    }
  }

  // Если превысили максимальный уровень
  const maxConfig = LEVEL_CONFIGS[LEVEL_CONFIGS.length - 1];
  return {
    level: PROGRESSION_CONFIG.maxLevel,
    remainingXP: totalXP - maxConfig.xpRequired,
  };
};

// ============================================
// ПРОГРЕСС ДО СЛЕДУЮЩЕГО УРОВНЯ
// ============================================

export const getLevelProgress = (
  currentXP: number,
  currentLevel: number
): {
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number; // 0-100%
} => {
  const config = getLevelConfig(currentLevel);

  return {
    currentLevelXP: currentXP - config.xpRequired,
    nextLevelXP: config.xpToNext,
    progress: Math.min(100, ((currentXP - config.xpRequired) / config.xpToNext) * 100),
  };
};

// ============================================
// РАСЧЁТ МНОЖИТЕЛЕЙ
// ============================================

const calculateMultipliers = (params: {
  user: User;
  actionType: ActionType;
  isWithFriend?: boolean;
  isFirstTime?: boolean;
}): XPMultiplier[] => {
  const multipliers: XPMultiplier[] = [];

  // Streak множитель
  const streak = params.user.checkInStreak ?? 0;
  if (streak > 0) {
    const streakBonus = Math.min(streak, 7) * PROGRESSION_CONFIG.streakMultiplier;
    multipliers.push({
      type: "streak",
      value: 1 + streakBonus,
      description: `Streak x${streak} (+${Math.round(streakBonus * 100)}%)`,
    });
  }

  // VIP множитель (если будет реализован)
  // const isVIP = params.user.isVIP;
  // if (isVIP) {
  //   multipliers.push({
  //     type: "vip",
  //     value: PROGRESSION_CONFIG.vipMultiplier,
  //     description: `VIP (+${Math.round((PROGRESSION_CONFIG.vipMultiplier - 1) * 100)}%)`,
  //   });
  // }

  // Бонус за действие с другом
  if (params.isWithFriend) {
    multipliers.push({
      type: "friend_bonus",
      value: PROGRESSION_CONFIG.friendBonusMultiplier,
      description: `С другом (+${Math.round((PROGRESSION_CONFIG.friendBonusMultiplier - 1) * 100)}%)`,
    });
  }

  // Бонус за первый раз
  if (params.isFirstTime) {
    multipliers.push({
      type: "first_time",
      value: 2.0,
      description: "Первый раз (+100%)",
    });
  }

  return multipliers;
};

// ============================================
// РАСЧЁТ ИТОГОВОГО XP
// ============================================

const calculateTotalXP = (baseXP: number, multipliers: XPMultiplier[]): number => {
  let total = baseXP;

  for (const multiplier of multipliers) {
    total *= multiplier.value;
  }

  return Math.floor(total);
};

// ============================================
// ПРОКАЧКА НАВЫКА
// ============================================

const progressSkill = async (
  userId: number,
  category: SkillCategory,
  xp: number
): Promise<{ leveledUp: boolean; newLevel?: number }> => {
  // Получаем текущие навыки пользователя
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });

  if (!user) return { leveledUp: false };

  // Парсим skills из JSONB
  const skills: SkillProgress[] = (user.skills as any) ?? [];

  // Находим нужный навык
  let skillIndex = skills.findIndex((s) => s.category === category);

  if (skillIndex === -1) {
    // Создаём новый навык
    skills.push({
      category,
      level: 1,
      xp: 0,
      totalActions: 0,
    });
    skillIndex = skills.length - 1;
  }

  const skill = skills[skillIndex];

  // Добавляем XP
  skill.xp += xp;
  skill.totalActions += 1;

  // Проверяем уровень навыка
  let leveledUp = false;
  let newLevel = skill.level;

  // Формула для уровня навыка: baseXP × level^1.5
  while (skill.level < PROGRESSION_CONFIG.skillMaxLevel) {
    const xpForNextLevel = Math.floor(
      PROGRESSION_CONFIG.skillLevelXPBase * Math.pow(skill.level, 1.5)
    );

    if (skill.xp >= xpForNextLevel) {
      skill.xp -= xpForNextLevel;
      skill.level += 1;
      leveledUp = true;
      newLevel = skill.level;
    } else {
      break;
    }
  }

  // Сохраняем обновлённые навыки
  await db.update(usersTable).set({ skills: skills as any }).where(eq(usersTable.id, userId));

  return { leveledUp, newLevel: leveledUp ? newLevel : undefined };
};

// ============================================
// ОСНОВНАЯ ФУНКЦИЯ: НАЧИСЛЕНИЕ XP
// ============================================

export const giveXP = async (params: {
  userId: number;
  actionType: ActionType;
  isWithFriend?: boolean;
  isFirstTime?: boolean;
}): Promise<XPGainResult> => {
  // Получаем пользователя
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, params.userId),
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Получаем конфиг награды за действие
  const rewardConfig = XP_REWARDS[params.actionType];
  if (!rewardConfig) {
    throw new Error(`No XP reward config for action: ${params.actionType}`);
  }

  // Рассчитываем множители
  const multipliers = calculateMultipliers({
    user,
    actionType: params.actionType,
    isWithFriend: params.isWithFriend,
    isFirstTime: params.isFirstTime,
  });

  // Рассчитываем итоговый XP
  const totalXP = calculateTotalXP(rewardConfig.baseXP, multipliers);

  // Текущий уровень и XP
  const oldLevel = user.level ?? 1;
  const oldTotalXP = user.xp ?? 0;
  const newTotalXP = oldTotalXP + totalXP;

  // Обновляем XP пользователя
  await db
    .update(usersTable)
    .set({
      xp: newTotalXP,
    })
    .where(eq(usersTable.id, params.userId));

  // Рассчитываем новый уровень
  const { level: newLevel, remainingXP } = calculateLevelFromXP(newTotalXP);

  const leveledUp = newLevel > oldLevel;

  // Если уровень повысился, обновляем и выдаём награды
  let rewards = [];
  if (leveledUp) {
    await db
      .update(usersTable)
      .set({
        level: newLevel,
        xp: newTotalXP, // Храним общий XP
      })
      .where(eq(usersTable.id, params.userId));

    // Получаем награды за все промежуточные уровни
    for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
      const config = getLevelConfig(lvl);
      rewards.push(...config.rewards);

      // Выдаём награды
      for (const reward of config.rewards) {
        if (reward.type === "points") {
          await db
            .update(usersTable)
            .set({
              balance: (user.balance ?? 0) + Number(reward.value),
            })
            .where(eq(usersTable.id, params.userId));
        }
        // TODO: Обработка других типов наград (кейсы, ключи, достижения)
      }
    }
  }

  // Прокачиваем навык
  const skillGain = await progressSkill(params.userId, rewardConfig.skillCategory, totalXP);

  // Логируем действие
  await logAction({
    userId: params.userId,
    type: "xp_gain",
    amount: totalXP,
    details: JSON.stringify({
      actionType: params.actionType,
      baseXP: rewardConfig.baseXP,
      multipliers: multipliers.map((m) => m.type),
      skillCategory: rewardConfig.skillCategory,
      leveledUp,
      oldLevel,
      newLevel,
    }),
  });

  return {
    totalXP,
    baseXP: rewardConfig.baseXP,
    multipliers,
    skillGain: {
      category: rewardConfig.skillCategory,
      xp: totalXP,
      leveledUp: skillGain.leveledUp,
      newLevel: skillGain.newLevel,
    },
    leveledUp,
    oldLevel,
    newLevel,
    rewards,
  };
};

// ============================================
// ПРОВЕРКА ДОСТИЖЕНИЙ
// ============================================

export const checkAchievements = async (userId: number): Promise<string[]> => {
  const unlockedAchievements: string[] = [];

  // Получаем пользователя
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });

  if (!user) return [];

  // Получаем текущие достижения пользователя
  const currentAchievements = (user.achievements as any) ?? [];
  const achievementIds = currentAchievements.map((a: any) => a.id);

  // Проверяем все достижения
  for (const achievement of ACHIEVEMENTS) {
    // Пропускаем уже полученные
    if (achievementIds.includes(achievement.id)) continue;

    let unlocked = false;

    if (achievement.condition.type === "level_reached") {
      unlocked = (user.level ?? 1) >= (achievement.condition.level ?? 0);
    } else if (achievement.condition.type === "action_count") {
      // Нужно проверить количество действий из логов
      // TODO: Реализовать подсчёт действий из loggingTable
    } else if (achievement.condition.type === "skill_level") {
      const skills: SkillProgress[] = (user.skills as any) ?? [];
      const skill = skills.find((s) => s.category === achievement.condition.skillCategory);
      unlocked = (skill?.level ?? 0) >= (achievement.condition.level ?? 0);
    }

    if (unlocked) {
      // Добавляем достижение
      currentAchievements.push({
        id: achievement.id,
        unlockedAt: new Date(),
      });

      unlockedAchievements.push(achievement.id);

      // Выдаём XP награду
      await giveXP({
        userId,
        actionType: ActionType.QUEST_COMPLETE, // Placeholder
      });
    }
  }

  // Сохраняем обновлённые достижения
  if (unlockedAchievements.length > 0) {
    await db
      .update(usersTable)
      .set({ achievements: currentAchievements as any })
      .where(eq(usersTable.id, userId));
  }

  return unlockedAchievements;
};

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Получить навыки пользователя
 */
export const getUserSkills = (user: User): SkillProgress[] => {
  return (user.skills as any) ?? [];
};

/**
 * Получить достижения пользователя с прогрессом
 */
export const getUserAchievements = (user: User) => {
  const userAchievements = (user.achievements as any) ?? [];

  return ACHIEVEMENTS.map((achievement) => {
    const userAch = userAchievements.find((a: any) => a.id === achievement.id);

    return {
      ...achievement,
      progress: {
        current: 0, // TODO: Рассчитать из логов
        required: achievement.condition.count ?? 1,
        unlocked: !!userAch,
        unlockedAt: userAch?.unlockedAt,
      },
    };
  });
};

/**
 * Получить статистику прогресса пользователя
 */
export const getUserProgressStats = (user: User) => {
  const { level: currentLevel, remainingXP } = calculateLevelFromXP(user.xp ?? 0);
  const progress = getLevelProgress(user.xp ?? 0, currentLevel);
  const levelConfig = getLevelConfig(currentLevel);

  const skills = getUserSkills(user);
  const achievements = getUserAchievements(user);

  return {
    level: {
      current: currentLevel,
      title: levelConfig.title,
      badge: levelConfig.badge,
      xp: {
        current: progress.currentLevelXP,
        required: progress.nextLevelXP,
        total: user.xp ?? 0,
        progress: progress.progress,
      },
      nextRewards: getLevelConfig(currentLevel + 1).rewards,
    },
    skills: skills.map((skill) => ({
      ...skill,
      xpToNext: Math.floor(PROGRESSION_CONFIG.skillLevelXPBase * Math.pow(skill.level, 1.5)),
      progress:
        (skill.xp / Math.floor(PROGRESSION_CONFIG.skillLevelXPBase * Math.pow(skill.level, 1.5))) *
        100,
    })),
    achievements: {
      total: ACHIEVEMENTS.length,
      unlocked: achievements.filter((a) => a.progress?.unlocked).length,
      list: achievements,
    },
  };
};

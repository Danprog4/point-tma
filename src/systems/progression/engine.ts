/**
 * Система прогрессии - Движок начисления XP
 *
 * Основная логика расчёта и начисления опыта, проверки уровней
 */

import { and, eq, or, sql } from "drizzle-orm";
import { db } from "~/db";
import {
  activeEventsTable,
  friendRequestsTable,
  loggingTable,
  meetTable,
  sellingTable,
  tradesTable,
  User,
  usersTable,
} from "~/db/schema";
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

type AchievementProgressState = {
  current: number;
  required: number;
  unlocked: boolean;
};

type AchievementMetrics = {
  actionCounts: Partial<Record<ActionType, number>>;
  skills: SkillProgress[];
  streak: number;
};

type StoredAchievement = string | { id?: string; unlockedAt?: Date | string };

const isSkillCategory = (value: unknown): value is SkillCategory => {
  return typeof value === "string" && Object.values(SkillCategory).includes(value as SkillCategory);
};

const normalizeSkills = (raw: unknown): SkillProgress[] => {
  if (!Array.isArray(raw)) return [];

  return raw.reduce<SkillProgress[]>((acc, entry) => {
    if (!entry || typeof entry !== "object") return acc;
    const skill = entry as Record<string, unknown>;
    if (!isSkillCategory(skill.category)) return acc;

    acc.push({
      category: skill.category,
      level: typeof skill.level === "number" ? skill.level : 1,
      xp: typeof skill.xp === "number" ? skill.xp : 0,
      totalActions: typeof skill.totalActions === "number" ? skill.totalActions : 0,
    });

    return acc;
  }, []);
};

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
  for (const config of LEVEL_CONFIGS) {
    if (totalXP >= config.xpRequired + config.xpToNext) {
      continue;
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
  const skills = normalizeSkills(user.skills);

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
  await db
    .update(usersTable)
    .set({ skills: skills as unknown as User["skills"] })
    .where(eq(usersTable.id, userId));

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
  const { level: newLevel } = calculateLevelFromXP(newTotalXP);

  const leveledUp = newLevel > oldLevel;

  // Если уровень повысился, обновляем и выдаём награды
  const rewards: XPGainResult["rewards"] = [];
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

const extractActionTypeFromLogDetails = (details: unknown): string | null => {
  if (!details) return null;

  if (typeof details === "string") {
    try {
      const parsed = JSON.parse(details) as unknown;
      if (
        parsed &&
        typeof parsed === "object" &&
        "actionType" in parsed &&
        typeof (parsed as Record<string, unknown>).actionType === "string"
      ) {
        return (parsed as Record<string, string>).actionType;
      }
    } catch {
      return null;
    }
    return null;
  }

  if (typeof details === "object") {
    const actionType = (details as Record<string, unknown>).actionType;
    return typeof actionType === "string" ? actionType : null;
  }

  return null;
};

const countXPActionLogs = async (userId: number, actionType: ActionType): Promise<number> => {
  const logs = await db.query.loggingTable.findMany({
    where: and(eq(loggingTable.userId, userId), eq(loggingTable.type, "xp_gain")),
    columns: { details: true },
  });

  return logs.reduce((total, log) => {
    const loggedActionType = extractActionTypeFromLogDetails(log.details);
    return total + (loggedActionType === actionType ? 1 : 0);
  }, 0);
};

const buildAchievementMetrics = async (user: User): Promise<AchievementMetrics> => {
  const userId = user.id;

  const [
    completedQuests,
    acceptedFriends,
    createdMeets,
    completedTrades,
    soldListings,
    locationUpdates,
    legendaryQuestCompletions,
    marketSellActionsFromLogs,
    tradeCompleteActionsFromLogs,
  ] = await Promise.all([
    db.query.activeEventsTable.findMany({
      where: and(eq(activeEventsTable.userId, userId), eq(activeEventsTable.isCompleted, true)),
      columns: { id: true },
    }),
    db.query.friendRequestsTable.findMany({
      where: and(
        eq(friendRequestsTable.status, "accepted"),
        or(eq(friendRequestsTable.fromUserId, userId), eq(friendRequestsTable.toUserId, userId)),
      ),
      columns: { id: true },
    }),
    db.query.meetTable.findMany({
      where: eq(meetTable.userId, userId),
      columns: { id: true },
    }),
    db.query.tradesTable.findMany({
      where: and(
        eq(tradesTable.status, "completed"),
        or(eq(tradesTable.fromUserId, userId), eq(tradesTable.toUserId, userId)),
      ),
      columns: { id: true },
    }),
    db.query.sellingTable.findMany({
      where: and(eq(sellingTable.userId, userId), eq(sellingTable.status, "sold")),
      columns: { id: true },
    }),
    db.query.loggingTable.findMany({
      where: and(eq(loggingTable.userId, userId), eq(loggingTable.type, "location_update")),
      columns: { id: true },
    }),
    countXPActionLogs(userId, ActionType.QUEST_COMPLETE_LEGENDARY),
    countXPActionLogs(userId, ActionType.MARKET_SELL),
    countXPActionLogs(userId, ActionType.TRADE_COMPLETE),
  ]);

  return {
    actionCounts: {
      [ActionType.QUEST_COMPLETE]: completedQuests.length,
      [ActionType.QUEST_COMPLETE_LEGENDARY]: legendaryQuestCompletions,
      [ActionType.FRIEND_ADD]: acceptedFriends.length,
      [ActionType.MEET_CREATE]: createdMeets.length,
      [ActionType.TRADE_COMPLETE]: Math.max(completedTrades.length, tradeCompleteActionsFromLogs),
      [ActionType.MARKET_SELL]: Math.max(soldListings.length, marketSellActionsFromLogs),
      [ActionType.NEW_LOCATION_VISIT]: locationUpdates.length,
    },
    skills: getUserSkills(user),
    streak: user.checkInStreak ?? 0,
  };
};

const getAchievementProgressState = (
  user: User,
  achievement: (typeof ACHIEVEMENTS)[number],
  metrics: AchievementMetrics,
): AchievementProgressState => {
  if (achievement.condition.type === "level_reached") {
    const required = achievement.condition.level ?? 1;
    const current = user.level ?? 1;
    return { current, required, unlocked: current >= required };
  }

  if (achievement.condition.type === "skill_level") {
    const required = achievement.condition.level ?? 1;
    const current =
      metrics.skills.find((s) => s.category === achievement.condition.skillCategory)?.level ?? 0;
    return { current, required, unlocked: current >= required };
  }

  if (achievement.condition.type === "action_count") {
    const required = achievement.condition.count ?? 1;
    const current = achievement.condition.actionType
      ? (metrics.actionCounts[achievement.condition.actionType] ?? 0)
      : 0;
    return { current, required, unlocked: current >= required };
  }

  if (achievement.condition.type === "custom") {
    if (achievement.condition.customCheck === "check_streak_7") {
      const required = 7;
      const current = metrics.streak;
      return { current, required, unlocked: current >= required };
    }
    return { current: 0, required: 1, unlocked: false };
  }

  return { current: 0, required: 1, unlocked: false };
};

const getUnlockedAchievementIds = (achievements: unknown): Set<string> => {
  if (!Array.isArray(achievements)) return new Set();

  const ids = new Set<string>();

  for (const entry of achievements) {
    if (typeof entry === "string") {
      ids.add(entry);
      continue;
    }

    if (entry && typeof entry === "object") {
      const id = (entry as Record<string, unknown>).id;
      if (typeof id === "string") ids.add(id);
    }
  }

  return ids;
};

const applyAchievementXPReward = async (userId: number, xpReward: number): Promise<void> => {
  if (xpReward <= 0) return;

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });

  if (!user) return;

  const oldLevel = user.level ?? 1;
  const oldXP = user.xp ?? 0;
  const newXP = oldXP + xpReward;
  const { level: newLevel } = calculateLevelFromXP(newXP);

  await db
    .update(usersTable)
    .set({
      xp: newXP,
      level: newLevel,
    })
    .where(eq(usersTable.id, userId));

  if (newLevel <= oldLevel) return;

  for (let level = oldLevel + 1; level <= newLevel; level++) {
    const levelConfig = getLevelConfig(level);
    for (const reward of levelConfig.rewards) {
      if (reward.type !== "points") continue;

      const points = Number(reward.value);
      if (!Number.isFinite(points) || points <= 0) continue;

      await db
        .update(usersTable)
        .set({
          balance: sql`coalesce(${usersTable.balance}, 0) + ${points}`,
        })
        .where(eq(usersTable.id, userId));
    }
  }
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
  const currentAchievements = Array.isArray(user.achievements) ? [...user.achievements] : [];
  const achievementIds = getUnlockedAchievementIds(currentAchievements);
  const metrics = await buildAchievementMetrics(user);

  // Проверяем все достижения
  for (const achievement of ACHIEVEMENTS) {
    // Пропускаем уже полученные
    if (achievementIds.has(achievement.id)) continue;

    const progressState = getAchievementProgressState(user, achievement, metrics);

    if (progressState.unlocked) {
      // Добавляем достижение
      currentAchievements.push({
        id: achievement.id,
        unlockedAt: new Date(),
      });
      achievementIds.add(achievement.id);

      unlockedAchievements.push(achievement.id);

      // Выдаем XP-награду достижения
      await applyAchievementXPReward(userId, achievement.xpReward);
    }
  }

  // Сохраняем обновлённые достижения
  if (unlockedAchievements.length > 0) {
    await db
      .update(usersTable)
      .set({ achievements: currentAchievements as unknown as User["achievements"] })
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
  return normalizeSkills(user.skills);
};

/**
 * Получить достижения пользователя с прогрессом
 */
export const getUserAchievements = async (user: User) => {
  const userAchievements: StoredAchievement[] = Array.isArray(user.achievements)
    ? (user.achievements as StoredAchievement[])
    : [];
  const metrics = await buildAchievementMetrics(user);
  const unlockedIds = getUnlockedAchievementIds(userAchievements);

  return ACHIEVEMENTS.map((achievement) => {
    const userAch = userAchievements.find((a) => {
      if (typeof a === "string") return a === achievement.id;
      return a?.id === achievement.id;
    });

    const progressState = getAchievementProgressState(user, achievement, metrics);
    const unlocked = unlockedIds.has(achievement.id) || progressState.unlocked;
    const rawUnlockedAt =
      userAch && typeof userAch === "object" && "unlockedAt" in userAch
        ? userAch.unlockedAt
        : undefined;
    const unlockedAt = rawUnlockedAt ? new Date(rawUnlockedAt) : undefined;

    return {
      ...achievement,
      progress: {
        current: progressState.current,
        required: Math.max(progressState.required, 1),
        unlocked,
        unlockedAt,
      },
    };
  });
};

/**
 * Получить статистику прогресса пользователя
 */
export const getUserProgressStats = async (user: User) => {
  const { level: currentLevel } = calculateLevelFromXP(user.xp ?? 0);
  const progress = getLevelProgress(user.xp ?? 0, currentLevel);
  const levelConfig = getLevelConfig(currentLevel);

  const skills = getUserSkills(user);
  const achievements = await getUserAchievements(user);

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

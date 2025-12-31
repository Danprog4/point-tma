/**
 * Система прогрессии - Конфигурация
 *
 * Все константы, награды и формулы для системы прогрессии
 */

import {
  ActionType,
  AchievementCategory,
  LevelConfig,
  ProgressionConfig,
  SkillCategory,
  XPReward,
  Achievement,
} from "./types";

// ============================================
// ОСНОВНАЯ КОНФИГУРАЦИЯ
// ============================================

export const PROGRESSION_CONFIG: ProgressionConfig = {
  maxLevel: 100,
  baseXPMultiplier: 100, // Базовый XP для уровня 1

  streakMultiplier: 0.1, // +10% за каждый день streak (макс 7 дней = +70%)
  vipMultiplier: 1.25, // +25% для VIP
  friendBonusMultiplier: 1.2, // +20% если действие с другом

  skillMaxLevel: 50,
  skillLevelXPBase: 100, // XP для первого уровня навыка

  pointsPerLevel: 100, // Базовые поинты за уровень
};

// ============================================
// ГЕНЕРАЦИЯ УРОВНЕЙ (1-100)
// ============================================

/**
 * Экспоненциальная формула:
 * XP(n) = baseXP × (growth^(n-1))
 *
 * Где:
 * - baseXP = 100
 * - growth = 1.15 (рост на 15% каждый уровень)
 */
export const generateLevelConfigs = (): LevelConfig[] => {
  const levels: LevelConfig[] = [];
  let totalXP = 0;

  for (let level = 1; level <= PROGRESSION_CONFIG.maxLevel; level++) {
    const xpToNext = Math.floor(
      PROGRESSION_CONFIG.baseXPMultiplier * Math.pow(1.15, level - 1)
    );

    levels.push({
      level,
      xpRequired: totalXP,
      xpToNext,
      rewards: getLevelRewards(level),
      title: getLevelTitle(level),
      badge: getLevelBadge(level),
    });

    totalXP += xpToNext;
  }

  return levels;
};

// ============================================
// ТИТУЛЫ ПО УРОВНЯМ
// ============================================

const getLevelTitle = (level: number): string => {
  if (level === 1) return "Новичок";
  if (level < 5) return "Исследователь";
  if (level < 10) return "Путешественник";
  if (level < 20) return "Авантюрист";
  if (level < 30) return "Профи";
  if (level < 50) return "Эксперт";
  if (level < 70) return "Мастер";
  if (level < 90) return "Чемпион";
  if (level < 100) return "Легенда";
  return "Бог Point";
};

// ============================================
// БЕЙДЖИ ПО УРОВНЯМ
// ============================================

const getLevelBadge = (level: number): string | undefined => {
  // Бейджи каждые 10 уровней
  if (level % 10 === 0) return `level_${level}`;
  // Особые бейджи
  if (level === 1) return "first_level";
  if (level === 25) return "quarter_master";
  if (level === 50) return "half_legend";
  if (level === 75) return "almost_god";
  if (level === 100) return "point_god";
  return undefined;
};

// ============================================
// НАГРАДЫ ЗА УРОВНИ
// ============================================

const getLevelRewards = (level: number) => {
  const rewards = [];

  // Каждый уровень даёт поинты
  rewards.push({
    type: "points" as const,
    value: PROGRESSION_CONFIG.pointsPerLevel * level, // Растёт с уровнем
    description: `${PROGRESSION_CONFIG.pointsPerLevel * level} поинтов`,
  });

  // Каждые 5 уровней - кейс
  if (level % 5 === 0) {
    const rarity = level < 25 ? "common" : level < 50 ? "rare" : level < 75 ? "epic" : "legendary";
    rewards.push({
      type: "case" as const,
      value: rarity,
      description: `${rarity} кейс`,
    });
  }

  // Каждые 10 уровней - ключ
  if (level % 10 === 0) {
    rewards.push({
      type: "key" as const,
      value: 1,
      description: "Золотой ключ",
    });
  }

  // Особые награды
  if (level === 10) {
    rewards.push({
      type: "unlock" as const,
      value: "fast_meet",
      description: "Разблокированы Быстрые Встречи",
    });
  }

  if (level === 20) {
    rewards.push({
      type: "unlock" as const,
      value: "create_event",
      description: "Разблокировано создание событий",
    });
  }

  if (level === 50) {
    rewards.push({
      type: "achievement" as const,
      value: "half_legend",
      description: "Достижение: Полулегенда",
    });
  }

  if (level === 100) {
    rewards.push({
      type: "achievement" as const,
      value: "point_god",
      description: "Достижение: Бог Point",
    });
  }

  return rewards;
};

// ============================================
// XP НАГРАДЫ ЗА ДЕЙСТВИЯ
// ============================================

export const XP_REWARDS: Record<ActionType, XPReward> = {
  // КВЕСТЫ
  [ActionType.QUEST_START]: {
    baseXP: 10,
    skillCategory: SkillCategory.ADVENTURE,
  },
  [ActionType.QUEST_COMPLETE]: {
    baseXP: 100,
    skillCategory: SkillCategory.ADVENTURE,
  },
  [ActionType.QUEST_COMPLETE_RARE]: {
    baseXP: 200,
    skillCategory: SkillCategory.ADVENTURE,
  },
  [ActionType.QUEST_COMPLETE_EPIC]: {
    baseXP: 500,
    skillCategory: SkillCategory.ADVENTURE,
  },
  [ActionType.QUEST_COMPLETE_LEGENDARY]: {
    baseXP: 1000,
    skillCategory: SkillCategory.ADVENTURE,
  },

  // ВСТРЕЧИ
  [ActionType.MEET_CREATE]: {
    baseXP: 30,
    skillCategory: SkillCategory.SOCIAL,
  },
  [ActionType.MEET_JOIN]: {
    baseXP: 20,
    skillCategory: SkillCategory.SOCIAL,
  },
  [ActionType.MEET_COMPLETE]: {
    baseXP: 80,
    skillCategory: SkillCategory.SOCIAL,
  },
  [ActionType.MEET_RATED_HIGH]: {
    baseXP: 50,
    skillCategory: SkillCategory.SOCIAL,
  },

  // СОЦИАЛЬНОЕ
  [ActionType.FRIEND_ADD]: {
    baseXP: 25,
    skillCategory: SkillCategory.SOCIAL,
  },
  [ActionType.PROFILE_VIEW]: {
    baseXP: 2,
    skillCategory: SkillCategory.SOCIAL,
  },
  [ActionType.PROFILE_SAVE]: {
    baseXP: 5,
    skillCategory: SkillCategory.SOCIAL,
  },
  [ActionType.SUBSCRIBE]: {
    baseXP: 10,
    skillCategory: SkillCategory.SOCIAL,
  },

  // ЭКОНОМИКА
  [ActionType.CASE_BUY]: {
    baseXP: 15,
    skillCategory: SkillCategory.ECONOMY,
  },
  [ActionType.CASE_OPEN]: {
    baseXP: 20,
    skillCategory: SkillCategory.ECONOMY,
  },
  [ActionType.EVENT_BUY]: {
    baseXP: 30,
    skillCategory: SkillCategory.ECONOMY,
  },
  [ActionType.MARKET_SELL]: {
    baseXP: 25,
    skillCategory: SkillCategory.ECONOMY,
  },
  [ActionType.MARKET_BUY]: {
    baseXP: 20,
    skillCategory: SkillCategory.ECONOMY,
  },
  [ActionType.TRADE_COMPLETE]: {
    baseXP: 40,
    skillCategory: SkillCategory.ECONOMY,
  },

  // КРЕАТИВНОСТЬ
  [ActionType.EVENT_CREATE]: {
    baseXP: 150,
    skillCategory: SkillCategory.CREATIVE,
  },
  [ActionType.MEET_ORGANIZE]: {
    baseXP: 100,
    skillCategory: SkillCategory.CREATIVE,
  },

  // ПОМОЩЬ
  [ActionType.HELP_QUEST_COMPLETE]: {
    baseXP: 120,
    skillCategory: SkillCategory.HELPER,
  },
  [ActionType.REFERRAL_JOINED]: {
    baseXP: 50,
    skillCategory: SkillCategory.HELPER,
  },

  // ИССЛЕДОВАНИЕ
  [ActionType.NEW_LOCATION_VISIT]: {
    baseXP: 30,
    skillCategory: SkillCategory.EXPLORER,
  },
  [ActionType.DAILY_CHECKIN]: {
    baseXP: 50,
    skillCategory: SkillCategory.EXPLORER,
  },
};

// ============================================
// ДОСТИЖЕНИЯ
// ============================================

export const ACHIEVEMENTS: Achievement[] = [
  // КВЕСТЫ
  {
    id: "first_quest",
    category: AchievementCategory.QUESTS,
    name: "Первый квест",
    description: "Завершите свой первый квест",
    icon: "🎯",
    rarity: "common",
    xpReward: 50,
    condition: {
      type: "action_count",
      actionType: ActionType.QUEST_COMPLETE,
      count: 1,
    },
  },
  {
    id: "quest_master_10",
    category: AchievementCategory.QUESTS,
    name: "Мастер квестов",
    description: "Завершите 10 квестов",
    icon: "🏆",
    rarity: "rare",
    xpReward: 200,
    condition: {
      type: "action_count",
      actionType: ActionType.QUEST_COMPLETE,
      count: 10,
    },
  },
  {
    id: "legendary_hunter",
    category: AchievementCategory.QUESTS,
    name: "Охотник за легендами",
    description: "Завершите легендарный квест",
    icon: "👑",
    rarity: "legendary",
    xpReward: 1000,
    condition: {
      type: "action_count",
      actionType: ActionType.QUEST_COMPLETE_LEGENDARY,
      count: 1,
    },
  },

  // СОЦИАЛЬНОЕ
  {
    id: "first_friend",
    category: AchievementCategory.SOCIAL,
    name: "Первый друг",
    description: "Добавьте первого друга",
    icon: "👥",
    rarity: "common",
    xpReward: 50,
    condition: {
      type: "action_count",
      actionType: ActionType.FRIEND_ADD,
      count: 1,
    },
  },
  {
    id: "social_butterfly",
    category: AchievementCategory.SOCIAL,
    name: "Социальная бабочка",
    description: "Добавьте 50 друзей",
    icon: "🦋",
    rarity: "epic",
    xpReward: 500,
    condition: {
      type: "action_count",
      actionType: ActionType.FRIEND_ADD,
      count: 50,
    },
  },
  {
    id: "meet_organizer",
    category: AchievementCategory.SOCIAL,
    name: "Организатор",
    description: "Создайте 5 встреч",
    icon: "📅",
    rarity: "rare",
    xpReward: 200,
    condition: {
      type: "action_count",
      actionType: ActionType.MEET_CREATE,
      count: 5,
    },
  },

  // ЭКОНОМИКА
  {
    id: "first_trade",
    category: AchievementCategory.ECONOMY,
    name: "Первая сделка",
    description: "Совершите первую сделку",
    icon: "💰",
    rarity: "common",
    xpReward: 50,
    condition: {
      type: "action_count",
      actionType: ActionType.TRADE_COMPLETE,
      count: 1,
    },
  },
  {
    id: "market_tycoon",
    category: AchievementCategory.ECONOMY,
    name: "Магнат маркета",
    description: "Продайте 100 предметов",
    icon: "💎",
    rarity: "epic",
    xpReward: 500,
    condition: {
      type: "action_count",
      actionType: ActionType.MARKET_SELL,
      count: 100,
    },
  },

  // ИССЛЕДОВАТЕЛЬ
  {
    id: "explorer_10",
    category: AchievementCategory.EXPLORER,
    name: "Путешественник",
    description: "Посетите 10 новых локаций",
    icon: "🗺️",
    rarity: "rare",
    xpReward: 200,
    condition: {
      type: "action_count",
      actionType: ActionType.NEW_LOCATION_VISIT,
      count: 10,
    },
  },
  {
    id: "streak_7",
    category: AchievementCategory.EXPLORER,
    name: "Неделя подряд",
    description: "Заходите 7 дней подряд",
    icon: "🔥",
    rarity: "rare",
    xpReward: 300,
    condition: {
      type: "custom",
      customCheck: "check_streak_7",
    },
  },

  // ОСОБЫЕ
  {
    id: "level_50",
    category: AchievementCategory.SPECIAL,
    name: "Полулегенда",
    description: "Достигните 50 уровня",
    icon: "⭐",
    rarity: "legendary",
    xpReward: 2000,
    condition: {
      type: "level_reached",
      level: 50,
    },
  },
  {
    id: "level_100",
    category: AchievementCategory.SPECIAL,
    name: "Бог Point",
    description: "Достигните 100 уровня",
    icon: "👑",
    rarity: "legendary",
    xpReward: 10000,
    condition: {
      type: "level_reached",
      level: 100,
    },
  },
];

// Экспортируем уже сгенерированные уровни
export const LEVEL_CONFIGS = generateLevelConfigs();

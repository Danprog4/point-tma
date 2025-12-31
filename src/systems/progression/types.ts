/**
 * Система прогрессии - Типы
 *
 * Определяет все типы для системы уровней, навыков и наград
 */

// ============================================
// УРОВНИ И ОПЫТ
// ============================================

export type Level = number; // 1-100+
export type XP = number;

export interface LevelConfig {
  level: Level;
  xpRequired: XP; // Общий XP для достижения этого уровня
  xpToNext: XP; // XP нужно до следующего уровня
  rewards: LevelReward[];
  title?: string; // "Новичок", "Профи", "Легенда"
  badge?: string; // ID бейджа
}

export interface LevelReward {
  type: "points" | "case" | "key" | "achievement" | "unlock";
  value: number | string;
  description: string;
}

// ============================================
// НАВЫКИ (SKILL TREES)
// ============================================

export enum SkillCategory {
  SOCIAL = "social", // Встречи, друзья
  ADVENTURE = "adventure", // Квесты
  ECONOMY = "economy", // Маркет, обмены
  CREATIVE = "creative", // Создание событий
  HELPER = "helper", // Help-квесты
  EXPLORER = "explorer", // Новые места
}

export interface SkillProgress {
  category: SkillCategory;
  level: number; // 1-50
  xp: number;
  totalActions: number; // Всего действий в категории
}

// ============================================
// ДЕЙСТВИЯ И НАГРАДЫ
// ============================================

export enum ActionType {
  // Квесты
  QUEST_START = "quest_start",
  QUEST_COMPLETE = "quest_complete",
  QUEST_COMPLETE_RARE = "quest_complete_rare",
  QUEST_COMPLETE_EPIC = "quest_complete_epic",
  QUEST_COMPLETE_LEGENDARY = "quest_complete_legendary",

  // Встречи
  MEET_CREATE = "meet_create",
  MEET_JOIN = "meet_join",
  MEET_COMPLETE = "meet_complete",
  MEET_RATED_HIGH = "meet_rated_high", // 4-5 звёзд

  // Социальное
  FRIEND_ADD = "friend_add",
  PROFILE_VIEW = "profile_view",
  PROFILE_SAVE = "profile_save",
  SUBSCRIBE = "subscribe",

  // Экономика
  CASE_BUY = "case_buy",
  CASE_OPEN = "case_open",
  EVENT_BUY = "event_buy",
  MARKET_SELL = "market_sell",
  MARKET_BUY = "market_buy",
  TRADE_COMPLETE = "trade_complete",

  // Креативность
  EVENT_CREATE = "event_create",
  MEET_ORGANIZE = "meet_organize",

  // Помощь
  HELP_QUEST_COMPLETE = "help_quest_complete",
  REFERRAL_JOINED = "referral_joined",

  // Исследование
  NEW_LOCATION_VISIT = "new_location_visit",
  DAILY_CHECKIN = "daily_checkin",
}

export interface XPReward {
  baseXP: number;
  skillCategory: SkillCategory;
  multipliers?: XPMultiplier[];
}

export interface XPMultiplier {
  type: "streak" | "rarity" | "vip" | "friend_bonus" | "first_time" | "achievement";
  value: number; // 1.5 = +50%
  description: string;
}

// ============================================
// РЕЗУЛЬТАТЫ НАЧИСЛЕНИЯ
// ============================================

export interface XPGainResult {
  totalXP: number;
  baseXP: number;
  multipliers: XPMultiplier[];
  skillGain: {
    category: SkillCategory;
    xp: number;
    leveledUp: boolean;
    newLevel?: number;
  };
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  rewards: LevelReward[];
}

// ============================================
// ДОСТИЖЕНИЯ
// ============================================

export enum AchievementCategory {
  QUESTS = "quests",
  SOCIAL = "social",
  ECONOMY = "economy",
  EXPLORER = "explorer",
  SPECIAL = "special",
}

export interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;

  // Условие получения
  condition: {
    type: "action_count" | "level_reached" | "skill_level" | "custom";
    actionType?: ActionType;
    count?: number;
    level?: number;
    skillCategory?: SkillCategory;
    customCheck?: string; // ID кастомной проверки
  };

  // Прогресс для пользователя
  progress?: {
    current: number;
    required: number;
    unlocked: boolean;
    unlockedAt?: Date;
  };
}

// ============================================
// КОНФИГИ
// ============================================

export interface ProgressionConfig {
  // Базовые настройки
  maxLevel: number;
  baseXPMultiplier: number; // Базовый множитель для расчёта XP

  // Множители
  streakMultiplier: number; // +10% за каждый день streak
  vipMultiplier: number; // +25% для VIP
  friendBonusMultiplier: number; // +20% если с другом

  // Навыки
  skillMaxLevel: number; // Максимальный уровень навыка
  skillLevelXPBase: number; // Базовый XP для уровня навыка

  // Награды
  pointsPerLevel: number; // Базовые поинты за уровень
}

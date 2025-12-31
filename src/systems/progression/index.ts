/**
 * Система прогрессии POINT
 *
 * Модульная система уровней, навыков и достижений
 *
 * @example
 * ```ts
 * import { giveXP, ActionType } from "~/systems/progression";
 *
 * // Начислить XP за завершение квеста
 * const result = await giveXP({
 *   userId: 123,
 *   actionType: ActionType.QUEST_COMPLETE,
 *   isWithFriend: true,
 *   isFirstTime: false,
 * });
 *
 * if (result.leveledUp) {
 *   console.log(`Level up! ${result.oldLevel} → ${result.newLevel}`);
 *   console.log("Rewards:", result.rewards);
 * }
 * ```
 */

// Экспорт типов
export * from "./types";

// Экспорт конфигов
export {
  PROGRESSION_CONFIG,
  LEVEL_CONFIGS,
  XP_REWARDS,
  ACHIEVEMENTS,
} from "./config";

// Экспорт основных функций
export {
  giveXP,
  getLevelConfig,
  calculateLevelFromXP,
  getLevelProgress,
  checkAchievements,
  getUserSkills,
  getUserAchievements,
  getUserProgressStats,
} from "./engine";

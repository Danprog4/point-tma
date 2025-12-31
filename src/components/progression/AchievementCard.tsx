/**
 * Компонент карточки достижения
 */

import { motion } from "framer-motion";
import { Achievement } from "~/systems/progression/client";

interface AchievementCardProps {
  achievement: Achievement;
}

const rarityColors = {
  common: "from-gray-400 to-gray-500",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-500 to-pink-600",
  legendary: "from-yellow-400 to-orange-500",
};

const rarityLabels = {
  common: "Обычное",
  rare: "Редкое",
  epic: "Эпическое",
  legendary: "Легендарное",
};

export const AchievementCard = ({ achievement }: AchievementCardProps) => {
  const isUnlocked = achievement.progress?.unlocked ?? false;
  const progress = achievement.progress?.current ?? 0;
  const required = achievement.progress?.required ?? 1;
  const progressPercent = Math.min(100, (progress / required) * 100);

  return (
    <motion.div
      className={`relative bg-white rounded-xl p-4 shadow-md border-2 overflow-hidden ${
        isUnlocked ? "border-green-400" : "border-gray-200"
      }`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: isUnlocked ? 1.03 : 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {/* Фон градиент для редкости */}
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
          rarityColors[achievement.rarity]
        }`}
      />

      {/* Статус разблокировки */}
      {isUnlocked && (
        <div className="absolute top-2 right-2">
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <span>✓</span>
            <span>Получено</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 mt-1">
        <div
          className={`w-16 h-16 rounded-xl flex items-center justify-center text-4xl shadow-md bg-gradient-to-br ${
            rarityColors[achievement.rarity]
          } ${!isUnlocked && "grayscale opacity-50"}`}
        >
          {achievement.icon}
        </div>

        <div className="flex-1">
          <div className="mb-1">
            <h3 className={`font-bold ${isUnlocked ? "text-gray-800" : "text-gray-500"}`}>
              {achievement.name}
            </h3>
            <p className="text-xs text-gray-500">{achievement.description}</p>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${
                rarityColors[achievement.rarity]
              } text-white font-semibold`}
            >
              {rarityLabels[achievement.rarity]}
            </span>
            <span className="text-xs text-gray-600">+{achievement.xpReward} XP</span>
          </div>

          {/* Прогресс для незавершённых достижений */}
          {!isUnlocked &&
            achievement.condition.type === "action_count" &&
            achievement.condition.count && (
              <div className="space-y-1">
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute top-0 left-0 h-full bg-gradient-to-r ${
                      rarityColors[achievement.rarity]
                    } rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <div className="text-xs text-gray-600">
                  Прогресс: {progress} / {required}
                </div>
              </div>
            )}

          {/* Дата получения */}
          {isUnlocked && achievement.progress?.unlockedAt && (
            <div className="text-xs text-gray-500 mt-1">
              Получено:{" "}
              {new Date(achievement.progress.unlockedAt).toLocaleDateString("ru-RU")}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

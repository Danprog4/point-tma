/**
 * Компонент прогресс-бара уровня
 */

import { motion } from "framer-motion";

interface LevelProgressBarProps {
  currentXP: number;
  requiredXP: number;
  level: number;
  title?: string;
}

export const LevelProgressBar = ({
  currentXP,
  requiredXP,
  level,
  title,
}: LevelProgressBarProps) => {
  const progress = Math.min(100, (currentXP / requiredXP) * 100);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">Уровень {level}</span>
          {title && <span className="text-sm text-gray-500">• {title}</span>}
        </div>
        <span className="text-sm text-gray-600">
          {currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP
        </span>
      </div>

      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-white drop-shadow-md">
            {progress.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

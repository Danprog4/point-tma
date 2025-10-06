import { AnimatePresence, motion } from "framer-motion";
import { Crown, Sparkles, Star, Trophy, X, Zap } from "lucide-react";
import { useEffect } from "react";
import { levelsConfig } from "~/config/levels";

interface LevelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel?: number;
  currentXp?: number;
}

export function LevelInfoModal({
  isOpen,
  onClose,
  currentLevel = 1,
  currentXp = 0,
}: LevelInfoModalProps) {
  // Блокировка скролла при открытии модалки
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const getLevelBenefits = (level: number) => {
    const benefits: Record<number, string[]> = {
      1: ["Доступ к базовым квестам", "Участие во встречах", "Создание профиля"],
      2: ["Создание собственных встреч", "Приглашение друзей", "+5% к наградам"],
      3: [
        "Доступ к эксклюзивным квестам",
        "Возможность создавать группы",
        "+10% к наградам",
      ],
      4: [
        "Статус VIP участника",
        "Приоритет в рейтинге",
        "+15% к наградам",
        "Спецпредметы",
      ],
      5: [
        "Создание премиум встреч",
        "Уникальный значок",
        "+20% к наградам",
        "Редкие предметы",
      ],
      6: [
        "Доступ к закрытым мероприятиям",
        "Модерация сообщества",
        "+25% к наградам",
        "Легендарные предметы",
      ],
      7: ["Статус легенды", "Все привилегии", "+30% к наградам", "Эксклюзивные награды"],
    };

    return benefits[level] || benefits[1];
  };

  const getLevelIcon = (level: number) => {
    if (level >= 7) return <Crown className="h-6 w-6" />;
    if (level >= 5) return <Trophy className="h-6 w-6" />;
    if (level >= 3) return <Sparkles className="h-6 w-6" />;
    return <Star className="h-6 w-6" />;
  };

  const getLevelColor = (level: number) => {
    if (level >= 7) return "from-yellow-400 to-orange-500";
    if (level >= 5) return "from-purple-500 to-pink-500";
    if (level >= 3) return "from-blue-500 to-cyan-500";
    return "from-green-400 to-emerald-500";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Затемненный фон */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Модальное окно */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300,
              }}
              className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Кнопка закрытия */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Заголовок с градиентом */}
              <div
                className={`rounded-t-3xl bg-gradient-to-r ${getLevelColor(currentLevel)} p-6 text-white`}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="flex items-center justify-center"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/30">
                      <span className="text-3xl font-bold">{currentLevel}</span>
                    </div>
                  </div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 text-center text-2xl font-bold"
                >
                  Уровень {currentLevel}
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-2 text-center text-sm opacity-90"
                >
                  {currentXp} / {levelsConfig[currentLevel - 1]?.xpToNextLevel || 0} XP
                </motion.div>

                {/* Прогресс бар */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(currentXp / (levelsConfig[currentLevel - 1]?.xpToNextLevel || 1)) * 100}%`,
                    }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="h-full rounded-full bg-white"
                  />
                </motion.div>
              </div>

              {/* Контент */}
              <div className="max-h-[50vh] overflow-y-auto p-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
                    <Zap className="h-5 w-5 text-purple-600" />
                    Преимущества уровня
                  </h3>

                  <div className="space-y-2">
                    {getLevelBenefits(currentLevel).map((benefit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 p-3"
                      >
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-white">
                          <span className="text-xs">✓</span>
                        </div>
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Информация о следующем уровне */}
                {currentLevel < levelsConfig.length && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mt-6 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 p-4"
                  >
                    <h4 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                      {getLevelIcon(currentLevel + 1)}
                      Следующий уровень
                    </h4>
                    <p className="text-sm text-gray-600">
                      До уровня {currentLevel + 1} осталось:{" "}
                      <span className="font-bold text-purple-600">
                        {(levelsConfig[currentLevel - 1]?.xpToNextLevel || 0) - currentXp}{" "}
                        XP
                      </span>
                    </p>
                    <div className="mt-3 text-xs text-gray-500">
                      💡 Участвуйте в квестах и встречах, чтобы получить опыт!
                    </div>
                  </motion.div>
                )}

                {/* Все уровни
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6"
                >
                  <h4 className="mb-3 font-semibold text-gray-900">Все уровни</h4>
                  <div className="grid grid-cols-7 gap-2">
                    {levelsConfig.map((config) => (
                      <motion.div
                        key={config.level}
                        whileHover={{ scale: 1.1 }}
                        className={`flex aspect-square items-center justify-center rounded-lg text-sm font-bold transition-all ${
                          config.level === currentLevel
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                            : config.level < currentLevel
                              ? "bg-gray-200 text-gray-600"
                              : "border-2 border-gray-200 text-gray-400"
                        }`}
                      >
                        {config.level}
                      </motion.div>
                    ))}
                  </div>
                </motion.div> */}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

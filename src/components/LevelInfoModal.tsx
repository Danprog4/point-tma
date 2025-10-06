import { AnimatePresence, motion } from "framer-motion";
import { Crown, HelpCircle, Sparkles, Star, Trophy, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [showDetails, setShowDetails] = useState(false);

  // Блокировка скролла при открытии модалки
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
      // Сбрасываем состояние при закрытии
      setShowDetails(false);
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
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
            style={{ touchAction: "none" }}
          />

          {/* Модальное окно */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center overflow-hidden p-4">
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
              {/* Кнопки управления */}
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-purple-600 shadow-md transition-all hover:bg-purple-600 hover:text-white"
                  title="Подробнее о системе уровней"
                >
                  <HelpCircle
                    className={`h-5 w-5 ${showDetails ? "text-purple-600" : "text-gray-600"}`}
                  />
                </button>
              </div>

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
              <div className="scrollbar-hidden h-[50vh] overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  {!showDetails ? (
                    <motion.div
                      key="benefits"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
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
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 p-3"
                          >
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-white">
                              <span className="text-xs">✓</span>
                            </div>
                            <span className="text-sm text-gray-700">{benefit}</span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Информация о следующем уровне */}
                      {currentLevel < levelsConfig.length && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="mt-6 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 p-4"
                        >
                          <h4 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                            {getLevelIcon(currentLevel + 1)}
                            Следующий уровень
                          </h4>
                          <p className="text-sm text-gray-600">
                            До уровня {currentLevel + 1} осталось:{" "}
                            <span className="font-bold text-purple-600">
                              {(levelsConfig[currentLevel - 1]?.xpToNextLevel || 0) -
                                currentXp}{" "}
                              XP
                            </span>
                          </p>
                          <div className="mt-3 text-xs text-gray-500">
                            💡 Участвуйте в квестах и встречах, чтобы получить опыт!
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                        <Star className="h-5 w-5 text-yellow-500" />
                        Система уровней
                      </h3>

                      <div className="space-y-4">
                        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 p-4">
                          <h4 className="mb-2 font-semibold text-gray-900">
                            Как работает прокачка?
                          </h4>
                          <p className="text-sm leading-relaxed text-gray-700">
                            Каждый уровень открывает доступ к{" "}
                            <span className="font-semibold text-purple-600">
                              большему количеству событий
                            </span>
                            , квестов и встреч. Чем выше ваш уровень, тем больше
                            возможностей для участия в интересных активностях!
                          </p>
                        </div>

                        <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                          <h4 className="mb-2 font-semibold text-gray-900">
                            Как получать опыт (XP)?
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                              <span className="mt-0.5 text-green-600">•</span>
                              <span>Участие в квестах и событиях</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="mt-0.5 text-green-600">•</span>
                              <span>Организация собственных встреч</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="mt-0.5 text-green-600">•</span>
                              <span>Выполнение заданий и достижений</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="mt-0.5 text-green-600">•</span>
                              <span>Активное общение и помощь сообществу</span>
                            </li>
                          </ul>
                        </div>

                        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
                          <h4 className="mb-2 font-semibold text-gray-900">
                            Преимущества роста
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                              <span className="mt-0.5">🎯</span>
                              <span>Доступ к эксклюзивным событиям</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="mt-0.5">🎁</span>
                              <span>Увеличенные награды и бонусы</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="mt-0.5">👑</span>
                              <span>Уникальные значки и статусы</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="mt-0.5">🔓</span>
                              <span>Разблокировка новых функций</span>
                            </li>
                          </ul>
                        </div>

                        <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-4">
                          <p className="text-center text-sm font-medium text-purple-900">
                            💜 Продолжайте развиваться и открывайте новые горизонты!
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Gift,
  Info,
  Share2,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface ReferralCardProps {
  referralsCount: number;
  completedTasksCount: number;
  copiedLink: boolean;
  onShare: () => void;
  onCopyLink: () => void;
  onScrollToInfo: () => void;
}

export function ReferralCard({
  referralsCount,
  completedTasksCount,
  copiedLink,
  onShare,
  onCopyLink,
  onScrollToInfo,
}: ReferralCardProps) {
  const [showStats, setShowStats] = useState(false);

  return (
    <div className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-6 shadow-xl">
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

      <div className="relative z-10">
        <div className="mb-6 flex gap-2 rounded-2xl bg-white/10 p-1 backdrop-blur-sm">
          <button
            onClick={() => setShowStats(false)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              !showStats
                ? "bg-white text-purple-600 shadow-lg"
                : "text-white/90 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              Приглашения
            </div>
          </button>
          <button
            onClick={() => setShowStats(true)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              showStats
                ? "bg-white text-purple-600 shadow-lg"
                : "text-white/90 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-4 w-4" />
              Статистика
            </div>
          </button>
        </div>

        <div className="relative h-fit">
          <AnimatePresence mode="wait" initial={false}>
            {!showStats ? (
              <motion.div
                key="referral"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">
                    Приглашай и зарабатывай
                  </span>

                  <div className="flex aspect-square w-5 items-center justify-center rounded-full text-xs text-white">
                    <button onClick={onScrollToInfo}>
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h2 className="mb-2 text-2xl font-bold text-white">Пригласи друзей</h2>
                <p className="mb-6 text-sm text-white/90">
                  За каждого приглашенного друга получай бонусы!
                </p>

                <div className="mb-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                    <div className="mb-1 flex items-center gap-1">
                      <Zap className="h-4 w-4 text-yellow-300" />
                      <span className="text-2xl font-bold text-white">10 XP</span>
                    </div>
                    <span className="text-xs text-white/80">За каждого друга</span>
                  </div>
                  <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                    <div className="mb-1 flex items-center gap-1">
                      <Gift className="h-4 w-4 text-yellow-300" />
                      <span className="text-2xl font-bold text-white">100</span>
                    </div>
                    <span className="text-xs text-white/80">Поинтов</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={onShare}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 font-semibold text-purple-600 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Share2 className="h-5 w-5" />
                    Пригласить друга
                  </button>

                  <button
                    onClick={onCopyLink}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/30 bg-white/10 px-6 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        Скопировано!
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        Скопировать ссылку
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="stats"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -50, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/90">
                    Твои достижения
                  </span>
                </div>

                <h2 className="mb-2 text-2xl font-bold text-white">Моя статистика</h2>
                <p className="mb-6 text-sm text-white/90">
                  Отслеживай свои успехи и прогресс в приложении
                </p>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-white/80">Приглашено друзей</span>
                      <Users className="h-4 w-4 text-white/60" />
                    </div>
                    <div className="text-3xl font-bold text-white">{referralsCount}</div>
                  </div>

                  <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-white/80">Выполнено заданий</span>
                      <CheckCircle2 className="h-4 w-4 text-white/60" />
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {completedTasksCount}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                      <div className="mb-1 flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-yellow-300" />
                        <span className="text-2xl font-bold text-white">
                          {referralsCount * 10}
                        </span>
                      </div>
                      <span className="text-xs text-white/80">Получено XP</span>
                    </div>
                    <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                      <div className="mb-1 flex items-center gap-1">
                        <Gift className="h-4 w-4 text-yellow-300" />
                        <span className="text-2xl font-bold text-white">
                          {referralsCount * 100}
                        </span>
                      </div>
                      <span className="text-xs text-white/80">Получено поинтов</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

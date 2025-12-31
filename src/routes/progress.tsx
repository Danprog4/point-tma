/**
 * Страница прогресса пользователя
 */

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Crown, Loader2, Trophy, Zap } from "lucide-react";
import { useState } from "react";
import { Header } from "~/components/Header";
import { AchievementCard } from "~/components/progression/AchievementCard";
import { LevelProgressBar } from "~/components/progression/LevelProgressBar";
import { SkillCard } from "~/components/progression/SkillCard";
import { usePlatform } from "~/hooks/usePlatform";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/progress")({
  component: ProgressPage,
});

type TabType = "overview" | "skills" | "achievements";

function ProgressPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const trpc = useTRPC();
  const isMobile = usePlatform();
  const { data: progress, isLoading } = useQuery(
    trpc.progression.getMyProgress.queryOptions(),
  );

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Обзор", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "skills", label: "Навыки", icon: <Zap className="h-4 w-4" /> },
    { id: "achievements", label: "Достижения", icon: <Trophy className="h-4 w-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="text-center text-gray-500">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <BarChart3 className="h-10 w-10 text-gray-400" />
          </div>
          <div>Данные о прогрессе не найдены</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header />

      <div data-mobile={isMobile} className="px-4 pt-20 pb-24 data-[mobile=true]:pt-45">
        {/* Заголовок с кнопкой назад */}
        <div className="mb-4 flex items-center gap-3">
          <Link to="/profile" className="flex items-center justify-center">
            <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-white ring-1 ring-gray-200 transition-all hover:bg-gray-50">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Мой Прогресс</h1>
            <p className="text-sm text-gray-500">Уровни, навыки и достижения</p>
          </div>
        </div>

        {/* Табы */}
        <div className="scrollbar-hidden -mx-4 mb-4 overflow-x-auto px-4">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "bg-gray-900 text-white shadow-lg"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50",
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Контент */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Уровень */}
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Ваш Уровень</h2>
              <LevelProgressBar
                currentXP={progress.level.xp.current}
                requiredXP={progress.level.xp.required}
                level={progress.level.current}
                title={progress.level.title}
              />

              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="mb-2 text-sm text-gray-600">
                  Награды за следующий уровень:
                </div>
                <div className="space-y-1">
                  {progress.level.nextRewards.map((reward, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <span className="text-gray-400">•</span>
                      <span>{reward.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Общая статистика */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {progress.skills.filter((s) => s.level > 0 || s.xp > 0).length}
                </div>
                <div className="text-xs text-gray-500">Навыков развито</div>
              </div>

              <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <Trophy className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {progress.achievements.unlocked}
                </div>
                <div className="text-xs text-gray-500">Достижений получено</div>
              </div>

              <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {progress.level.xp.total.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">Всего XP</div>
              </div>

              <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                  <Crown className="h-5 w-5 text-orange-600" />
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {progress.level.title}
                </div>
                <div className="text-xs text-gray-500">Текущий титул</div>
              </div>
            </div>

            {/* Топ навыки */}
            {progress.skills.filter((s) => s.level > 0 || s.xp > 0).length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-bold text-gray-900">Лучшие Навыки</h2>
                <div className="space-y-3">
                  {progress.skills
                    .filter((s) => s.level > 0 || s.xp > 0)
                    .sort((a, b) => b.level - a.level)
                    .slice(0, 3)
                    .map((skill, index) => (
                      <SkillCard key={index} skill={skill} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "skills" && (
          <div className="space-y-3">
            <div className="mb-4 text-sm text-gray-500">
              Развивайте навыки, выполняя различные действия в приложении
            </div>

            {progress.skills.filter((s) => s.level > 0 || s.xp > 0).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                  <Zap className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">Пока нет навыков</h3>
                <p className="text-sm text-gray-500">
                  Начните выполнять квесты и встречи!
                </p>
              </div>
            ) : (
              progress.skills
                .filter((s) => s.level > 0 || s.xp > 0)
                .map((skill, index) => (
                  <SkillCard key={index} skill={skill} />
                ))
            )}
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="space-y-3">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {progress.achievements.unlocked} из {progress.achievements.total} получено
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {(
                  (progress.achievements.unlocked / progress.achievements.total) *
                  100
                ).toFixed(0)}
                %
              </div>
            </div>

            {progress.achievements.list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                  <Trophy className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">
                  Пока нет достижений
                </h3>
                <p className="text-sm text-gray-500">
                  Выполняйте действия, чтобы получить награды!
                </p>
              </div>
            ) : (
              progress.achievements.list.map((achievement, index) => (
                <AchievementCard key={index} achievement={achievement} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

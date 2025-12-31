/**
 * Страница лидерборда
 */

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Coins,
  Crown,
  Heart,
  Map,
  Medal,
  Palette,
  Target,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Header } from "~/components/Header";
import { usePlatform } from "~/hooks/usePlatform";
import { cn } from "~/lib/utils";
import { SkillCategory } from "~/systems/progression/client";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/leaderboard")({
  component: Leaderboard,
});

type TabType = "overall" | SkillCategory;

const skillIcons: Record<SkillCategory, React.ReactNode> = {
  [SkillCategory.SOCIAL]: <Users className="h-5 w-5" />,
  [SkillCategory.ADVENTURE]: <Target className="h-5 w-5" />,
  [SkillCategory.ECONOMY]: <Coins className="h-5 w-5" />,
  [SkillCategory.CREATIVE]: <Palette className="h-5 w-5" />,
  [SkillCategory.HELPER]: <Heart className="h-5 w-5" />,
  [SkillCategory.EXPLORER]: <Map className="h-5 w-5" />,
};

const skillInfo: Record<SkillCategory, { name: string; color: string }> = {
  [SkillCategory.SOCIAL]: {
    name: "Социальное",
    color: "from-pink-500 to-rose-500",
  },
  [SkillCategory.ADVENTURE]: {
    name: "Приключения",
    color: "from-orange-500 to-amber-500",
  },
  [SkillCategory.ECONOMY]: {
    name: "Экономика",
    color: "from-emerald-500 to-green-500",
  },
  [SkillCategory.CREATIVE]: {
    name: "Творчество",
    color: "from-purple-500 to-violet-500",
  },
  [SkillCategory.HELPER]: {
    name: "Помощь",
    color: "from-red-500 to-rose-500",
  },
  [SkillCategory.EXPLORER]: {
    name: "Исследование",
    color: "from-cyan-500 to-blue-500",
  },
};

function Leaderboard() {
  const [activeTab, setActiveTab] = useState<TabType>("overall");
  const [limit] = useState(50);
  const trpc = useTRPC();
  const isMobile = usePlatform();

  const { data: overallLeaderboard, isLoading: overallLoading } = useQuery({
    ...trpc.progression.getLeaderboard.queryOptions({ limit, offset: 0 }),
    enabled: activeTab === "overall",
  });

  const { data: skillLeaderboard, isLoading: skillLoading } = useQuery({
    ...trpc.progression.getSkillLeaderboard.queryOptions({
      skillCategory: activeTab as string,
      limit,
      offset: 0,
    }),
    enabled: activeTab !== "overall",
  });

  const isLoading = activeTab === "overall" ? overallLoading : skillLoading;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "overall", label: "Общий", icon: <Trophy className="h-4 w-4" /> },
    { id: SkillCategory.SOCIAL, label: "Соц.", icon: <Users className="h-4 w-4" /> },
    {
      id: SkillCategory.ADVENTURE,
      label: "Прикл.",
      icon: <Target className="h-4 w-4" />,
    },
    { id: SkillCategory.ECONOMY, label: "Экон.", icon: <Coins className="h-4 w-4" /> },
    { id: SkillCategory.CREATIVE, label: "Твор.", icon: <Palette className="h-4 w-4" /> },
    { id: SkillCategory.HELPER, label: "Помощь", icon: <Heart className="h-4 w-4" /> },
    { id: SkillCategory.EXPLORER, label: "Иссл.", icon: <Map className="h-4 w-4" /> },
  ];

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Trophy className="h-6 w-6 text-amber-600" />;
    return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1)
      return "bg-gradient-to-r from-yellow-50 to-amber-50 ring-2 ring-yellow-300";
    if (rank === 2)
      return "bg-gradient-to-r from-gray-50 to-slate-100 ring-2 ring-gray-300";
    if (rank === 3)
      return "bg-gradient-to-r from-orange-50 to-amber-50 ring-2 ring-amber-300";
    return "bg-white ring-1 ring-gray-100";
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Лидерборд</h1>
            <p className="text-sm text-gray-500">Лучшие участники сообщества</p>
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
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === "overall" ? (
              <>
                {overallLeaderboard?.map((entry) => (
                  <Link
                    key={entry.user.id}
                    to="/user-profile/$id"
                    params={{ id: String(entry.user.id) }}
                    className="block"
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-2xl p-4 transition-all active:scale-[0.98]",
                        getRankBg(entry.rank),
                      )}
                    >
                      {/* Ранк */}
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                        {getRankDisplay(entry.rank)}
                      </div>

                      {/* Аватар */}
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                        {entry.user.photoUrl ? (
                          <img
                            src={entry.user.photoUrl}
                            alt={entry.user.name || "User"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        {entry.rank <= 3 && (
                          <div
                            className={cn(
                              "absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full shadow",
                              entry.rank === 1
                                ? "bg-yellow-400"
                                : entry.rank === 2
                                  ? "bg-gray-300"
                                  : "bg-amber-600",
                            )}
                          >
                            {entry.rank === 1 ? (
                              <Crown className="h-3 w-3 text-yellow-800" />
                            ) : entry.rank === 2 ? (
                              <Medal className="h-3 w-3 text-gray-600" />
                            ) : (
                              <Trophy className="h-3 w-3 text-amber-100" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Инфо */}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-gray-900">
                          {entry.user.name} {entry.user.surname}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5">
                            Ур. {entry.user.level}
                          </span>
                          <span className="truncate">{entry.levelConfig.title}</span>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {entry.user.xp?.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">XP</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            ) : (
              <>
                {/* Заголовок навыка */}
                <div
                  className={cn(
                    "mb-3 flex items-center gap-3 rounded-2xl bg-gradient-to-r p-4 text-white",
                    skillInfo[activeTab as SkillCategory]?.color ||
                      "from-gray-500 to-gray-600",
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    {skillIcons[activeTab as SkillCategory]}
                  </div>
                  <div>
                    <div className="font-bold">
                      {skillInfo[activeTab as SkillCategory]?.name}
                    </div>
                    <div className="text-sm opacity-80">Топ участников</div>
                  </div>
                </div>

                {skillLeaderboard?.map((entry) => (
                  <Link
                    key={entry.user.id}
                    to="/user-profile/$id"
                    params={{ id: String(entry.user.id) }}
                    className="block"
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-2xl p-4 transition-all active:scale-[0.98]",
                        getRankBg(entry.rank),
                      )}
                    >
                      {/* Ранк */}
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                        {getRankDisplay(entry.rank)}
                      </div>

                      {/* Аватар */}
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                        {entry.user.photoUrl ? (
                          <img
                            src={entry.user.photoUrl}
                            alt={entry.user.name || "User"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        {entry.rank <= 3 && (
                          <div
                            className={cn(
                              "absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full shadow",
                              entry.rank === 1
                                ? "bg-yellow-400"
                                : entry.rank === 2
                                  ? "bg-gray-300"
                                  : "bg-amber-600",
                            )}
                          >
                            {entry.rank === 1 ? (
                              <Crown className="h-3 w-3 text-yellow-800" />
                            ) : entry.rank === 2 ? (
                              <Medal className="h-3 w-3 text-gray-600" />
                            ) : (
                              <Trophy className="h-3 w-3 text-amber-100" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Инфо */}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-gray-900">
                          {entry.user.name} {entry.user.surname}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5">
                            Навык Ур. {entry.skill.level}
                          </span>
                          <span>{entry.skill.totalActions} действий</span>
                        </div>
                      </div>

                      {/* XP */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {entry.skill.xp.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">XP</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            )}

            {/* Пустое состояние */}
            {((activeTab === "overall" && overallLeaderboard?.length === 0) ||
              (activeTab !== "overall" && skillLeaderboard?.length === 0)) && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                  <Trophy className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">Пока пусто</h3>
                <p className="text-sm text-gray-500">Станьте первым в рейтинге!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

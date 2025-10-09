import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { achievementTypes, availableAchievements } from "~/config/achievments";
import { usePlatform } from "~/hooks/usePlatform";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/achievments")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Все");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("По редкости");
  const filters = ["Все", "Достигнуто", "Не достигнутые"];
  const sortOptions = ["По редкости", "По алфавиту", "По прогрессу", "По дате получения"];

  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  const getUserAchievementProgress = (achievementTitle: string) => {
    if (!user?.achievements || user.achievements.length === 0) {
      return { progress: 0, total: 10, completed: false };
    }

    // Проверяем, есть ли достижение в массиве (как строка)
    const hasAchievement = user.achievements.includes(achievementTitle as any);

    if (hasAchievement) {
      return { progress: 10, total: 10, completed: true };
    }

    // Проверяем, если достижение в формате объекта { "название": прогресс }
    for (const achObj of user.achievements) {
      if (
        typeof achObj === "object" &&
        achObj !== null &&
        achObj[achievementTitle] !== undefined
      ) {
        const progress = achObj[achievementTitle];
        return {
          progress,
          total: 10,
          completed: progress >= 10,
        };
      }
    }

    return { progress: 0, total: 10, completed: false };
  };

  const achievements = availableAchievements.map((ach, index) => {
    const userProgress = getUserAchievementProgress(ach.title);
    return {
      id: index + 1,
      ...ach,
      ...userProgress,
    };
  });

  const filteredAchievements = achievements.filter((achievement) => {
    if (activeFilter === "Достигнуто") return achievement.completed;
    if (activeFilter === "Не достигнутые") return !achievement.completed;
    return true;
  });

  // Sort achievements based on selected sort option
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    // Всегда сначала показываем завершенные достижения
    if (a.completed !== b.completed) {
      return b.completed ? 1 : -1;
    }

    // Затем сортируем по выбранному критерию
    switch (selectedSort) {
      case "По редкости": {
        // Define rarity order (epic > legend > rare > pro > default)
        const rarityOrder = { epic: 5, legend: 4, rare: 3, pro: 2, default: 1 };
        return rarityOrder[b.type] - rarityOrder[a.type];
      }
      case "По алфавиту": {
        return a.title.localeCompare(b.title, "ru");
      }
      case "По прогрессу": {
        const aProgress = (a.progress / a.total) * 100;
        const bProgress = (b.progress / b.total) * 100;
        return bProgress - aProgress;
      }
      case "По дате получения": {
        return b.id - a.id;
      }
      default:
        return 0;
    }
  });

  const getRarityText = (type: keyof typeof achievementTypes) => {
    switch (type) {
      case "default":
        return "Обычное";
      case "pro":
        return "Продвинутое";
      case "rare":
        return "Редкое";
      case "legend":
        return "Легендарное";
      case "epic":
        return "Эпическое";
      default:
        return "Обычное";
    }
  };

  const handleSortSelect = (option: string) => {
    setSelectedSort(option);
    setSortDropdownOpen(false);
  };

  const isMobile = usePlatform();
  return (
    <div
      data-mobile={isMobile}
      className="mx-auto min-h-screen w-full max-w-sm bg-white pb-24 data-[mobile=true]:pt-42"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex items-center justify-center">
          <div className="flex-1">
            <h1 className="text-center text-base font-bold text-gray-800">Достижения</h1>
          </div>
        </div>
        <div className="flex items-center justify-center p-4 pb-2"></div>
      </div>

      {/* Filter Tabs */}
      <div className="pb-2">
        <div className="scrollbar-hidden flex w-full flex-1 items-center gap-6 overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter
                  ? "bg-black text-white"
                  : "border-gray-200 bg-white text-black"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="relative flex items-center justify-center gap-1 px-4 pb-4">
        <button
          onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          className="flex items-center gap-1 transition-colors hover:text-gray-700"
        >
          <span className="text-sm text-gray-500">
            Сортировка {selectedSort.toLowerCase()}
          </span>
          <ChevronDown
            className={`h-5 w-5 text-gray-500 transition-transform ${
              sortDropdownOpen ? "rotate-180" : ""
            }`}
            strokeWidth={2}
          />
        </button>

        {/* Dropdown Menu */}
        {sortDropdownOpen && (
          <div className="absolute top-full left-1/2 z-10 mt-1 w-48 -translate-x-1/2 transform rounded-lg border border-gray-200 bg-white shadow-lg">
            {sortOptions.map((option) => (
              <button
                key={option}
                onClick={() => handleSortSelect(option)}
                className={`w-full px-4 py-3 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50 ${
                  selectedSort === option
                    ? "bg-gray-100 font-medium text-gray-800"
                    : "text-gray-600"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Achievement Cards */}
        {sortedAchievements.map((achievement) => {
          const typeStyle = achievementTypes[achievement.type];
          const progressPercentage = (achievement.progress / achievement.total) * 100;

          return (
            <div
              key={achievement.id}
              className={`relative rounded-2xl border ${achievement.completed ? "border-purple-500" : typeStyle.borderColor} ${typeStyle.bgColor} p-4 shadow-sm ${
                !achievement.completed ? "opacity-75" : ""
              }`}
            >
              {/* Gradient borders for legend and epic - only for completed achievements */}
              {typeStyle.hasGradientBorder && achievement.completed && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 p-[2px]">
                  <div className={`rounded-2xl ${typeStyle.bgColor} h-full w-full`}></div>
                </div>
              )}

              <div className="relative flex items-center gap-4">
                {/* Achievement Icon */}
                <div className="relative">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl ${
                      !achievement.completed ? "opacity-50" : ""
                    }`}
                  >
                    {achievement.image}
                  </div>
                  {/* Type indicator dot */}
                  <div
                    className={`absolute -right-1 -bottom-1 h-5 w-5 ${typeStyle.dotColor} rounded-full border-2 border-white`}
                  ></div>
                </div>

                {/* Achievement Info */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-col">
                    <h3 className="font-medium text-gray-800">{achievement.title}</h3>
                    <span
                      className={`text-xs ${typeStyle.textColor} w-fit rounded bg-white px-1`}
                    >
                      {getRarityText(achievement.type)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="h-3.5 w-full rounded-lg bg-gray-200">
                      <div
                        className="h-3.5 rounded-lg bg-purple-500 transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-5 w-5 text-gray-600" strokeWidth={2} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

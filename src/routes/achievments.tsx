import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { achievements, achievementTypes } from "~/config/achievments";
import { usePlatform } from "~/hooks/usePlatform";

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

  const filteredAchievements = achievements.filter((achievement) => {
    if (activeFilter === "Достигнуто") return achievement.completed;
    if (activeFilter === "Не достигнутые") return !achievement.completed;
    return true;
  });

  // Sort achievements based on selected sort option
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
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
        // Sort completed achievements first, then by ID (assuming newer achievements have higher IDs)
        if (a.completed !== b.completed) {
          return b.completed ? 1 : -1;
        }
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
      <div className="pb-4">
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
      <div className="relative flex items-center justify-center gap-1 px-4 py-2">
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
      {true ? (
        <div></div>
      ) : (
        <div className="space-y-4 px-4">
          {/* Level Indicator */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Main circle with gradient background */}
              <div className="relative flex h-18 w-18 items-center justify-center rounded-full border-2 border-purple-500 bg-gradient-to-br from-teal-300 to-teal-500">
                {/* Inner level circle */}
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-purple-600 border-t-green-400 border-r-green-400 bg-purple-500">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
              </div>
              {/* Level text */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 transform rounded bg-purple-500 px-2 py-1 text-xs font-bold text-white">
                Уровень
              </div>
            </div>
          </div>

          {/* Achievement Cards */}
          {sortedAchievements.map((achievement) => {
            const typeStyle = achievementTypes[achievement.type];
            const progressPercentage = (achievement.progress / achievement.total) * 100;

            return (
              <div
                key={achievement.id}
                className={`relative rounded-2xl border ${typeStyle.borderColor} ${typeStyle.bgColor} p-4 shadow-sm ${
                  !achievement.completed ? "opacity-75" : ""
                }`}
              >
                {/* Gradient borders for legend and epic */}
                {typeStyle.hasGradientBorder && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 p-[2px]">
                    <div
                      className={`rounded-2xl ${typeStyle.bgColor} h-full w-full`}
                    ></div>
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
                      <span className="absolute inset-0 flex items-center justify-start pl-2 text-xs font-medium text-white">
                        {achievement.progress} / {achievement.total}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-gray-600" strokeWidth={2} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

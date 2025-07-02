import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Settings } from "lucide-react";
import { useState } from "react";
import { Calendar } from "~/components/Calendar";
import FilterDrawer from "~/components/FilterDrawer";
import { Header } from "~/components/Header";
import { useScroll } from "~/components/hooks/useScroll";
import { WhiteFilter } from "~/components/Icons/WhiteFilter";
import { WhitePlusIcon } from "~/components/Icons/WhitePlus";
import { More } from "~/components/More";
import { QuestCard } from "~/components/QuestCard";
import { Selecter } from "~/components/Selecter";
import { questsData } from "~/config/quests";
export const Route = createFileRoute("/quests")({
  component: RouteComponent,
});

// Calendar dates data
const calendarDates = [
  { date: "19", day: "ВС", isWeekend: true },
  { date: "20", day: "ПН", isWeekend: false },
  { date: "21", day: "ВТ", isWeekend: false },
  { date: "22", day: "СР", isWeekend: false },
  { date: "23", day: "ЧТ", isWeekend: false },
  { date: "24", day: "ПТ", isWeekend: false },
  { date: "25", day: "СБ", isWeekend: true },
  { date: "12", day: "ВС", isWeekend: true },
  { date: "13", day: "ПН", isWeekend: false },
];

export function getCategoryColor(category: string) {
  switch (category) {
    case "Обучающий":
      return "bg-blue-500";
    case "Тематический":
      return "bg-yellow-400";
    case "Хелп-квест":
      return "bg-red-300";
    case "Саморазвитие":
      return "bg-purple-300";
    default:
      return "bg-gray-400";
  }
}

export function getTypeColor(type: string) {
  switch (type) {
    case "Глобальный":
      return "bg-black/25";
    case "Ежедневный":
      return "bg-black/10";
    default:
      return "bg-gray-400";
  }
}

const filters = ["Все", "Конференции", "Вечеринки", "Турниры"];

function RouteComponent() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Все");
  useScroll();

  return (
    <div className="min-h-screen overflow-y-auto bg-white pt-12 pb-20">
      <Header />

      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-black">Квесты</h1>
          <Selecter width="20px" height="20px" />
        </div>
        <Settings className="h-5 w-5 text-black" />
      </div>

      <div className="mb-4 flex items-center justify-center gap-6 px-4">
        <input
          type="text"
          placeholder="Поиск квестов"
          className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
        />

        <FilterDrawer open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-[#9924FF]">
            <WhiteFilter />
          </div>
        </FilterDrawer>
      </div>

      <Calendar />
      <div className="mb-4 flex w-full flex-1 items-center gap-6 overflow-x-auto px-4">
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
      {/* Quest Lists by Date */}
      <div className="space-y-4">
        {/* 19 декабря */}
        <div>
          <h3 className="px-4 pb-2 text-xs font-normal text-black">19 декабря</h3>
          <div className="px-4">
            <QuestCard quest={questsData[0]} isNavigable={true} />
            <p className="mb-4 text-xs leading-4 text-black">
              {questsData[0].description}
            </p>
            <div className="mb-6 flex items-center justify-between">
              {questsData[0].hasAchievement && (
                <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                  + Достижение
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-base font-medium text-black">
                  + {questsData[0].reward.toLocaleString()}
                </span>
                <span className="text-base font-medium text-black">points</span>
                <div className="h-2.5 w-2.5 rounded-full bg-orange-400"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 20 декабря */}
        <div>
          <h3 className="px-4 pb-2 text-xs font-normal text-black">20 декабря</h3>
          <div className="space-y-6 px-4">
            {/* Quest 2 */}
            <div>
              <QuestCard quest={questsData[1]} isNavigable={true} />
              <p className="mb-4 text-xs leading-4 text-black">
                {questsData[1].description}
              </p>
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-black">
                    + {questsData[1].reward.toLocaleString()}
                  </span>
                  <span className="text-base font-medium text-black">points</span>
                  <div className="h-2.5 w-2.5 rounded-full bg-orange-400"></div>
                </div>
              </div>
            </div>
            <div className="col-span-2 w-full">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Актуальные квесты</h2>
                <ArrowRight className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex gap-4 overflow-x-auto">
                {[
                  {
                    title: "Пост- новогодний вечер",
                    subtitle: "15 января • Мозайка",
                    tag: "🎄 Новый год",
                    price: "3 000 ₸",
                    bg: "bg-gradient-to-br from-red-400 to-pink-400",
                  },
                  {
                    title: "Гангстеры и розы",
                    subtitle: "21 января • Алькатрас",
                    tag: "💞 Клубы знакомств",
                    price: "3 000 ₸",
                    bg: "bg-gradient-to-br from-pink-400 to-purple-400",
                  },
                  {
                    title: "KazDrilling 2024",
                    subtitle: "Renaissance Hotel",
                    tag: "💃 Концерт",
                    price: "3 000 ₸",
                    bg: "bg-gradient-to-br from-green-400 to-blue-400",
                  },
                ].map((event, idx) => (
                  <div
                    key={idx}
                    className="h-[25vh] w-[40vw] flex-shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm"
                  >
                    <div className={`h-full w-full ${event.bg} relative`}>
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        <div>{event.tag}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Quest 3 */}
            <div>
              <QuestCard quest={questsData[2]} isNavigable={true} />
              <p className="mb-4 text-xs leading-4 text-black">
                {questsData[2].description}
              </p>
              <div className="flex items-center justify-between">
                {questsData[2].hasAchievement && (
                  <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                    + Достижение
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-base font-medium text-black">
                    + {questsData[2].reward.toLocaleString()}
                  </span>
                  <span className="text-base font-medium text-black">points</span>
                  <div className="h-2.5 w-2.5 rounded-full bg-orange-400"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 23 декабря */}
        <div>
          <h3 className="px-4 pb-2 text-xs font-normal text-black">23 декабря</h3>
          <div className="px-4">
            <QuestCard quest={questsData[3]} isNavigable={true} />
            <p className="mb-4 text-xs leading-4 text-black">
              {questsData[3].description}
            </p>
            <div className="mb-6 flex items-center justify-end">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-black">
                  + {questsData[3].reward.toLocaleString()}
                </span>
                <span className="text-base font-medium text-black">points</span>
                <div className="h-2.5 w-2.5 rounded-full bg-orange-400"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Quest Button */}

      <div className="fixed right-0 bottom-20 left-0 flex items-center gap-2 bg-white">
        <div className="mx-auto flex w-full items-center gap-2 px-4">
          <button
            onClick={() =>
              navigate({ to: "/createMeet/$name", params: { name: "Квест" } })
            }
            className="w-full rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
          >
            Создать квест
          </button>
          <div className="flex flex-col items-center">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
            >
              <WhitePlusIcon />
            </div>
            <span className="text-xs">Ещё</span>
          </div>
        </div>
      </div>
      {isMoreOpen && <More setIsMoreOpen={setIsMoreOpen} />}
    </div>
  );
}

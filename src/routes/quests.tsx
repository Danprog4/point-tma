import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, Settings } from "lucide-react";
import { useState } from "react";
import PullToRefresh from "react-simple-pull-to-refresh";
import { Calendar } from "~/components/Calendar";
import FilterDrawer from "~/components/FilterDrawer";
import GetUpButton from "~/components/getUpButton";
import { Header } from "~/components/Header";
import { useScrollRestoration } from "~/components/hooks/useScrollRes";
import { Coin } from "~/components/Icons/Coin";
import { WhiteFilter } from "~/components/Icons/WhiteFilter";
import { More } from "~/components/More";
import { QuestCard } from "~/components/QuestCard";
import { Selecter } from "~/components/Selecter";
import { usePlatform } from "~/hooks/usePlatform";
import { cn } from "~/lib/utils";
import { lockBodyScroll, unlockBodyScroll } from "~/lib/utils/drawerScroll";
import { useTRPC } from "~/trpc/init/react";

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

function RouteComponent() {
  useScrollRestoration("quests");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Все");
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const { data } = useQuery(trpc.event.getMyEvents.queryOptions());
  const { data: questsData } = useQuery(
    trpc.event.getEventsByCategory.queryOptions({ category: "Квест" }),
  );
  const { data: activeEvents } = useQuery(trpc.event.getMyEvents.queryOptions());

  console.log(activeFilter);

  const filteredEvents = activeEvents
    ?.filter((event) => event.type === "Квест")
    .filter((q) => !q.isCompleted);
  const userQuestsData = filteredEvents?.map((event) => {
    const quest = questsData?.find((q: any) => q.id === event.eventId);
    return quest
      ? {
          ...event,
          description: quest?.description,
          hasAchievement: quest?.hasAchievement,
          rewards: quest?.rewards,
          title: quest?.title,
          date: quest?.date,
          location: quest?.location,
          price: quest?.price,
          type: quest?.type,
          category: quest?.category,
          organizer: quest?.organizer,
          image: quest?.image,
        }
      : event;
  });

  const filters = [
    "Все",
    "Активные",
    ...Array.from(new Set(questsData?.map((quest) => quest.type).filter(Boolean) ?? [])),
  ];

  const isMobile = usePlatform();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.event.getEventsByCategory.queryKey({ category: "Квест" }),
    });
  };

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen bg-gray-50/50 pt-14 pb-30 data-[mobile=true]:pt-39"
    >
      <Header />
      <PullToRefresh onRefresh={handleRefresh} className={cn("min-h-screen")}>
        <div className="flex flex-col space-y-6">
          {/* Title */}
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Квесты</h1>
              <Selecter width="24px" height="24px" />
            </div>
            <button className="rounded-full p-2 transition-colors transition-transform hover:bg-gray-100 active:scale-90">
              <Settings className="h-6 w-6 text-gray-900" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Поиск квестов..."
                  className="h-12 w-full rounded-2xl border-none bg-white pr-4 pl-11 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 transition-all outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <FilterDrawer
                open={isOpen}
                onOpenChange={(open) => {
                  if (open) lockBodyScroll();
                  else unlockBodyScroll();
                  setIsOpen(open);
                }}
              >
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200 transition-transform hover:bg-violet-700 active:scale-95">
                  <WhiteFilter />
                </button>
              </FilterDrawer>
            </div>
          </div>

          {/* Calendar */}
          <div className="px-1">
            <Calendar />
          </div>

          {/* Filters */}
          <div className="scrollbar-hidden flex gap-2 overflow-x-auto px-5 pb-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter ?? "")}
                className={cn(
                  "rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-95",
                  activeFilter === filter
                    ? "bg-gray-900 text-white shadow-lg shadow-gray-200"
                    : "bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50",
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Content */}

          {/* Active Quests */}
          {/* {userQuestsData && userQuestsData.length > 0 && (
            <>
              <h2 className="px-5 text-lg font-bold text-gray-900">Активные квесты</h2>
              <div className="flex flex-col gap-4 px-5">
                {userQuestsData
                  .filter(
                    (quest) =>
                      (activeFilter === "Все") ||
                      quest.category === activeFilter,
                  )
                  .map((quest) => {
                    const questData = questsData?.find((q) => q.id === quest.eventId);
                    return (
                      <div
                        key={quest.id}
                        className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
                      >
                        <QuestCard quest={questData as any} isNavigable={true} />
                        <div className="border-t border-gray-50 px-4 pb-4">
                          <p className="mb-4 line-clamp-2 pt-3 text-sm leading-relaxed text-gray-600">
                            {questData?.description}
                          </p>

                          <div className="flex items-center justify-between">
                            {questData?.hasAchievement ? (
                              <span className="inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-violet-100 ring-inset">
                                🏆 Достижение
                              </span>
                            ) : (
                              <div />
                            )}
                            <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-900 ring-1 ring-gray-200 ring-inset">
                              <span>+</span>
                              <span>
                                {(
                                  questData?.rewards?.find(
                                    (reward) => reward.type === "point",
                                  )?.value ?? 0
                                ).toLocaleString()}
                              </span>
                              <span className="text-gray-500">points</span>
                              <Coin />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )} */}

          {/* Series Quests */}
          {/* {questsData?.some((q) => q.isSeries) && (
            <>
              {questsData
                .filter((quest) => quest.isSeries)
                .map((quest) => (
                  <div key={quest.id} className="px-1">
                    <SeriesQuestCard quest={quest as any} />
                  </div>
                ))}
            </>
          )} */}

          {/* All Quests List */}
          <div className="space-y-4 px-5">
            {questsData
              ?.filter((quest) => !quest.isSeries)
              .filter((quest) => {
                if (activeFilter === "Все") return true;
                if (activeFilter === "Активные") {
                  return userQuestsData?.some((uq) => uq.eventId === quest.id);
                }
                return quest.type === activeFilter;
              })
              .filter((quest) => {
                return (
                  quest.title?.toLowerCase().includes(search.toLowerCase()) ||
                  quest.description?.toLowerCase().includes(search.toLowerCase())
                );
              })
              .map((quest) => (
                <div key={quest.id} className="space-y-2">
                  <h3 className="px-1 text-xs font-medium tracking-wider text-gray-500 uppercase">
                    {quest.date}
                  </h3>
                  <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md">
                    <QuestCard quest={quest as any} isNavigable={true} />
                    <div className="border-t border-gray-50 px-4 pb-4">
                      <p className="mb-4 line-clamp-2 pt-3 text-sm leading-relaxed text-gray-600">
                        {quest.description}
                      </p>
                      <div className="flex items-center justify-between">
                        {quest.hasAchievement ? (
                          <span className="inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-violet-100 ring-inset">
                            🏆 Достижение
                          </span>
                        ) : (
                          <div />
                        )}
                        <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-900 ring-1 ring-gray-200 ring-inset">
                          <span>+</span>
                          <span>
                            {(
                              quest?.rewards?.find((reward) => reward.type === "point")
                                ?.value ?? 0
                            ).toLocaleString()}
                          </span>
                          <span className="text-gray-500">points</span>
                          <Coin />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {isMoreOpen && (
          <More
            setIsMoreOpen={setIsMoreOpen}
            handleSaveEventOrMeet={() => {}}
            handleGiveTicket={() => {}}
            handleInvite={() => {}}
          />
        )}

        <GetUpButton />
      </PullToRefresh>
    </div>
  );
}

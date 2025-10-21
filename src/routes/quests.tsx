import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
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
import { SeriesQuestCard } from "~/components/SeriesQuestCard";
import { usePlatform } from "~/hooks/usePlatform";
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

  const filters = [
    "Все",
    ...Array.from(
      new Set(
        questsData?.filter((quest) => !quest.isSeries).map((quest) => quest.type) ?? [],
      ),
    ),
  ];

  const filteredEvents = activeEvents
    ?.filter((event) => event.type === "Квест")
    .filter((q) => !q.isCompleted);
  const userQuestsData = filteredEvents?.map((event) => {
    const quest = questsData?.find((q) => q.id === event.eventId);
    return quest
      ? {
          ...event,
          description: quest?.description,
          hasAchievement: quest?.hasAchievement,
          reward: quest?.rewards?.find((reward) => reward.type === "point")?.value || 0,
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

  const isMobile = usePlatform();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.event.getEventsByCategory.queryKey({ category: "Квест" }),
    });
  };

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen overflow-y-auto bg-white pt-14 pb-30 data-[mobile=true]:pt-39"
    >
      <Header />
      <PullToRefresh onRefresh={handleRefresh} className="text-white">
        <motion.div
          className="flex items-center justify-between px-4 py-5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-black">Квесты</h1>
            <Selecter width="20px" height="20px" />
          </div>
          <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.3 }}>
            <Settings className="h-5 w-5 cursor-pointer text-black" />
          </motion.div>
        </motion.div>

        <motion.div
          className="mb-4 flex items-center justify-center gap-6 px-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Поиск квестов"
            className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black transition-all placeholder:text-black/50 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none"
          />

          <FilterDrawer
            open={isOpen}
            onOpenChange={(open) => {
              if (open) {
                lockBodyScroll();
              } else {
                unlockBodyScroll();
              }
              setIsOpen(open);
            }}
          >
            <motion.div
              className="flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-[#9924FF]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <WhiteFilter />
            </motion.div>
          </FilterDrawer>
        </motion.div>

        <Calendar />

        <div className="scrollbar-hidden mb-4 flex w-full flex-1 items-center gap-3 overflow-x-auto px-4">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter ?? "")}
              className={`rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap shadow-sm transition-all ${
                activeFilter === filter
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                  : "border border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {userQuestsData && userQuestsData.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-4 px-4 text-xl font-bold text-gray-900">
                Активные квесты
              </h2>
              <div className="space-y-3">
                {userQuestsData
                  .filter(
                    (quest) =>
                      (activeFilter === "Все" && questsData) ||
                      quest.type === activeFilter,
                  )
                  .map((quest) => {
                    const questData = questsData?.find((q) => q.id === quest.eventId);
                    return (
                      <div key={quest.id} className="px-4">
                        <div className="overflow-hidden rounded-2xl bg-white shadow-md">
                          <QuestCard quest={questData as any} isNavigable={true} />
                          <div className="border-t border-gray-100 px-3 pb-3">
                            <p className="mb-3 pt-3 text-xs leading-relaxed text-gray-700">
                              {questData?.description?.slice(0, 100)}
                              {questData?.description &&
                              questData.description.length > 100
                                ? "..."
                                : ""}
                            </p>

                            <div className="flex items-center justify-between">
                              {questData?.hasAchievement ? (
                                <span className="rounded-full bg-purple-300 px-3 py-1 text-xs font-medium text-gray-900 shadow-sm">
                                  🏆 Достижение
                                </span>
                              ) : (
                                <div />
                              )}
                              <div className="ml-auto flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-50 to-purple-100 px-3 py-1.5 shadow-sm">
                                <span className="text-sm font-semibold text-gray-900">
                                  +
                                  {(
                                    questData?.rewards?.find(
                                      (reward) => reward.type === "point",
                                    )?.value ?? 0
                                  ).toLocaleString()}
                                </span>
                                <span className="text-sm font-medium text-gray-600">
                                  points
                                </span>
                                <Coin />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="mb-6">
            {questsData
              ?.filter((quest) => quest.isSeries)
              .filter((quest) => quest.isSeries)

              .map((quest) => (
                <div key={quest.id}>
                  <SeriesQuestCard quest={quest as any} />
                </div>
              ))}
          </div>

          <div className="space-y-4">
            {questsData
              ?.filter((quest) => !quest.isSeries)
              .filter(
                (quest) =>
                  (activeFilter === "Все" && questsData) || quest.type === activeFilter,
              )
              .filter((quest) => {
                return (
                  quest.title?.toLowerCase().includes(search.toLowerCase()) ||
                  quest.description?.toLowerCase().includes(search.toLowerCase())
                );
              })
              .map((quest) => (
                <div key={quest.id}>
                  <h3 className="mb-2 px-4 text-xs font-medium text-gray-500">
                    {quest.date}
                  </h3>
                  <div className="px-4">
                    <div className="overflow-hidden rounded-2xl bg-white shadow-md">
                      <QuestCard quest={quest as any} isNavigable={true} />
                      <div className="border-t border-gray-100 px-3 pb-3">
                        <p className="mb-3 pt-3 text-xs leading-relaxed text-gray-700">
                          {quest.description?.slice(0, 100) +
                            (quest.description?.length && quest.description.length > 100
                              ? "..."
                              : "")}
                        </p>
                        <div className="flex items-center justify-between">
                          {quest.hasAchievement && (
                            <span className="rounded-full bg-purple-300 px-3 py-1 text-xs font-medium text-gray-900 shadow-sm">
                              🏆 Достижение
                            </span>
                          )}
                          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-50 to-purple-100 px-3 py-1.5 shadow-sm">
                            <span className="text-sm font-semibold text-gray-900">
                              +
                              {(
                                quest?.rewards?.find((reward) => reward.type === "point")
                                  ?.value ?? 0
                              ).toLocaleString()}
                            </span>
                            <span className="text-sm font-medium text-gray-600">
                              points
                            </span>
                            <Coin />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Create Quest Button */}

        {/* <div className="fixed right-0 bottom-20 left-0 flex items-center gap-2 bg-white">
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
      </div> */}

        {/* TODO: Add handleSaveEventorMeet */}
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

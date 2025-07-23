import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useState } from "react";
import { Calendar } from "~/components/Calendar";
import FilterDrawer from "~/components/FilterDrawer";
import { Header } from "~/components/Header";
import { useScroll } from "~/components/hooks/useScroll";
import { Coin } from "~/components/Icons/Coin";
import { WhiteFilter } from "~/components/Icons/WhiteFilter";
import { More } from "~/components/More";
import { QuestCard } from "~/components/QuestCard";
import { Selecter } from "~/components/Selecter";
import { SeriesQuestCard } from "~/components/SeriesQuestCard";
import { questsData } from "~/config/quests";
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

const filters = [
  "Все",
  ...Array.from(
    new Set(questsData.filter((quest) => !quest.isSeries).map((quest) => quest.type)),
  ),
];

function RouteComponent() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Все");
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const { data } = useQuery(trpc.event.getMyEvents.queryOptions());

  console.log(activeFilter);

  useScroll();

  const filteredEvents = data
    ?.filter((event) => event.type === "Квест")
    .filter((q) => !q.isCompleted);
  const userQuestsData = filteredEvents?.map((event) => {
    const quest = questsData.find((q) => q.id === event.eventId);
    return quest
      ? {
          ...event,
          description: quest.description,
          hasAchievement: quest.hasAchievement,
          reward: quest.rewards?.find((reward) => reward.type === "point")?.value || 0,
          title: quest.title,
          date: quest.date,
          location: quest.location,
          price: quest.price,
          type: quest.type,
          category: quest.category,
          organizer: quest.organizer,
          image: quest.image,
        }
      : event;
  });

  return (
    <div className="min-h-screen overflow-y-auto bg-white pt-14 pb-30">
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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          placeholder="Поиск квестов"
          className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
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
          <div className="flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-[#9924FF]">
            <WhiteFilter />
          </div>
        </FilterDrawer>
      </div>

      <Calendar />

      <div className="scrollbar-hidden mb-4 flex w-full flex-1 items-center gap-6 overflow-x-auto px-4">
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

      <div className="space-y-4">
        {userQuestsData && userQuestsData.length > 0 && (
          <div className="mb-6">
            <h2 className="px-4 pb-4 text-lg font-semibold text-black">Мои квесты</h2>
            {userQuestsData
              .filter(
                (quest) =>
                  (activeFilter === "Все" && questsData) || quest.type === activeFilter,
              )
              .map((quest) => {
                const questData = questsData.find((q) => q.id === quest.eventId);
                return (
                  <div key={quest.id} className="mb-4 px-4">
                    <QuestCard quest={questData as any} isNavigable={true} />
                    <p className="mb-4 text-xs leading-4 text-black">
                      {questData?.description?.slice(0, 100)}
                      {questData?.description && questData.description.length > 100
                        ? "..."
                        : ""}
                    </p>

                    <div className="mb-6 flex w-full items-center justify-between">
                      {questData?.hasAchievement ? (
                        <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                          + Достижение
                        </span>
                      ) : (
                        <span
                          style={{ visibility: "hidden" }}
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        >
                          + Достижение
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="text-base font-medium text-black">
                          +
                          {questData?.rewards
                            ?.find((reward) => reward.type === "point")
                            ?.value.toLocaleString() || 0}
                        </span>
                        <span>
                          {questData?.rewards
                            ?.filter((reward) => reward.type === "text")
                            .map((reward) => (
                              <span key={reward.value}>{reward.value}</span>
                            ))}
                        </span>
                        <span className="text-base font-medium text-black">points</span>
                        <Coin />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        <div className="mb-6">
          {questsData
            .filter((quest) => quest.isSeries)

            .map((quest) => (
              <SeriesQuestCard key={quest.id} quest={quest as any} />
            ))}
        </div>

        {questsData
          .filter((quest) => !quest.isSeries)
          .filter(
            (quest) =>
              (activeFilter === "Все" && questsData) || quest.type === activeFilter,
          )
          .filter((quest) => {
            return (
              quest.title.toLowerCase().includes(search.toLowerCase()) ||
              quest.description.toLowerCase().includes(search.toLowerCase())
            );
          })
          .map((quest, idx) => (
            <div key={quest.id}>
              <h3 className="px-4 pb-2 text-xs font-normal text-black">{quest.date}</h3>
              <div className="px-4">
                <QuestCard quest={quest as any} isNavigable={true} />
                <p className="my-2 text-xs leading-4 text-black">
                  {quest.description.slice(0, 100) +
                    (quest.description.length > 100 ? "..." : "")}
                </p>
                <div className="mb-6 flex items-center justify-between">
                  {quest.hasAchievement && (
                    <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                      + Достижение
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-base font-medium text-black">
                      +
                      {quest.rewards
                        ?.find((reward) => reward.type === "point")
                        ?.value.toLocaleString() || 0}
                    </span>

                    <span className="text-base font-medium text-black">points</span>
                    <Coin />
                  </div>
                </div>
              </div>
            </div>
          ))}
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
      {isMoreOpen && <More setIsMoreOpen={setIsMoreOpen} />}
    </div>
  );
}

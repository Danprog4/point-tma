import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { Coin } from "~/components/Icons/Coin";
import { QuestCard } from "~/components/QuestCard";
import { usePlatform } from "~/hooks/usePlatform";
import { useTRPC } from "~/trpc/init/react";
import { Quest } from "~/types/quest";

export const Route = createFileRoute("/user-quests/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const userId = parseInt(id);
  const [activeFilter, setActiveFilter] = useState("Активные");
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const { data: userEvents } = useQuery(
    trpc.event.getUserEvents.queryOptions({ userId: userId }),
  );
  const { data: questsData } = useQuery(
    trpc.event.getEventsByCategory.queryOptions({ category: "Квест" }),
  );

  // Find the user we're viewing
  const viewedUser = useMemo(() => {
    return users?.find((user) => user.id === userId);
  }, [users, userId]);

  // Filter for quests only and add quest data
  const userQuestsData = useMemo(() => {
    const questEvents = userEvents?.filter((event) => event.type === "Квест") || [];

    return questEvents.map((event) => {
      const quest = questsData?.find((q) => q.id === event.eventId);
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
  }, [userEvents]);

  // Separate into active and completed quests
  const activeQuests = useMemo(() => {
    return userQuestsData.filter((quest) => {
      return !quest.isCompleted;
    });
  }, [userQuestsData]);

  const completedQuests = useMemo(() => {
    return userQuestsData.filter((quest) => {
      return quest.isCompleted;
    });
  }, [userQuestsData]);

  const filters = [
    { name: "Активные", count: activeQuests?.length || 0 },
    { name: "Пройденные", count: completedQuests?.length || 0 },
  ];

  const displayQuests = activeFilter === "Активные" ? activeQuests : completedQuests;

  const isMobile = usePlatform();

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen overflow-y-auto bg-white pt-16 pb-10 data-[mobile=true]:pt-39"
    >
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-10 flex items-center justify-center bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => window.history.back()}
          className="absolute left-4 flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-base font-bold text-gray-800">
          Квесты {viewedUser?.name} {viewedUser?.surname}
        </h1>
      </div>

      <div className="scrollbar-hidden mb-4 flex w-full flex-1 items-center gap-10 overflow-x-auto px-4">
        {filters.map((filter) => (
          <button
            key={filter.name}
            onClick={() => setActiveFilter(filter.name)}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter.name
                ? "bg-black text-white"
                : "border-gray-200 bg-white text-black"
            }`}
          >
            {filter.name} ({filter.count})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {displayQuests
          ?.sort(
            (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
          )
          .map((quest: any) => {
            const questData = questsData?.find((q) => q.id === quest.eventId);
            return (
              <div key={quest?.id}>
                <div className="px-4">
                  <QuestCard quest={questData as Quest} isNavigable={true} />
                  <p className="mb-4 text-xs leading-4 text-black">
                    {(() => {
                      const description = questData?.description;
                      return description && description.length > 100
                        ? description.slice(0, 100) + "..."
                        : description;
                    })()}
                  </p>
                  <div className="mb-6 flex items-center justify-between">
                    {questData?.hasAchievement ? (
                      <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                        + Достижение
                      </span>
                    ) : (
                      <div></div>
                    )}
                    {questData?.rewards?.find((r: any) => r.type === "point") ? (
                      <div className="ml-auto flex items-center gap-1">
                        <span className="text-base font-medium text-black">
                          +
                          {questData?.rewards
                            ?.find((r: any) => r.type === "point")
                            ?.value?.toLocaleString() || 0}
                        </span>
                        <span className="text-base font-medium text-black">points</span>
                        <Coin />
                      </div>
                    ) : (
                      <div></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        {displayQuests?.length === 0 && (
          <div className="flex flex-col items-center justify-center px-4 py-16">
            <div className="text-center text-gray-500">
              <p className="mb-2 text-lg font-medium">
                {activeFilter === "Активные"
                  ? "Нет активных квестов"
                  : "Нет пройденных квестов"}
              </p>
              <p className="text-sm">
                {activeFilter === "Активные"
                  ? "Пользователь пока не участвует в квестах"
                  : "У пользователя пока нет завершенных квестов"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

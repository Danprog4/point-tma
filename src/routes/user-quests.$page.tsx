import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Coin } from "~/components/Icons/Coin";
import { QuestCard } from "~/components/QuestCard";
import { useTRPC } from "~/trpc/init/react";
import { Quest } from "~/types/quest";

export const Route = createFileRoute("/user-quests/$page")({
  component: RouteComponent,
});

function RouteComponent() {
  const { page } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const [pageState, setPage] = useState(page);
  const { data } = useQuery(trpc.event.getMyEvents.queryOptions());
  const { data: questsData } = useQuery(
    trpc.event.getEventsByCategory.queryOptions({ category: "Квест" }),
  );
  console.log(data);

  const filteredEvents = data?.filter((event) => event.type === "Квест");
  const QuestsData = filteredEvents?.map((event) => {
    const quest = questsData?.find((q) => q.id === event.eventId);
    return quest
      ? {
          ...event,
          description: quest.description,
          hasAchievement: quest.hasAchievement,
          reward: quest.rewards,
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

  const completedQuestsData = QuestsData?.filter((q) => q.isCompleted === true);
  const uncompletedQuestsData = QuestsData?.filter((q) => q.isCompleted === false);

  return (
    <div className="flex flex-col overflow-y-auto px-4 pt-10">
      <div className="fixed top-0 left-0 z-10 flex w-full items-center justify-center bg-white">
        <div className="relative flex w-full max-w-md items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate({ to: "/profile" })}
            className="flex h-6 w-6 items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-800">
            Квесты
          </h1>

          <div className="flex h-6 w-6" />
        </div>
      </div>
      <div className="mt-4 flex gap-4 pb-4">
        <button
          className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
            pageState === "active" ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setPage("active")}
        >
          Активные
        </button>
        <button
          className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
            pageState === "completed" ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setPage("completed")}
        >
          Пройденные
        </button>
      </div>
      {pageState === "active" ? (
        <>
          {uncompletedQuestsData?.map((quest) => {
            const questData = questsData?.find((q) => q.id === quest.eventId);
            return (
              <div key={quest.id}>
                <QuestCard quest={questData as Quest} isNavigable={true} />
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
                      +{" "}
                      {questData?.rewards
                        ?.find((r) => r.type === "point")
                        ?.value?.toLocaleString() || 0}
                    </span>
                    <span className="text-base font-medium text-black">points</span>
                    <Coin />
                  </div>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <>
          {completedQuestsData?.map((quest) => {
            const questData = questsData?.find((q) => q.id === quest.eventId);
            return (
              <div key={quest.id}>
                <QuestCard quest={questData as Quest} isNavigable={true} />
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
                      +{" "}
                      {questData?.rewards
                        ?.find((r) => r.type === "point")
                        ?.value?.toLocaleString() || 0}
                    </span>
                    <span className="text-base font-medium text-black">points</span>
                    <Coin />
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

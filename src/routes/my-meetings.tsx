import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Coin } from "~/components/Icons/Coin";
import { QuestCard } from "~/components/QuestCard";
import { useTRPC } from "~/trpc/init/react";
import { Quest } from "~/types/quest";
export const Route = createFileRoute("/my-meetings")({
  component: RouteComponent,
});

function RouteComponent() {
  const [activeFilter, setActiveFilter] = useState("Мои встречи");
  const trpc = useTRPC();
  const { data: meetings } = useQuery(trpc.meetings.getMeetings.queryOptions());

  const { data: meetingsWithEvents } = useQuery(
    trpc.meetings.getMeetingsWithEvents.queryOptions(),
  );

  const filters = ["Мои встречи", "Приглашения", "Заявки"];

  console.log(JSON.stringify(meetingsWithEvents), "meetingsWithEvents");

  console.log(meetings, "meetings");

  return (
    <div className="min-h-screen overflow-y-auto bg-white pt-16 pb-10">
      <div className="fixed top-0 right-0 left-0 z-10 flex items-center bg-white">
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex w-full items-center justify-center p-4">
          <h1 className="text-center text-base font-bold text-gray-800">Мои встречи</h1>
        </div>
      </div>

      <div className="scrollbar-hidden mb-4 flex w-full flex-1 items-center gap-10 overflow-x-auto px-4">
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
      {meetingsWithEvents?.map((quest) => {
        return (
          <div key={quest?.id}>
            <div className="px-4">
              <QuestCard quest={quest?.event || ({} as Quest)} isNavigable={true} />
              <p className="mb-4 text-xs leading-4 text-black">
                {quest?.event?.description}
              </p>
              <div className="mb-6 flex items-center justify-between">
                {quest?.event?.hasAchievement && (
                  <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                    + Достижение
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <span className="text-base font-medium text-black">
                    + {quest?.event?.reward.toLocaleString()}
                  </span>
                  <span className="text-base font-medium text-black">points</span>
                  <Coin />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

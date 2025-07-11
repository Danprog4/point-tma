import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Coin } from "~/components/Icons/Coin";
import { questsData } from "~/config/quests";

import { QuestCard } from "~/components/QuestCard";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/user-quests")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const [page, setPage] = useState<"active" | "completed">("active");
  const { data: quests } = useQuery(trpc.quest.getMyQuests.queryOptions());
  const newQuestsData = questsData.filter((quest) =>
    quests
      ?.filter((q) => q.questId === quest.id)
      .map((q) => ({
        ...q,
        description: quest.description,
        hasAchievement: quest.hasAchievement,
        reward: quest.reward,
        title: quest.title,
        date: quest.date,
        location: quest.location,
        price: quest.price,
        type: quest.type,
        category: quest.category,
        organizer: quest.organizer,
        image: quest.image,
      })),
  );

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
          {/* Empty div to balance the right side */}
          <div className="flex h-6 w-6" />
        </div>
      </div>
      {/* Segment Control */}
      <div className="mt-4 flex gap-4 pb-4">
        <button
          className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
            page === "active" ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setPage("active")}
        >
          Активные
        </button>
        <button
          className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
            page === "completed" ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setPage("completed")}
        >
          Пройденные
        </button>
      </div>
      {page === "active" ? (
        <>
          {newQuestsData?.map((quest) => (
            <>
              <QuestCard quest={quest} isNavigable={true} />
              <p className="mb-4 text-xs leading-4 text-black">{quest.description}</p>

              <div className="mb-6 flex w-full items-center justify-between">
                {quest.hasAchievement ? (
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
                    + {quest.reward.toLocaleString()}
                  </span>
                  <span className="text-base font-medium text-black">points</span>
                  <Coin />
                </div>
              </div>
            </>
          ))}
        </>
      ) : (
        <div className="flex flex-col items-start justify-center">
          <div className="mb-4 text-sm text-gray-500">
            Пройденные квесты пока недоступны
          </div>
        </div>
      )}
    </div>
  );
}

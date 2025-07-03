import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Coin } from "~/components/Icons/Coin";
import { QuestCard } from "~/components/QuestCard";
import { questsData } from "~/config/quests";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/points")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const [page, setPage] = useState<"history" | "info">("history");
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const questData = questsData.slice(0, 3);
  return (
    <div className="flex flex-col overflow-y-auto px-4">
      <div className="fixed top-0 left-0 z-10 flex w-full items-center justify-center bg-white">
        <div className="relative flex w-full max-w-md items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate({ to: "/profile" })}
            className="flex h-6 w-6 items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-800">
            Points
          </h1>
          {/* Empty div to balance the right side */}
          <div className="flex h-6 w-6" />
        </div>
      </div>
      <div className="mt-14 flex w-full items-center justify-center gap-1 rounded-lg bg-[#9924FF] p-4 text-white">
        <Coin />
        <div>Points {user?.balance}</div>
      </div>
      {/* Segment Control */}
      <div className="mt-4 flex gap-4 pb-4">
        <button
          className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
            page === "history" ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setPage("history")}
        >
          История
        </button>
        <button
          className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
            page === "info" ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setPage("info")}
        >
          Где получить
        </button>
      </div>
      {page === "history" ? (
        <div className="text-sm text-gray-500">История пока недоступна</div>
      ) : (
        <div className="flex flex-col items-start justify-center">
          <div className="mb-4 text-sm text-gray-500">
            Где можно получить больше point
          </div>
          <div className="flex w-full flex-col items-start justify-center">
            {questData.map((quest) => (
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
          </div>
        </div>
      )}
    </div>
  );
}

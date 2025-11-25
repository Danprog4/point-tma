import { useNavigate } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { Coin } from "~/components/Icons/Coin";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { Quest } from "~/types/quest";

export function SeriesQuestCard({ quest }: { quest: Quest }) {
  const navigate = useNavigate();

  return (
    <div className="relative mx-4">
      <div className="absolute inset-x-2 top-[180px] h-4 rounded-b-2xl bg-purple-50 shadow-sm"></div>
      <div className="absolute inset-x-4 top-[190px] h-4 rounded-b-2xl bg-purple-100 shadow-sm"></div>
      <div
        className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-5 shadow-lg transition-all hover:shadow-xl"
        onClick={() => {
          if (quest && quest.id !== undefined && quest.id !== null) {
            saveScrollPosition("quests");
            navigate({
              to: "/event/$name/$id",
              params: { name: "Квест", id: quest.id.toString() },
            });
          }
        }}
      >
        <div className="flex gap-4">
          <div className="relative h-[98px] w-[88px] flex-shrink-0 overflow-hidden rounded-xl shadow-md">
            <img
              src={quest.image}
              alt={quest.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-base leading-tight font-bold text-gray-900">
              {quest.title}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-purple-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                Серия квестов
              </span>
              <span className="rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-medium text-gray-900 shadow-sm">
                Тематический
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-gray-600" />
                <span className="text-xs text-gray-700">{quest.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gray-600" />
                <span className="text-xs text-gray-700">{quest.location}</span>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-gray-700">
          {quest.description.slice(0, 100) +
            (quest.description.length > 100 ? "..." : "")}
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-purple-200 pt-3">
          {quest.hasAchievement && (
            <span className="rounded-full bg-purple-300 px-3 py-1 text-xs font-medium text-gray-900 shadow-sm">
              🏆 Достижение
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-md">
            <span className="text-sm font-semibold text-gray-900">
              +{quest.rewards.find((r) => r.type === "point")?.value.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-gray-600">points</span>
            <Coin />
          </div>
        </div>
      </div>
    </div>
  );
}

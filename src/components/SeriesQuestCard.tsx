import { useNavigate } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { Coin } from "~/components/Icons/Coin";
import { Quest } from "~/types/quest";

export function SeriesQuestCard({ quest }: { quest: Quest }) {
  const navigate = useNavigate();

  return (
    <div className="relative mx-4 mb-6">
      <div className="absolute inset-x-0 top-3 h-3 rounded-b-2xl bg-[#F3E5FF] opacity-50"></div>
      <div className="absolute inset-x-4 top-1.5 h-3 rounded-b-2xl bg-[#F3E5FF] opacity-70"></div>
      <div
        className="relative cursor-pointer rounded-2xl bg-[#F3E5FF] p-4"
        onClick={() => {
          if (quest && quest.id !== undefined && quest.id !== null) {
            navigate({
              to: "/event/$name/$id",
              params: { name: "Квест", id: quest.id.toString() },
            });
          }
        }}
      >
        <div className="flex gap-4">
          <img
            src={quest.image}
            alt={quest.title}
            className="h-[76px] w-[76px] flex-shrink-0 rounded-lg object-cover"
          />
          <div className="flex-1 space-y-2">
            <h3 className="text-base leading-6 font-bold text-black">{quest.title}</h3>
            <div className="flex items-center gap-1">
              <span className="rounded-full bg-[#9924FF] px-2.5 py-0.5 text-xs font-medium text-white">
                Серия квестов
              </span>
              <span className="rounded-full bg-[#FFD943] px-2.5 py-0.5 text-xs font-medium text-black">
                Тематический
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#ABABAB]">
                  <Clock className="h-2 w-2 text-white" />
                </div>
                <span className="text-xs text-black">{quest.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex h-4 w-4 items-center justify-center">
                  <MapPin className="h-3 w-3 text-[#ABABAB]" />
                </div>
                <span className="text-xs text-black">{quest.location}</span>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs leading-4 text-black">
          {quest.description.slice(0, 100) +
            (quest.description.length > 100 ? "..." : "")}
        </p>
        <div className="mt-4 flex items-center justify-between">
          {quest.hasAchievement && (
            <span className="rounded-full bg-[#DEB8FF] px-2.5 py-0.5 text-xs font-medium text-black">
              + Достижение
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <span className="text-base font-medium text-black">
              + {quest.reward.toLocaleString()}
            </span>
            <span className="text-base font-medium text-black">points</span>
            <Coin />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { memo } from "react";
import { cn } from "~/lib/utils";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { getTypeColor } from "~/routes/quests";
import { Quest } from "~/types/quest";

const getQuestTypeGradient = (type: string) => {
  switch (type) {
    case "Help Квест":
    case "Хелп-квест":
    case "Help quest":
      return "bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500";
    case "Хоррор":
      return "bg-gradient-to-r from-red-900 via-red-600 to-red-900";
    case "Эскейп-рум":
      return "bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600";
    case "Городской":
      return "bg-gradient-to-r from-sky-500 via-blue-400 to-sky-500";
    case "Детективный":
      return "bg-gradient-to-r from-slate-700 via-blue-900 to-slate-700";
    case "Приключенческий":
      return "bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600";
    case "Научный":
      return "bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500";
    case "Командный":
      return "bg-gradient-to-r from-fuchsia-600 via-purple-500 to-fuchsia-600";
    case "VR":
      return "bg-gradient-to-r from-lime-500 via-green-400 to-lime-500";
    case "Логический":
      return "bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500";
    case "Спортивный":
      return "bg-gradient-to-r from-red-500 via-orange-500 to-red-500";
    case "Role Play":
      return "bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500";
    case "Блогерский":
      return "bg-gradient-to-r from-purple-600 via-magenta-500 to-purple-600";
    case "Серия квестов":
      return "bg-gradient-to-r from-red-600 via-orange-500 to-red-600";
    case "Глобальный":
      return "bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600";
    case "Ежедневный":
      return "bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500";
    case "Обучающий":
      return "bg-gradient-to-r from-violet-600 via-purple-400 to-violet-600";
    case "Тематический":
      return "bg-gradient-to-r from-rose-500 via-pink-400 to-rose-500";
    case "Саморазвитие":
      return "bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500";
    default:
      return "bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400";
  }
};

export const QuestCard = memo(function QuestCard({
  quest,
  isNavigable = true,
  id,
  isMeeting = false,

  onClick,
}: {
  quest?: Quest | any;
  isNavigable?: boolean;
  id?: number;
  isMeeting?: boolean;
  onClick?: () => void;
}) {
  const navigate = useNavigate();

  if (!quest) {
    return null;
  }

  const pathUrl = !quest.isCustom ? "/event/$name/$id" : "/meet/$id";

  return (
    <div
      className="group relative flex cursor-pointer items-start gap-4 overflow-hidden rounded-2xl bg-white p-3 pt-4 shadow-md transition-all hover:shadow-xl"
      onClick={() => {
        if (onClick) {
          onClick();
        }
        if (isNavigable && quest && quest.id !== undefined && quest.id !== null) {
          saveScrollPosition("quests");
          navigate({
            to: pathUrl,
            params: {
              name: quest.isCustom ? quest.type : quest.category,
              id: quest.id.toString(),
            },
          });
        }
      }}
    >
      {/* Highlight Top Stripe */}
      <div
        className={cn(
          "absolute top-0 left-0 h-1 w-full",
          getQuestTypeGradient(quest.type || quest.category),
        )}
      />
      <div className="relative h-[98px] w-[88px] flex-shrink-0 overflow-hidden rounded-xl">
        <img
          src={!isMeeting ? quest.image : getImageUrl(quest.image!)}
          alt={quest.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
      <div className="flex flex-1 flex-col justify-between space-y-2">
        <h3 className="w-full text-base leading-tight font-bold text-gray-900">
          {quest.title || quest.name}
        </h3>

        <div className="flex items-center gap-2">
          <span
            className={`${getTypeColor(quest.type)} rounded-full px-2.5 py-1 text-xs font-medium text-gray-900 shadow-sm`}
          >
            {quest.type || ""}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs text-gray-600">{quest.date || "Сейчас"}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs text-gray-600">{quest.location || "Москва"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

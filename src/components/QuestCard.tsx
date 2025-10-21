import { useNavigate } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { memo } from "react";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { getTypeColor } from "~/routes/quests";
import { Quest } from "~/types/quest";

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
      className="group flex cursor-pointer items-start gap-4 overflow-hidden rounded-2xl bg-white p-3 shadow-md transition-all hover:shadow-xl"
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

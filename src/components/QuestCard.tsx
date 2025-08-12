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
      className="flex items-start gap-4"
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
      <img
        src={!isMeeting ? quest.image : getImageUrl(quest.image!)}
        alt={quest.title}
        className="h-[88px] w-[88px] flex-shrink-0 rounded-lg object-cover"
      />
      <div className="flex-1 flex-col space-y-2">
        <h3 className="w-full text-base leading-6 font-bold text-black">
          {quest.title || quest.name}
        </h3>

        <div className="flex items-center gap-2">
          <span
            className={`${getTypeColor(quest.type)} rounded-full px-2.5 py-0.5 text-xs font-medium text-black`}
          >
            {quest.type || ""}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-300">
                <Clock className="h-2 w-2 text-white" />
              </div>
              <span className="text-xs text-black">{quest.date || "Сейчас"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex h-4 w-4 items-center justify-center">
                <MapPin className="h-3 w-3 text-gray-400" />
              </div>
              <span className="text-xs text-black">{quest.location || "Москва"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

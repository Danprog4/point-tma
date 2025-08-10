import { useNavigate } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { getTypeColor } from "~/routes/quests";

export function MeetCard({
  meet,
  isNavigable = true,
  id,

  onClick,
}: {
  meet?: any;
  isNavigable?: boolean;
  id?: number;

  onClick?: () => void;
}) {
  const navigate = useNavigate();

  if (!meet) {
    return null;
  }

  const pathUrl = "/meet/$id";
  console.log(meet, "meet");

  return (
    <div
      className="flex items-start gap-4"
      onClick={() => {
        if (onClick) {
          onClick();
        }
        if (isNavigable && meet && meet.id !== undefined && meet.id !== null) {
          saveScrollPosition("my-meetings");
          navigate({
            to: pathUrl,
            params: {
              id: meet.id.toString(),
            },
          });
        }
      }}
    >
      <img
        src={getImageUrl(meet.image)}
        alt={meet.title}
        className="h-[88px] w-[88px] flex-shrink-0 rounded-lg object-cover"
      />
      <div className="flex-1 flex-col space-y-2">
        <h3 className="w-full text-base leading-6 font-bold text-black">{meet.name}</h3>

        <div className="flex items-center gap-2">
          <span
            className={`${getTypeColor(meet.type)} rounded-full px-2.5 py-0.5 text-xs font-medium text-black`}
          >
            {meet.type || ""}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-300">
                <Clock className="h-2 w-2 text-white" />
              </div>
              <span className="text-xs text-black">{meet.date || "Сейчас"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex h-4 w-4 items-center justify-center">
                <MapPin className="h-3 w-3 text-gray-400" />
              </div>
              <span className="text-xs text-black">{meet.location || "Москва"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

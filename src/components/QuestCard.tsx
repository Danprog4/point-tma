import { useNavigate } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { getCategoryColor, getTypeColor } from "~/routes/quests";
import { Quest } from "~/types/quest";

export function QuestCard({
  quest,
  isNavigable = true,
}: {
  quest?: Quest;
  isNavigable?: boolean;
}) {
  const navigate = useNavigate();

  if (!quest) {
    return null;
  }

  console.log(quest);

  return (
    <div
      className="flex items-start gap-4"
      onClick={() => {
        if (isNavigable && quest && quest.id !== undefined && quest.id !== null) {
          navigate({
            to: "/event/$name/$id",
            params: { name: "Квест", id: quest.id.toString() },
          });
        }
      }}
    >
      <img
        src={quest.image}
        alt={quest.title}
        className="h-[88px] w-[88px] flex-shrink-0 rounded-lg object-cover"
      />
      <div className="flex-1 flex-col space-y-2">
        <h3 className="w-full text-base leading-6 font-bold text-black">{quest.title}</h3>

        <div className="flex items-center gap-2">
          <span
            className={`${getTypeColor(quest.type)} rounded-full px-2.5 py-0.5 text-xs font-medium text-black`}
          >
            {quest.type}
          </span>
          <span
            className={`${getCategoryColor(quest.category)} rounded-full px-2.5 py-0.5 text-xs font-medium text-white`}
          >
            {quest.category}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-300">
                <Clock className="h-2 w-2 text-white" />
              </div>
              <span className="text-xs text-black">{quest.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex h-4 w-4 items-center justify-center">
                <MapPin className="h-3 w-3 text-gray-400" />
              </div>
              <span className="text-xs text-black">{quest.location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { ChevronRight } from "lucide-react";

export const ExtraStep1 = ({
  item,
  type,
  setType,
  setStep,
}: {
  item: any;
  type: string;
  setType: (type: string) => void;
  setStep: (step: number) => void;
}) => {
  const eventTypes = [
    {
      emoji: "💕️",
      name: "Свидание",
      description: "Оффлайн активность с выполнением заданий и вознаграждением",
      bgColor: "bg-purple-100",
    },
    {
      emoji: "🎉",
      name: "Дружеская встреча",
      description:
        "Вы хотите пригласить людей на серию лекций по определённой специфике.",
      bgColor: "bg-blue-100",
    },
    {
      emoji: "💬",
      name: "Нетворкинг",
      description: "Это может обычная беседе в кафе или в другом общественном месте.",
      bgColor: "bg-green-100",
    },
  ];
  return (
    <>
      <div>
        <div className="relative h-[25vh] w-full flex-shrink-0 overflow-hidden rounded-2xl border bg-red-500">
          <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
          <div className="absolute bottom-2 left-2 flex gap-1 text-black">
            <div className="rounded-full bg-white p-1 text-sm">{item.date}</div>
            <div className="rounded-full bg-white p-1 text-sm">{item.price}</div>
          </div>
        </div>
        <div className="flex flex-col p-2">
          <div className="flex text-start">{item.title}</div>
          <div className="text-sm text-gray-500">
            {item.description?.slice(0, 40) +
              (item.description?.length > 40 ? "..." : "")}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-start justify-center">
        <div className="text-xl font-bold">Выберите тип мероприятия</div>
        <div className="mt-2 flex flex-col gap-2">
          {eventTypes.map((eventType, index) => (
            <button
              key={index}
              onClick={() => {
                setType(eventType.name);
                setStep(1);
              }}
              className={`w-full rounded-2xl p-4 ${eventType.bgColor} flex items-center justify-between transition-opacity hover:opacity-80`}
            >
              <div className="text-left">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-base">{eventType.emoji}</span>
                  <span className="text-base font-medium text-gray-900">
                    {eventType.name}
                  </span>
                </div>
                <p className="text-xs leading-tight text-gray-900">
                  {eventType.description}
                </p>
              </div>
              <ChevronRight className="ml-2 h-5 w-5 flex-shrink-0 text-gray-900" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

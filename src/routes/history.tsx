import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { usePlatform } from "~/hooks/usePlatform";

export const Route = createFileRoute("/history")({
  component: RouteComponent,
});

function RouteComponent() {
  const [activeFilter, setActiveFilter] = useState("Все");

  const filters = ["Все", "Покупка", "Просмотр событий", "Просмотр профилей", "Отмены"];

  const historyData = [
    {
      date: "Сегодня",
      items: [
        {
          type: "Поход на концерт",
          time: "16:21",
          event: "Событие: Концерт группы «Korn»",
        },
      ],
    },
    {
      date: "13 января",
      items: [
        {
          type: "Участие в квесте",
          time: "10:00",
          event: "Событие: Квест «Камень вечности»",
        },
        {
          type: "Встреча",
          time: "20:30",
          event: "Событие: Дизайнерские посиделки в баре",
        },
      ],
    },
    {
      date: "11 января",
      items: [
        {
          type: "Участие в квесте",
          time: "23:00",
          event: "Событие: Квест «Поиск сокровища»",
        },
        {
          type: "Поход на концерт",
          time: "19:00",
          event: "Событие: Концерт группы «Gogol Bordello»",
        },
      ],
    },
    {
      date: "9 января",
      items: [
        {
          type: "Участие в конференции",
          time: "10:00",
          event: "Событие: Новые-старые менеджмент",
        },
        {
          type: "Новое знакомство",
          time: "9:30",
          event: "Профиль: Тамара Утюгова",
        },
      ],
    },
  ];

  const navigate = useNavigate();

  const isMobile = usePlatform();

  return (
    <div
      data-mobile={isMobile}
      className="mx-auto min-h-screen w-full max-w-sm bg-white pb-24 data-[mobile=true]:pt-42"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-base font-bold text-gray-800">История</h1>
        <div className="flex items-center justify-center p-4 pb-2"></div>
      </div>

      {/* Filter Chips */}
      <div className="scrollbar-hidden overflow-x-auto px-4 pb-4">
        <div className="flex gap-4">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-shrink-0 rounded-[20px] px-4 py-2.5 text-sm font-medium transition-colors ${
                activeFilter === filter
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-900 hover:bg-gray-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="px-4 text-gray-500">Ваша история пока пуста</div>
      <div className="hidden flex-1 overflow-y-auto">
        {historyData.map((dateGroup, groupIndex) => (
          <div key={groupIndex} className="mb-6">
            {/* Date Header */}
            <div className="px-4 py-1">
              <h2 className="text-xs text-gray-900">{dateGroup.date}</h2>
            </div>

            {/* History Items */}
            <div className="space-y-0">
              {dateGroup.items.map((item, itemIndex) => (
                <div key={itemIndex} className="rounded-3xl px-4 pb-6">
                  <div className="flex flex-col gap-2">
                    {/* Title and Time */}
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium text-gray-900">
                        {item.type}
                      </span>
                      <span className="text-base font-medium text-gray-900">
                        {item.time}
                      </span>
                    </div>

                    {/* Event Details */}
                    <div className="flex">
                      <p className="text-sm text-gray-900">{item.event}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

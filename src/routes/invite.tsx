import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { conferencesData } from "~/config/conf";
import { kinoData } from "~/config/kino";
import { networkingData } from "~/config/networking";
import { partiesData } from "~/config/party";
import { questsData } from "~/config/quests";
import { eventTypes } from "~/types/events";
export const Route = createFileRoute("/invite")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>("Все");
  const filters = ["Все", "Кино", "Вечеринки", "Конференции", "Нетворкинг", "Квесты"];

  let data: any[] = [];

  switch (activeFilter) {
    case "Все":
      data = [
        ...questsData,
        ...kinoData,
        ...conferencesData,
        ...networkingData,
        ...partiesData,
      ];
      break;
    case "Квесты":
      data = questsData;
      console.log(data);
      break;
    case "Кино":
      data = kinoData;
      break;
    case "Конференции":
      data = conferencesData;
      break;
    case "Вечеринки":
      data = partiesData;
      break;
    case "Нетворкинг":
      data = networkingData;
      break;
    default:
      data = [];
  }

  return (
    <div className="flex flex-col">
      <div className="fixed top-0 left-0 z-10 flex w-full items-center justify-center bg-white">
        <div className="relative flex w-full max-w-md items-center justify-between px-4 py-3">
          <button
            onClick={() => window.history.back()}
            className="flex h-6 w-6 items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-nowrap text-gray-800">
            Куда вы хотите пригласить?
          </h1>
          <div className="flex h-6 w-6" />
        </div>
      </div>

      <div className="pt-14">
        <div className="mb-4 flex w-full items-center gap-6 overflow-x-auto px-4">
          <button
            onClick={() => setIsCustom(false)}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              !isCustom ? "bg-black text-white" : "border-gray-200 bg-white text-black"
            }`}
          >
            Выбрать
          </button>
          <button
            onClick={() => setIsCustom(true)}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              isCustom ? "bg-black text-white" : "border-gray-200 bg-white text-black"
            }`}
          >
            Создать свою встречу
          </button>
        </div>
        {!isCustom ? (
          <>
            <div className="scrollbar-hidden mb-4 flex w-full items-center gap-6 overflow-x-auto px-4">
              {filters.map((filter, index) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeFilter === filter
                      ? "bg-black text-white"
                      : "border-gray-200 bg-white text-black"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 px-4">
              {data.map((item, index) => (
                <div key={index}>
                  <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl border bg-red-500">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 flex gap-1 text-black">
                      <div className="rounded-full bg-white p-1 text-xs">{item.date}</div>
                      <div className="rounded-full bg-white p-1 text-xs">
                        {item.price}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col p-2">
                    <div className="flex text-start">{item.title}</div>
                    <div className="text-sm text-gray-500">
                      {item.description?.slice(0, 10) +
                        (item.description?.length > 10 ? "..." : "")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 rounded-t-[16px] bg-white p-4">
            <div className="min-h-[calc(100vh-200px)] space-y-4 overflow-y-auto">
              {eventTypes.map((eventType, index) => (
                <button
                  key={index}
                  onClick={() => {
                    navigate({
                      to: "/createMeet/$name",
                      params: { name: eventType.name },
                    });
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
        )}
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Calendar } from "~/components/Calendar";
import { useScrollRestoration } from "~/components/hooks/useScrollRes";
import { Selecter } from "~/components/Selecter";
import { conferencesData } from "~/config/conf";
import { kinoData } from "~/config/kino";
import { networkingData } from "~/config/networking";
import { partiesData } from "~/config/party";
import { questsData } from "~/config/quests";
import { usePlatform } from "~/hooks/usePlatform";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
export const Route = createFileRoute("/all/$name")({
  component: RouteComponent,
});

function RouteComponent() {
  useScrollRestoration("all");
  const { name } = Route.useParams();
  const [selectedFilter, setSelectedFilter] = useState(name);
  const navigate = useNavigate();
  console.log(name);

  let data: any[] = [];
  switch (name) {
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

  const isMobile = usePlatform();

  return (
    <div
      data-mobile={isMobile}
      className="flex flex-col overflow-y-auto pt-10 pb-10 data-[mobile=true]:pt-39"
    >
      <div
        data-mobile={isMobile}
        className="fixed top-0 left-0 z-10 flex w-full items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-800">
          {name}
        </h1>
        {/* Empty div to balance the right side */}
        <div className="flex h-6 w-6" />
      </div>
      <div className="flex items-center gap-6 p-4 pb-6">
        <div className="flex items-center gap-2">
          <Selecter height="h-10" width="w-full" placeholder="Москва" />
        </div>
        <div className="scrollbar-hidden flex flex-nowrap gap-8 overflow-x-auto">
          {[
            { emoji: "🎞", name: "Кино" },
            { emoji: "💃", name: "Вечеринки" },
            { emoji: "📈", name: "Конференции" },
            { emoji: "🤝", name: "Нетворкинг" },
            { emoji: "🕵️‍♂️", name: "Квесты" },
          ].map((chip) => (
            <div
              onClick={() => {
                navigate({ to: "/all/$name", params: { name: chip.name } });
                setSelectedFilter(chip.name);
              }}
              key={chip.name}
              className={`flex flex-row flex-nowrap items-center justify-center gap-1 rounded-full px-4 py-2.5 text-sm font-medium text-nowrap transition-colors ${
                selectedFilter === chip.name
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              <div>{chip.emoji}</div>
              <div>{chip.name}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mb-4 flex flex-col">
        {data.slice(0, 1).map((item) => {
          return (
            <div>
              <div className="relative aspect-square w-full">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full rounded-t-3xl object-cover"
                />
                <div className="absolute right-0 bottom-0 left-0 flex h-[20%] flex-col items-start justify-center bg-black/50 p-2 px-4 text-white">
                  <div className="flex flex-col items-start justify-center text-start">
                    <div className="text-2xl font-bold">{item.title}</div>
                    <div className="flex items-center gap-2">
                      <div className="">{item.date}</div>
                      <div>{item.location}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mb-4 flex flex-col">
        <Calendar />
        <div className="mx-auto flex max-w-[145px] items-center justify-center">
          <Selecter
            height="h-8"
            width="w-full"
            placeholder="Все события"
            cities={[
              "Все события",
              "Кино",
              "Театр",
              "Концерты",
              "Конференции",
              "Вечеринки",
            ]}
          />
        </div>
        <div className="mt-4 flex gap-4 overflow-x-auto">
          {[
            {
              title: "Пост- новогодний вечер",
              subtitle: "15 января • Мозайка",
              tag: "🎄 Новый год",
              price: "3 000 ₸",
              bg: "bg-gradient-to-br from-red-400 to-pink-400",
            },
            {
              title: "Гангстеры и розы",
              subtitle: "21 января • Алькатрас",
              tag: "💞 Клубы знакомств",
              price: "3 000 ₸",
              bg: "bg-gradient-to-br from-pink-400 to-purple-400",
            },
            {
              title: "KazDrilling 2024",
              subtitle: "Renaissance Hotel",
              tag: "💃 Концерт",
              price: "3 000 ₸",
              bg: "bg-gradient-to-br from-green-400 to-blue-400",
            },
          ].map((event, idx) => (
            <div
              key={idx}
              className="h-[25vh] w-[40vw] flex-shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm"
            >
              <div className={`h-full w-full ${event.bg} relative`}>
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <div>{event.tag}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {Object.entries(
        data.reduce(
          (acc, item) => {
            if (!acc[item.type]) acc[item.type] = [];
            acc[item.type].push(item);
            return acc;
          },
          {} as Record<string, typeof data>,
        ),
      ).map(([type, items]) => (
        <div key={type} className="">
          <h2 className="px-4 text-lg font-bold text-black">{type}</h2>

          <div className="grid grid-cols-2 gap-2 px-4 py-2">
            {(items as any[]).map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  saveScrollPosition("all");
                  navigate({
                    to: "/event/$name/$id",
                    params: { name: item.category!, id: item.id!.toString()! },
                  });
                }}
              >
                <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl border bg-red-500">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 flex gap-1 text-black">
                    <div className="rounded-full bg-white p-1 text-sm">{item.date}</div>
                    <div className="rounded-full bg-white p-1 text-sm">{item.price}</div>
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
        </div>
      ))}
    </div>
  );
}

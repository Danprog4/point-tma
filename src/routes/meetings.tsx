import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "~/components/Header";
import { useScroll } from "~/components/hooks/useScroll";
import { Filters } from "~/components/Icons/Filters";
export const Route = createFileRoute("/meetings")({
  component: RouteComponent,
});

function RouteComponent() {
  const [isList, setIsList] = useState(true);
  const meetings = [
    {
      id: 1,
      name: "Евгения Воробьёва",
      description: "Встреча в ресторане",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      statusColor: "#4FEBCC",
    },
    {
      id: 2,
      name: "Мария Петрова",
      description: "Посещение конференции",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      statusColor: "#31DB37",
    },
    {
      id: 3,
      name: "Владимир Баранов",
      description: "Поход на концерт",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      statusColor: "#85C4F1",
    },
    {
      id: 4,
      name: "Анна Яковлева",
      description: "Поход в мастерскую",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      statusColor: "#E15151",
    },
    {
      id: 5,
      name: "Андрей Григорьев",
      description: "Нетворкинг для дизайнеров",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      statusColor: "#CFD89A",
    },
    {
      id: 6,
      name: "Анна Морозова",
      description: "Концерт «Gogol Bordelo»",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      statusColor: "#EFDEEF",
    },
  ];

  useScroll();

  return (
    <div className="min-h-screen overflow-y-auto bg-white pt-12 pb-20">
      {/* Top Navigation */}
      <Header />

      {/* Page Title */}
      <div className="flex items-center justify-between px-4 py-5">
        <h1 className="text-3xl font-bold text-black">Встречи</h1>
        <button className="mr-1.5 h-4 w-4">
          <Filters />
        </button>
      </div>

      {/* Segment Control */}
      <div className="flex gap-4 px-4 pb-4">
        <button
          className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
            isList ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setIsList(true)}
        >
          Списком
        </button>
        <button
          className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
            !isList ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setIsList(false)}
        >
          На карте
        </button>
      </div>

      {/* Meetings List */}
      <div className="flex-1 overflow-y-auto px-4">
        <>
          <div className="grid grid-cols-2 gap-4">
            {meetings.map((meeting, index) => (
              <div key={meeting.id} className="">
                {index <= 3 && (
                  <>
                    {/* Profile Card */}
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                      {/* Avatar Section */}
                      <div className="relative h-36">
                        <img
                          src={meeting.avatar}
                          alt={meeting.name}
                          className="h-full w-full object-cover"
                        />
                        {/* Status Indicator */}
                        <div
                          className="absolute bottom-1 left-1 h-12 w-12 rounded-full border-2 border-purple-600"
                          style={{ backgroundColor: meeting.statusColor }}
                        />
                      </div>

                      {/* Text Content */}
                      <div className="p-2">
                        <div className="space-y-1">
                          <h3 className="text-sm leading-tight font-medium text-gray-900">
                            {meeting.name}
                          </h3>
                          <p className="line-clamp-2 text-xs leading-tight text-gray-600">
                            {meeting.description}
                          </p>
                        </div>
                      </div>
                    </div>{" "}
                  </>
                )}
              </div>
            ))}

            <div className="col-span-2 mt-[-16px] w-full">
              <div className="flex gap-4 overflow-x-auto">
                {[
                  {
                    title: "Квест для дизайнеров",
                    subtitle: "Получи любой курс за прохождение",
                    tag: "🕹 Квест",
                    price: "3 000 ₸",
                    bg: "bg-gradient-to-br from-orange-400 to-red-400",
                  },
                  {
                    title: "Квест на поиск для развития коммуникационных навыков",
                    subtitle: "Приз 1 ton",
                    tag: "🕹 Квест",
                    price: "3 000 ₸",
                    bg: "bg-gradient-to-br from-teal-400 to-blue-400",
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
                    className="w-48 flex-shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm"
                  >
                    <div className={`h-32 ${event.bg} relative`}>
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold">
                          {event.tag}
                        </span>
                        <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold">
                          {event.price}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="mb-1 font-medium text-gray-900">{event.title}</h3>
                      <p className="text-sm text-gray-500">{event.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {meetings.map((meeting, index) => (
              <div key={meeting.id} className="mt-[-32px]">
                {index > 3 && (
                  <>
                    {/* Profile Card */}
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                      {/* Avatar Section */}
                      <div className="relative h-36">
                        <img
                          src={meeting.avatar}
                          alt={meeting.name}
                          className="h-full w-full object-cover"
                        />
                        {/* Status Indicator */}
                        <div
                          className="absolute bottom-1 left-1 h-12 w-12 rounded-full border-2 border-purple-600"
                          style={{ backgroundColor: meeting.statusColor }}
                        />
                      </div>

                      {/* Text Content */}
                      <div className="p-2">
                        <div className="space-y-1">
                          <h3 className="text-sm leading-tight font-medium text-gray-900">
                            {meeting.name}
                          </h3>
                          <p className="line-clamp-2 text-xs leading-tight text-gray-600">
                            {meeting.description}
                          </p>
                        </div>
                      </div>
                    </div>{" "}
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Calendar } from "~/components/Calendar";
import { Header } from "~/components/Header";
import { useScroll } from "~/components/hooks/useScroll";
import { Filters } from "~/components/Icons/Filters";
export const Route = createFileRoute("/meetings")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Все");
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

  const filters = ["Все", "Конференции", "Вечеринки", "Турниры"];

  useScroll();

  return (
    <div className="min-h-screen overflow-y-auto bg-white pt-12 pb-20">
      {/* Top Navigation */}
      <Header />

      {/* Page Title */}
      <div className="flex items-center justify-between px-4 py-5">
        <h1 className="text-3xl font-bold text-black">Встречи</h1>
        <button className="mr-1.5 mb-1.5 h-4 w-4">
          <Filters />
        </button>
      </div>

      <Calendar />

      <div className="flex w-full flex-1 items-center gap-6 overflow-x-auto px-4">
        {filters.map((filter) => (
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

      {/* Meetings List */}
      <div className="flex-1 overflow-y-auto px-4">
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 mt-4 w-full">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Актуальные встречи</h2>
                <ArrowRight className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex gap-4 overflow-x-auto">
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
            {meetings.map((meeting, index) => (
              <div key={meeting.id} className="">
                {/* Profile Card */}
                <div
                  className="overflow-hidden"
                  onClick={() =>
                    navigate({ to: "/meet/$id", params: { id: meeting.id.toString() } })
                  }
                >
                  {/* Avatar Section */}
                  <div className="relative h-36">
                    <img
                      src={meeting.avatar}
                      alt={meeting.name}
                      className="h-full w-full rounded-tl-2xl rounded-tr-4xl rounded-br-2xl rounded-bl-4xl object-cover"
                    />
                    {/* Status Indicator */}
                    <div
                      className="absolute bottom-2 left-2 h-12 w-12 rounded-full border-2 border-purple-600"
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
                </div>
              </div>
            ))}
          </div>
        </>
      </div>
    </div>
  );
}

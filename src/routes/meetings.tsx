import { createFileRoute } from "@tanstack/react-router";
import { Filter } from "lucide-react";
import { Header } from "~/components/Header";
import { useScroll } from "~/components/hooks/useScroll";
export const Route = createFileRoute("/meetings")({
  component: RouteComponent,
});

function RouteComponent() {
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
        <button className="">
          <Filter className="h-6 w-6 text-gray-900" />
        </button>
      </div>

      {/* Segment Control */}
      <div className="flex gap-4 px-4 pb-4">
        <button className="flex-1 rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white">
          Информация
        </button>
        <button className="flex-1 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-black">
          Друзья
        </button>
      </div>

      {/* Meetings List */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="grid grid-cols-2 gap-4">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="relative">
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

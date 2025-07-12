import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Calendar } from "~/components/Calendar";
import { CreateMeetDrawer } from "~/components/CreateMeetDrawer";
import FilterDrawer from "~/components/FilterDrawer";
import { Header } from "~/components/Header";
import { useScroll } from "~/components/hooks/useScroll";
import { WhiteFilter } from "~/components/Icons/WhiteFilter";
import { fakeUsers } from "~/config/fakeUsers";
import { meetingsConfig } from "~/config/meetings";
import { lockBodyScroll, unlockBodyScroll } from "~/lib/utils/drawerScroll";
import { getEventData } from "~/lib/utils/getEventData";

export const Route = createFileRoute("/meetings")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Все");
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const meetings = meetingsConfig.map((meeting) => {
    const organizer = fakeUsers.find((u) => u.meetings.includes(meeting.id));
    const event = getEventData(meeting.eventType, meeting.eventId);

    return {
      id: meeting.id,
      name: organizer ? `${organizer.name} ${organizer.surname}` : "Неизвестно",
      description: event ? event.title : "Без названия",
      avatar: organizer ? organizer.photoUrl : "",
      statusColor: "#4FEBCC",
      eventType: meeting.eventType,
      eventId: meeting.eventId,
      event,
      organizer,
    };
  });

  const filters = ["Все", "Конференции", "Вечеринки", "Квесты", "Кино", "Нетворкинг"];
  const filterMap = {
    Все: null,
    Конференции: "Конференция",
    Вечеринки: "Вечеринка",
    Квесты: "Квест",
    Кино: "Кино",
    Нетворкинг: "Нетворкинг",
  };

  console.log(meetings);

  useScroll();

  return (
    <div className="min-h-screen overflow-y-auto bg-white pt-12 pb-20">
      {/* Top Navigation */}
      <Header />

      {/* Page Title */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-black">Встречи</h1>
        </div>
        <div
          className="cursor-pointer text-[#2462FF]"
          onClick={() => navigate({ to: "/my-meetings" })}
        >
          Мои встречи
        </div>
      </div>

      <div className="mb-4 flex items-center justify-center gap-6 px-4">
        <input
          type="text"
          placeholder="Поиск встреч"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
        />

        <FilterDrawer
          open={isOpen}
          onOpenChange={(open) => {
            if (open) {
              lockBodyScroll();
            } else {
              unlockBodyScroll();
            }
            setIsOpen(open);
          }}
        >
          <div className="flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-[#9924FF]">
            <WhiteFilter />
          </div>
        </FilterDrawer>
      </div>

      <Calendar />

      <div className="scrollbar-hidden flex w-full flex-1 items-center gap-6 overflow-x-auto px-4">
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
            {meetings
              .filter((meeting) => {
                if (activeFilter === "Все") return true;
                return (
                  meeting.eventType === filterMap[activeFilter as keyof typeof filterMap]
                );
              })
              .filter((meeting) => {
                return (
                  meeting.description.toLowerCase().includes(search.toLowerCase()) ||
                  meeting.name.toLowerCase().includes(search.toLowerCase())
                );
              })
              .map((meeting, index) => (
                <div key={meeting.id} className="">
                  {/* Profile Card */}
                  <div
                    className="overflow-hidden"
                    onClick={() =>
                      navigate({
                        to: "/meet/$id",
                        params: { id: meeting.id.toString() },
                      })
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
      <div className="fixed right-4 bottom-20 left-4">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="w-full rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
        >
          Создать встречу
        </button>
      </div>
      <CreateMeetDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
    </div>
  );
}

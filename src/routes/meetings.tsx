import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Calendar } from "~/components/Calendar";
import FilterDrawer from "~/components/FilterDrawer";
import { Header } from "~/components/Header";
import { useScroll } from "~/components/hooks/useScroll";
import { WhiteFilter } from "~/components/Icons/WhiteFilter";
import { lockBodyScroll, unlockBodyScroll } from "~/lib/utils/drawerScroll";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
export const Route = createFileRoute("/meetings")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: meetingsData } = useQuery(trpc.meetings.getMeetings.queryOptions());
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const { data: meetRequests } = useQuery(trpc.meetings.getRequests.queryOptions());
  const activeMeetRequests = meetRequests?.filter(
    (request) => request.status === "pending",
  );

  const meetingsWithEvents = meetingsData?.map((meeting) => {
    const organizer = users?.find((u) => u.id === meeting.userId);
    return {
      ...meeting,
      organizer,
    };
  });
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Все");
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filters = ["Все", "Конференции", "Вечеринки", "Квесты", "Кино", "Нетворкинг"];
  const filterMap = {
    Все: null,
    Конференции: "Конференция",
    Вечеринки: "Вечеринка",
    Квесты: "Квест",
    Кино: "Кино",
    Нетворкинг: "Нетворкинг",
  };

  console.log(meetingsWithEvents, "meetingsWithEvents");

  useScroll();

  return (
    <div className="min-h-screen overflow-y-auto bg-white pt-14 pb-32">
      {/* Top Navigation */}
      <Header />

      {/* Page Title */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-black">Встречи</h1>
        </div>
        <div
          className="flex cursor-pointer items-center justify-center rounded-full bg-[#F3E5FF] px-4 py-2.5 text-sm font-medium text-black"
          style={{ boxShadow: "0px 4px 16px 0px #9924FF66" }}
          onClick={() => navigate({ to: "/my-meetings" })}
        >
          {activeMeetRequests && activeMeetRequests?.length > 0 ? (
            <div className="relative">
              Мои встречи
              <div className="absolute top-0 right-[-10px] h-2 w-2 rounded-full bg-red-500"></div>
            </div>
          ) : (
            "Мои встречи"
          )}
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
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 mt-4 w-full">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Актуальные встречи</h2>
              <ArrowRight className="h-5 w-5 text-gray-500" />
            </div>
            <div className="scrollbar-hidden flex gap-4 overflow-x-auto">
              {meetingsWithEvents?.slice(0, 7).map((event, idx) => (
                <div
                  onClick={() =>
                    navigate({
                      to: "/meet/$id",
                      params: { id: event.id.toString() },
                    })
                  }
                  key={idx}
                  className="h-[25vh] w-[40vw] flex-shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <div className={`relative h-full w-full`}>
                    <img
                      src={getImageUrl(event.image!)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2">
                      <span className="rounded-lg bg-yellow-100 px-2 py-1 text-xs font-bold">
                        {event.name?.slice(0, 10) +
                          (event.name?.length! > 10 ? "..." : "")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Featured Meetings List */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {meetingsWithEvents
              ?.filter((meeting) => {
                if (activeFilter === "Все") return true;
                return (
                  meeting.typeOfEvent ===
                  filterMap[activeFilter as keyof typeof filterMap]
                );
              })
              .filter((meeting) => {
                const eventTitle = meeting.name || "Без названия";
                const organizerName = meeting.organizer?.name || "Неизвестно";
                return (
                  eventTitle.toLowerCase().includes(search.toLowerCase()) ||
                  organizerName.toLowerCase().includes(search.toLowerCase())
                );
              })
              .map((meeting) => (
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
                        src={
                          meeting.organizer?.photo
                            ? getImageUrl(meeting.organizer.photo!)
                            : meeting.organizer?.photoUrl || ""
                        }
                        alt={meeting.organizer?.name!}
                        className="h-full w-full rounded-tl-2xl rounded-tr-4xl rounded-br-2xl rounded-bl-4xl object-cover"
                      />
                    </div>
                    {/* Text Content */}
                    <div className="p-2">
                      <div className="space-y-1">
                        <h3 className="text-sm leading-tight font-medium text-gray-900">
                          {meeting.organizer?.name}
                        </h3>
                        <p className="line-clamp-2 text-xs leading-tight text-gray-600">
                          {meeting.name || "Без названия"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      <div className="fixed right-4 bottom-20 left-4">
        <button
          onClick={() => navigate({ to: "/createMeet" })}
          className="w-full rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
        >
          Создать встречу
        </button>
      </div>
    </div>
  );
}

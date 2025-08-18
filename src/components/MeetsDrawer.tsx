import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
import { Coin } from "~/components/Icons/Coin";
import { QuestCard } from "~/components/QuestCard";
import { conferencesData } from "~/config/conf";
import { kinoData } from "~/config/kino";
import { networkingData } from "~/config/networking";
import { partiesData } from "~/config/party";
import { questsData } from "~/config/quests";

interface MeetsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetings: any[];
  handleAddToCalendar?: (meeting: any, isMeeting: boolean) => void;
  userId?: string;
  calendarDate?: string;
}

export function MeetsDrawer({
  open,
  onOpenChange,
  meetings,
  handleAddToCalendar,
  userId,
  calendarDate,
}: MeetsDrawerProps) {
  const navigate = useNavigate();
  const [type, setType] = useState<string>("pt-38");
  const [activeFilter, setActiveFilter] = useState<string>("Все");
  const filters = ["Все", "Кино", "Вечеринки", "Конференции", "Нетворкинг", "Квесты"];
  const [search, setSearch] = useState<string>("");
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

  const handleReadyEventClick = (item: any) => {
    navigate({
      to: "/createMeet",
      search: {
        step: 0,
        isExtra: true,
        isBasic: false,
        typeOfEvent: item.category,
        idOfEvent: item.id,

        calendarDate: calendarDate,
      },
    });
    onOpenChange(false);
  };

  const handleCreateMeetingClick = () => {
    navigate({
      to: "/createMeet",
      search: {
        calendarDate: calendarDate,
      },
    });
    onOpenChange(false);
  };

  const handleMyMeetingClick = (meeting: any, isMeeting: boolean) => {
    if (handleAddToCalendar) {
      handleAddToCalendar(meeting, isMeeting);
    }
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[80%] flex-col rounded-t-[16px] bg-white px-4 py-4">
          <div className="overflow-y-auto">
            <div className="fixed top-0 right-0 left-0 z-[100] flex items-center bg-white px-4 py-4">
              <X
                className="absolute h-6 w-6 cursor-pointer"
                onClick={() => onOpenChange(false)}
              />
              <div className="mx-auto text-lg font-bold">
                {calendarDate ? "Выберите встречу" : "Куда вы хотите пригласить?"}
              </div>
            </div>

            <div className="pt-12">
              <div className="scrollbar-hidden mb-4 flex w-full items-center gap-6 overflow-x-auto">
                <button
                  onClick={() => {
                    setType("pt-38");
                    setSearch("");
                  }}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    type === "pt-38"
                      ? "bg-black text-white"
                      : "border-gray-200 bg-white text-black"
                  }`}
                >
                  Выбрать
                </button>
                <button
                  onClick={handleCreateMeetingClick}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    type === "Кастомные"
                      ? "bg-black text-white"
                      : "border-gray-200 bg-white text-black"
                  }`}
                >
                  Создать свою встречу
                </button>
                <button
                  onClick={() => {
                    setType("Мои встречи");
                    setSearch("");
                  }}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    type === "Мои встречи"
                      ? "bg-black text-white"
                      : "border-gray-200 bg-white text-black"
                  }`}
                >
                  Мои встречи
                </button>
              </div>

              {type === "pt-38" && (
                <>
                  <input
                    onChange={(e) => {
                      setSearch(e.target.value);
                    }}
                    value={search}
                    type="text"
                    placeholder="Поиск событий"
                    className="mb-4 h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                  />
                  <div className="absolute top-33 right-7">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="scrollbar-hidden mb-4 flex w-full items-center gap-6 overflow-x-auto">
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
                  <div className="grid grid-cols-2 gap-2">
                    {data
                      .filter((item) =>
                        item.title.toLowerCase().includes(search.toLowerCase()),
                      )
                      .map((item, index) => (
                        <div
                          key={index}
                          onClick={() => handleReadyEventClick(item)}
                          className="cursor-pointer"
                        >
                          <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl border bg-red-500">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute bottom-2 left-2 flex gap-1 text-black">
                              <div className="rounded-full bg-white p-1 text-xs">
                                {item.date}
                              </div>
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
              )}

              {type === "Мои встречи" && (
                <div className="flex flex-col gap-4">
                  <input
                    onChange={(e) => {
                      setSearch(e.target.value);
                    }}
                    value={search}
                    type="text"
                    placeholder="Поиск встреч"
                    className="mb-4 h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                  />
                  <div className="absolute top-33 right-7">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  {meetings && meetings.length > 0 ? (
                    meetings
                      .filter((meeting: any) =>
                        meeting?.name?.toLowerCase().includes(search.toLowerCase()),
                      )
                      ?.sort(
                        (a, b) =>
                          new Date(b.createdAt!).getTime() -
                          new Date(a.createdAt!).getTime(),
                      )

                      .map((meeting: any) => (
                        <div key={meeting?.id}>
                          <div
                            onClick={() => handleMyMeetingClick(meeting, true)}
                            className="cursor-pointer"
                          >
                            <QuestCard
                              quest={meeting}
                              isNavigable={false}
                              isMeeting={true}
                            />
                            <p className="mb-4 text-xs leading-4 text-black">
                              {(() => {
                                const description = meeting?.isCustom
                                  ? meeting?.description
                                  : meeting?.event?.description;
                                return description && description.length > 100
                                  ? description.slice(0, 100) + "..."
                                  : description;
                              })()}
                            </p>
                            <div className="mb-6 flex items-center justify-between">
                              {meeting?.event?.hasAchievement ? (
                                <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                                  + Достижение
                                </span>
                              ) : (
                                <div></div>
                              )}
                              {(meeting?.event as any)?.rewards?.find(
                                (r: any) => r.type === "point",
                              ) ? (
                                <div className="ml-auto flex items-center gap-1">
                                  <span className="text-base font-medium text-black">
                                    +
                                    {(meeting?.event as any)?.rewards
                                      ?.find((r: any) => r.type === "point")
                                      ?.value?.toLocaleString() || 0}
                                  </span>
                                  <span className="text-base font-medium text-black">
                                    points
                                  </span>
                                  <Coin />
                                </div>
                              ) : (
                                <div></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-4">
                      <div className="text-center text-gray-500">У вас нет встреч</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Coin } from "~/components/Icons/Coin";
import { QuestCard } from "~/components/QuestCard";
import { conferencesData } from "~/config/conf";
import { kinoData } from "~/config/kino";
import { networkingData } from "~/config/networking";
import { partiesData } from "~/config/party";
import { questsData } from "~/config/quests";
import { usePlatform } from "~/hooks/usePlatform";
import { useTRPC } from "~/trpc/init/react";
export const Route = createFileRoute("/invite")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const { data: meetings } = useQuery(
    trpc.meetings.getMeetings.queryOptions({
      userId: Number(user?.id),
    }),
  );
  const inviteUsers = useMutation(
    trpc.meetings.inviteUsers.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.meetings.getMeetings.queryKey() });
      },
    }),
  );
  const search = useSearch({ from: "/invite" }) as { id: string; calendarDate: string };
  const navigate = useNavigate();
  const [type, setType] = useState<string>("Готовые");
  const [activeFilter, setActiveFilter] = useState<string>("Все");
  const filters = ["Все", "Кино", "Вечеринки", "Конференции", "Нетворкинг", "Квесты"];
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [typeOfEvent, setTypeOfEvent] = useState<string>("");
  const { data: participants } = useQuery(trpc.meetings.getParticipants.queryOptions());
  console.log(search, "search");
  console.log(Number(search.id), "Number(search.id)");

  const handleInvite = () => {
    inviteUsers.mutate({
      meetId: selectedItem.id,
      userIds: [Number(search.id)],
    });
    toast.success("Приглашение на встречу успешно отправлено!");
    navigate({
      to: "/my-meetings",
    });
  };

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

  console.log(search.calendarDate, "search.calendarDate");
  const isMobile = usePlatform();

  return (
    <div data-mobile={isMobile} className="flex flex-col data-[mobile=true]:pt-39">
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-10 flex items-center justify-center bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => window.history.back()}
          className="absolute left-4 flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-base font-bold text-gray-800">Куда вы хотите пригласить?</h1>
      </div>

      <div className="">
        <div className="scrollbar-hidden mb-4 flex w-full items-center gap-6 overflow-x-auto px-4">
          <button
            onClick={() => setType("Готовые")}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              type === "Готовые"
                ? "bg-black text-white"
                : "border-gray-200 bg-white text-black"
            }`}
          >
            Выбрать
          </button>
          <button
            onClick={() =>
              navigate({
                to: "/createMeet",
                search: { inviteId: Number(search.id) },
              })
            }
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              type === "Кастомные"
                ? "bg-black text-white"
                : "border-gray-200 bg-white text-black"
            }`}
          >
            Создать свою встречу
          </button>
          <button
            onClick={() => setType("Мои встречи")}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              type === "Мои встречи"
                ? "bg-black text-white"
                : "border-gray-200 bg-white text-black"
            }`}
          >
            Мои встречи
          </button>
        </div>
        {type === "Готовые" && (
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
                <div
                  key={index}
                  onClick={() => {
                    setSelectedItem(item);
                    setTypeOfEvent(item.category);
                    navigate({
                      to: "/createMeet",

                      search: {
                        step: 0,
                        isExtra: true,
                        isBasic: false,
                        typeOfEvent: item.category,
                        idOfEvent: item.id,
                        userId: search.id,
                        calendarDate: search.calendarDate,
                      },
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
        )}

        {type === "Мои встречи" && (
          <div className="flex flex-col gap-4">
            {meetings
              ?.sort(
                (a, b) =>
                  new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
              )
              .map((quest: any) => (
                <div key={quest?.id}>
                  <div className="px-4">
                    <QuestCard
                      quest={quest}
                      isNavigable={false}
                      isMeeting={true}
                      onClick={() => {
                        if (search.calendarDate && search.calendarDate !== "") {
                        } else {
                          setSelectedItem(quest);
                          handleInvite();
                        }
                      }}
                    />
                    <p className="mb-4 text-xs leading-4 text-black">
                      {(() => {
                        const description = quest?.isCustom
                          ? quest?.description
                          : quest?.event?.description;
                        return description && description.length > 100
                          ? description.slice(0, 100) + "..."
                          : description;
                      })()}
                    </p>
                    <div className="mb-6 flex items-center justify-between">
                      {quest?.event?.hasAchievement ? (
                        <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                          + Достижение
                        </span>
                      ) : (
                        <div></div>
                      )}
                      {(quest?.event as any)?.rewards?.find(
                        (r: any) => r.type === "point",
                      ) ? (
                        <div className="ml-auto flex items-center gap-1">
                          <span className="text-base font-medium text-black">
                            +
                            {(quest?.event as any)?.rewards
                              ?.find((r: any) => r.type === "point")
                              ?.value?.toLocaleString() || 0}
                          </span>

                          <span className="text-base font-medium text-black">points</span>
                          <Coin />
                        </div>
                      ) : (
                        <div></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

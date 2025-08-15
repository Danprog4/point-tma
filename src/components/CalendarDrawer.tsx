import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { conferencesData } from "~/config/conf";
import { kinoData } from "~/config/kino";
import { networkingData } from "~/config/networking";
import { partiesData } from "~/config/party";
import { questsData } from "~/config/quests";
import { Meet, User } from "~/db/schema";
import { EventsDrawer } from "~/EventsDrawer";
import { getAllEvents } from "~/lib/utils/getAllEvents";
import { getEventData } from "~/lib/utils/getEventData";
import { useTRPC } from "~/trpc/init/react";
import { Quest } from "~/types/quest";
import { Coin } from "./Icons/Coin";
import { MeetCard } from "./MeetCard";
import { QuestCard } from "./QuestCard";

export default function CalendarDrawer({
  open,
  onOpenChange,
  children,
  date,
  user,
  events,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  date: string;
  user: User;
  events: Array<{
    id: number;
    userId?: bigint | null;
    eventId?: bigint | null;
    meetId?: bigint | null;
    eventType?: string | null;
    date?: Date | null;
  }>;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const formatedDate = new Date(date);
  const day = formatedDate.getDate();
  const month = formatedDate.getMonth() + 1;
  const year = formatedDate.getFullYear();

  const formattedDate = `${day}.${month}.${year}`;

  const { data: meetings } = useQuery(
    trpc.meetings.getMeetings.queryOptions({
      userId: user.id,
    }),
  );

  const [isOpen, setIsOpen] = useState(false);

  const [activeFilter, setActiveFilter] = useState("Все");

  const { data, all } = getAllEvents(
    activeFilter,
    questsData,
    kinoData,
    conferencesData,
    networkingData,
    partiesData,
  );

  const addToCalendar = useMutation(
    trpc.main.addToCalendar.mutationOptions({
      onError: () => {
        toast.error("Не удалось добавить событие в календарь");
      },
    }),
  );

  const handleAddToCalendar = (event: any) => {
    addToCalendar.mutate({
      eventId: event.id,
      eventType: event.category,
      date: date,
    });

    queryClient.setQueryData(trpc.main.getCalendarEvents.queryKey(), (old: any) => {
      return [
        ...old,
        {
          eventId: event.id,
          eventType: event.category,
          date: date,
        },
      ];
    });

    toast.success("Событие успешно добавлено в календарь");
    setIsOpen(false);
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[80%] flex-col rounded-t-[16px] bg-white px-4 py-4">
          <header className="flex items-center justify-between pb-4">
            <ArrowLeft className="h-6 w-6 text-transparent" />
            <div className="text-xl font-bold">События на {formattedDate}</div>
            <button onClick={() => onOpenChange(false)}>
              <X className="h-6 w-6 text-gray-900" />
            </button>
          </header>
          {events && events.length > 0 ? (
            <div className="flex flex-1 flex-col items-start justify-start gap-4">
              {events.map((event) => {
                const isMeet = event.meetId;

                const eventData = isMeet
                  ? meetings?.find((meeting) => meeting.id === Number(event.meetId))
                  : getEventData(event.eventType!, Number(event.eventId!));

                return (
                  <div key={event.id}>
                    {isMeet ? (
                      <>
                        <MeetCard meet={eventData as Meet} />
                      </>
                    ) : (
                      <>
                        <QuestCard quest={eventData as Quest} />
                        <p className="mb-4 text-xs leading-4 text-black">
                          {(() => {
                            const description = eventData?.description;
                            return description && description.length > 100
                              ? description.slice(0, 100) + "..."
                              : description;
                          })()}
                        </p>
                        <div className="mb-6 flex items-center justify-between">
                          {(eventData as Quest)?.hasAchievement ? (
                            <div className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                              + Достижение
                            </div>
                          ) : (
                            <div></div>
                          )}
                          {(eventData as Quest)?.rewards?.find(
                            (r: any) => r.type === "point",
                          ) ? (
                            <div className="ml-auto flex items-center gap-1">
                              <span className="text-base font-medium text-black">
                                +
                                {(eventData as Quest)?.rewards
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
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <div className="text-center text-gray-500">
                У вас нет событий на это число
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setIsOpen(true);
                  }}
                  className="rounded-lg px-4 py-3 font-medium text-black"
                >
                  Найти событие
                </button>
                <button
                  onClick={() =>
                    navigate({
                      to: "/invite",
                      search: { id: user?.id!.toString()!, calendarDate: date },
                    })
                  }
                  className="rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-4 py-3 font-medium text-white"
                >
                  Выбрать встречу
                </button>
              </div>
            </div>
          )}
          {isOpen && (
            <EventsDrawer
              open={isOpen}
              onOpenChange={setIsOpen}
              data={data}
              setActiveFilter={setActiveFilter}
              activeFilter={activeFilter}
              handleAddToCalendar={handleAddToCalendar}
            />
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

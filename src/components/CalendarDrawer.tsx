import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";

import { Meet, User } from "~/db/schema";
import { EventsDrawer } from "~/EventsDrawer";

import { useTRPC } from "~/trpc/init/react";
import { Quest } from "~/types/quest";
import { Coin } from "./Icons/Coin";
import { MeetCard } from "./MeetCard";
import { MeetsDrawer } from "./MeetsDrawer";
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
    isTicket?: boolean;
    isPlanned?: boolean;
  }>;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const formatedDate = new Date(date);
  const day = formatedDate.getDate();
  const month = formatedDate.getMonth() + 1;
  const year = formatedDate.getFullYear();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const formattedDate = `${day}.${month}.${year}`;

  const { data: meetings } = useQuery(
    trpc.meetings.getMeetings.queryOptions({
      userId: user.id,
    }),
  );

  const [isOpen, setIsOpen] = useState(false);

  const [activeFilter, setActiveFilter] = useState("Все");

  const { data: questsData } = useQuery(trpc.event.getEvents.queryOptions());

  const addToCalendar = useMutation(
    trpc.main.addToCalendar.mutationOptions({
      onError: () => {
        toast.error("Не удалось добавить событие в календарь");
      },
    }),
  );

  const handleAddToCalendar = (event: any, isMeeting?: boolean) => {
    if (isMeeting) {
      addToCalendar.mutate({
        meetId: event.id,
        date: date,
      });

      queryClient.setQueryData(trpc.main.getCalendarEvents.queryKey(), (old: any) => {
        return [
          ...old,
          {
            meetId: event.id,
            userId: user.id,
            date: date,
          },
        ];
      });
    } else {
      addToCalendar.mutate({
        eventId: event.id,
        eventType: event.category,
        date: date,
        isPlanned: true,
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
    }

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
                  : questsData?.find(
                      (q) =>
                        q.id === Number(event.eventId) && q.category === event.eventType,
                    );

                console.log(event.isPlanned);

                return (
                  <div key={event.id}>
                    {isMeet ? (
                      <>
                        <MeetCard meet={eventData as Meet} />
                      </>
                    ) : (
                      <>
                        <QuestCard quest={eventData as Quest} />
                        <p className="pt-2 pb-2 text-xs leading-4 text-black">
                          {(() => {
                            const description = eventData?.description;
                            return description && description.length > 100
                              ? description.slice(0, 100) + "..."
                              : description;
                          })()}
                        </p>
                        <div className="mb-2 flex items-center justify-start">
                          {!event.isTicket &&
                          !event.isPlanned &&
                          (eventData as Quest)?.hasAchievement ? (
                            <div className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                              Достижение
                            </div>
                          ) : (
                            <div></div>
                          )}
                          {!event.isTicket &&
                          !event.isPlanned &&
                          (eventData as Quest)?.rewards?.find(
                            (r: any) => r.type === "point",
                          ) ? (
                            <div className="ml-auto flex items-center gap-1">
                              <span className="text-base font-medium text-black">
                                +
                                {(!event.isTicket &&
                                  !event.isPlanned &&
                                  (eventData as Quest)?.rewards
                                    ?.find((r: any) => r.type === "point")
                                    ?.value?.toLocaleString()) ||
                                  0}
                              </span>
                              <span className="text-base font-medium text-black">
                                points
                              </span>
                              <Coin />
                            </div>
                          ) : (
                            <div></div>
                          )}
                          <div className="flex items-center justify-center gap-2">
                            {event.isTicket && (
                              <div className="font-bold text-black">
                                У вас имеется неактивированный билет на это событие
                              </div>
                            )}
                            {event.isPlanned && (
                              <div className="font-bold text-black">
                                Вы запланировали посещение этого события
                              </div>
                            )}
                          </div>
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
                  onClick={() => setIsInviteOpen(true)}
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
              data={questsData || []}
              setActiveFilter={setActiveFilter}
              activeFilter={activeFilter}
              handleAddToCalendar={handleAddToCalendar}
            />
          )}
          {isInviteOpen && (
            <MeetsDrawer
              open={isInviteOpen}
              onOpenChange={setIsInviteOpen}
              meetings={meetings || []}
              handleAddToCalendar={handleAddToCalendar}
              userId={user.id.toString()}
              calendarDate={date}
            />
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

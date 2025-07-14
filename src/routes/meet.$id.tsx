import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { useScroll } from "~/components/hooks/useScroll";
import { Coin } from "~/components/Icons/Coin";
import { QuestCard } from "~/components/QuestCard";
import { fakeUsers } from "~/config/fakeUsers";
import { meetingsConfig } from "~/config/meetings";
import { cn } from "~/lib/utils/cn";
import { getEventData } from "~/lib/utils/getEventData";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
import { Quest } from "~/types/quest";

export const Route = createFileRoute("/meet/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
  const [page, setPage] = useState("info");
  const [isClicked, setIsClicked] = useState(false);
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const { data: userSubscriptions } = useQuery(
    trpc.main.getUserSubscriptions.queryOptions(),
  );

  const { data: meetingsData } = useQuery(trpc.meetings.getMeetings.queryOptions());
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());

  const meetingsWithEvents = meetingsData?.map((meeting) => {
    const organizer = users?.find((u) => u.id === meeting.userId);
    const event = getEventData(meeting.typeOfEvent!, meeting.idOfEvent!);
    return {
      ...meeting,
      organizer,
      event,
    };
  });

  console.log(meetingsWithEvents, "meetingsWithEvents");

  const isUserMeeting = useMemo(() => {
    return meetingsWithEvents?.some((m) => m.id === parseInt(id));
  }, [meetingsWithEvents, user?.id]);

  console.log(isUserMeeting, "isUserMeeting");

  const meeting = isUserMeeting
    ? meetingsWithEvents?.find((m) => m.id === parseInt(id))
    : meetingsConfig.find((m) => m.id === parseInt(id));

  console.log(meeting, "meeting");

  const organizer = isUserMeeting
    ? meetingsWithEvents?.find((m) => m.id === meeting?.id)?.organizer
    : fakeUsers.find((u) => u.meetings.includes(meeting?.id!));

  console.log(organizer, "organizer");

  const sendRequest = useMutation(trpc.friends.sendRequest.mutationOptions());
  const unSendRequest = useMutation(trpc.friends.unSendRequest.mutationOptions());
  const { data: userRequests } = useQuery(trpc.main.getMyRequests.queryOptions());

  const isRequest = useMemo(() => {
    return userRequests?.some((f) => f.toUserId === organizer?.id);
  }, [userRequests, organizer?.id]);

  const subscribe = useMutation(trpc.main.subscribe.mutationOptions());
  const unsubscribe = useMutation(trpc.main.unSubscribe.mutationOptions());

  const joinMeeting = useMutation(trpc.meetings.joinMeeting.mutationOptions());
  const leaveMeeting = useMutation(trpc.meetings.leaveMeeting.mutationOptions());
  const { data: userParticipants } = useQuery(
    trpc.meetings.getParticipants.queryOptions(),
  );

  const isJoined = useMemo(() => {
    return userParticipants?.some(
      (p) => p.meetId === meeting?.id && p.fromUserId === user?.id,
    );
  }, [userParticipants, meeting?.id, user?.id]);

  const addToFavorites = useMutation(trpc.main.addToFavorites.mutationOptions());
  const removeFromFavorites = useMutation(
    trpc.main.removeFromFavorites.mutationOptions(),
  );
  const { data: userFavorites } = useQuery(trpc.main.getUserFavorites.queryOptions());

  const handleSendRequest = () => {
    if (isRequest) {
      unSendRequest.mutate({ userId: organizer?.id! });
      queryClient.setQueryData(trpc.main.getMyRequests.queryKey(), (old: any) => {
        return old.filter((f: any) => f.toUserId !== organizer?.id);
      });
    } else {
      sendRequest.mutate({ userId: organizer?.id! });
      queryClient.setQueryData(trpc.main.getMyRequests.queryKey(), (old: any) => {
        return [...(old || []), { fromUserId: user?.id!, toUserId: organizer?.id! }];
      });
    }
  };

  const handleSubscribe = () => {
    if (isSubscribed) {
      unsubscribe.mutate({ userId: organizer?.id! });
      queryClient.setQueryData(trpc.main.getUserSubscriptions.queryKey(), (old: any) => {
        return old.filter((s: any) => s.targetUserId !== organizer?.id);
      });
    } else {
      subscribe.mutate({ userId: organizer?.id! });
      queryClient.setQueryData(trpc.main.getUserSubscriptions.queryKey(), (old: any) => {
        return [
          ...(old || []),
          { subscriberId: user?.id!, targetUserId: organizer?.id! },
        ];
      });
    }
  };

  const isFavorite = useMemo(() => {
    return userFavorites?.some(
      (f) => f.toUserId === organizer?.id && f.fromUserId === user?.id,
    );
  }, [userFavorites, organizer?.id]);

  const handleToFavorites = () => {
    if (isFavorite) {
      removeFromFavorites.mutate({ userId: organizer?.id! });
      queryClient.setQueryData(trpc.main.getUserFavorites.queryKey(), (old: any) => {
        return old.filter((f: any) => f.toUserId !== organizer?.id);
      });
    } else {
      addToFavorites.mutate({ userId: organizer?.id! });
      queryClient.setQueryData(trpc.main.getUserFavorites.queryKey(), (old: any) => {
        return [...(old || []), { fromUserId: user?.id!, toUserId: organizer?.id! }];
      });
    }
  };

  const isSubscribed = useMemo(() => {
    return userSubscriptions?.some(
      (s) => s.targetUserId === organizer?.id && s.subscriberId === user?.id,
    );
  }, [userSubscriptions, organizer?.id]);

  const isParticipant = useMemo(() => {
    return userParticipants?.some(
      (p) => p.meetId === meeting?.id && p.fromUserId === user?.id,
    );
  }, [userParticipants, meeting?.id, user?.id]);

  // @ts-ignore
  const eventType = isUserMeeting ? meeting?.typeOfEvent : meeting?.type;
  // @ts-ignore
  const eventId = isUserMeeting ? meeting?.idOfEvent : meeting?.id;
  const event = getEventData(eventType ?? "", eventId ?? 0);
  console.log(event, "event");

  const age = new Date().getFullYear() - new Date(organizer?.birthday!).getFullYear();

  const isOwner = useMemo(() => {
    return organizer?.id === user?.id;
  }, [organizer?.id, user?.id]);

  console.log(isOwner, "isOwner");

  const handleJoin = () => {
    if (!isClicked) {
      setIsClicked(true);
      return;
    }

    if (isOwner) {
      return;
    }

    if (isJoined) {
      leaveMeeting.mutate({ id: meeting?.id! });
      queryClient.setQueryData(trpc.meetings.getParticipants.queryKey(), (old: any) => {
        return old.filter((p: any) => p.meetId !== meeting?.id);
      });
    } else {
      joinMeeting.mutate({ id: meeting?.id! });
      queryClient.setQueryData(trpc.meetings.getParticipants.queryKey(), (old: any) => {
        return [...(old || []), { fromUserId: user?.id!, meetId: meeting?.id! }];
      });
    }
  };

  console.log(event);
  return (
    <>
      {isClicked ? (
        <div className="overflow-y-auto pt-18 pb-24">
          <div className="fixed top-0 left-0 z-10 flex w-full items-center justify-center bg-white">
            <div className="relative flex w-full max-w-md items-center justify-between px-4 py-3">
              <button
                onClick={() => window.history.back()}
                className="flex h-6 w-6 items-center justify-center"
              >
                <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
              </button>
              <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-800">
                {event?.category}
              </h1>
              <div className="flex h-6 w-6" />
            </div>
          </div>
          <div className="relative">
            <img
              src={event?.image}
              alt={event?.title}
              className="h-[30vh] w-full rounded-t-xl object-cover"
            />
            <div className="absolute bottom-4 left-4 flex flex-col gap-2 text-white">
              <div className="text-2xl font-bold">{event?.title}</div>
              <div className="flex items-center justify-start gap-2">
                <div className="flex items-center justify-center rounded-full bg-black/25 px-2">
                  {event?.type}
                </div>
                <div className="flex items-center justify-center rounded-full bg-[#2462FF] px-2">
                  {event?.category}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-4 px-4 pt-4">
            <button
              className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
                page === "info" ? "bg-black text-white" : "bg-white text-black"
              }`}
              onClick={() => setPage("info")}
            >
              Информация
            </button>
            <button
              className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
                page === "participants" ? "bg-black text-white" : "bg-white text-black"
              }`}
              onClick={() => setPage("participants")}
            >
              Участники
            </button>
          </div>
          {page === "info" ? (
            <>
              <div className="flex flex-col gap-2 px-4 py-4">
                <div className="text-2xl font-bold">Описание</div>
                <div>
                  {event?.description.split(/\n{2,}/).map((paragraph, idx) => (
                    <p key={idx} className="mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 px-4 py-4">
                <div className="text-2xl font-bold">Локация</div>
                <div>{event?.location}</div>
              </div>
              <div className="flex flex-col gap-2 px-4 py-4">
                <div className="text-2xl font-bold">Организатор</div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200">
                    <img
                      src={getImageUrl(organizer?.photoUrl || "")}
                      alt={organizer?.name || ""}
                      className="h-10 w-10"
                    />
                  </div>
                  <div>
                    {organizer?.name} {organizer?.surname}
                  </div>
                </div>
              </div>
              {event?.stages && event?.stages.length > 0 ? (
                <div className="flex flex-col gap-4 px-4 py-4">
                  <div className="text-2xl font-bold">Этапы квеста</div>
                  <div className="relative">
                    {event?.stages.map((stage, idx) => (
                      <div key={idx} className="flex items-start gap-4 pb-4 last:pb-0">
                        <div className="relative flex w-8 flex-none items-start justify-center">
                          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 font-bold text-black">
                            {idx + 1}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-black">{stage.title}</div>
                          <div className="text-sm text-black/80">{stage.desc}</div>
                        </div>
                      </div>
                    ))}
                    <div className="absolute top-8 bottom-4 left-4 w-px -translate-x-1/2 bg-gray-300" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-4 py-4">
                  {event?.quests?.map((quest) => (
                    <>
                      <QuestCard key={quest.id} quest={quest as any} isNavigable={true} />
                      {event?.description.slice(0, 100)}
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center justify-center rounded-full bg-[#DEB8FF] px-3 text-black">
                          + Достижение
                        </div>
                        <div className="flex items-center gap-1">
                          + {event?.reward} points <Coin />
                        </div>
                      </div>
                    </>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2 px-4 py-4">
                <div className="text-2xl font-bold">Расписание</div>
                <div className="text-l font-bold">{event?.date}</div>
              </div>
              <div className="flex flex-col justify-center gap-2 px-4 py-4">
                <div className="flex items-center justify-start text-2xl font-bold">
                  <div className="text-2xl font-bold">Награда </div>
                  <div className="text-l pl-2 font-bold">+ {event?.reward}</div>
                  <Coin />
                </div>

                <div>За успешное выполнение квеста</div>
                <div className="flex gap-2">
                  <div className="flex h-25 w-25 flex-col items-center justify-center rounded-lg bg-blue-200">
                    <img src="/shit.png" alt="coin" className="h-10 w-10" />
                    <span className="mt-1 text-sm">Кепка BUCS</span>
                  </div>
                  <div className="flex h-25 w-25 flex-col items-center justify-center rounded-lg bg-red-200">
                    <img src="/cap.png" alt="coin" className="h-10 w-10" />
                    <span className="mt-1 text-sm">Любитель к...</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 px-4 py-4">
                <div className="text-2xl font-bold">Достижение</div>
                <div>+1 Активный участник</div>
              </div>
            </>
          ) : (
            <div className="flex flex-col">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                      <div className="flex flex-col">
                        <div className="text-lg font-bold">Сергей</div>
                        <div className="text-sm text-gray-500">участник</div>
                      </div>
                    </div>
                  </div>

                  <div className="h-0.5 w-full bg-gray-200"></div>
                </div>
              ))}
            </div>
          )}
          <div className="fixed right-0 bottom-0 left-0 flex items-center justify-center gap-10 bg-white px-4 py-4">
            <div className="rounded-2xl px-4 py-2" onClick={() => setIsClicked(false)}>
              Отказать
            </div>
            <div
              className="rounded-2xl bg-[#9924FF] px-4 py-2 text-white"
              onClick={() => handleJoin()}
            >
              {isParticipant
                ? "Отменить"
                : isOwner
                  ? "Вы - организатор"
                  : "Присоединиться"}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto pt-14 pb-10">
          <header className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between bg-white p-4">
            <ArrowLeft
              className="absolute left-4 h-6 w-6"
              onClick={() => window.history.back()}
            />
            <div className="flex flex-1 justify-center text-xl font-bold">Встреча</div>
          </header>
          <div className="flex flex-col p-4">
            <QuestCard quest={event as Quest} />
            {event?.description}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center justify-center rounded-full bg-[#DEB8FF] px-3 text-black">
                + Достижение
              </div>
              <div className="flex items-center gap-1">
                + {event?.reward} points <Coin />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-6 text-white">
              <div
                onClick={() => handleJoin()}
                className="flex flex-1 items-center justify-center rounded-tl-2xl rounded-tr-lg rounded-br-2xl rounded-bl-lg bg-[#9924FF] px-3 py-3"
              >
                {isParticipant
                  ? "Отменить"
                  : isOwner
                    ? "Вы - организатор"
                    : "Присоединиться"}
              </div>
            </div>
          </div>
          <div className="mb-4 px-4 text-2xl font-bold">Организатор</div>
          <div className="relative">
            <div className="relative h-[30vh] rounded-t-2xl bg-gradient-to-br from-purple-400 to-pink-300">
              {/* Level Badge */}
              <div className="absolute bottom-4 left-4">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-purple-800 bg-purple-600">
                    <span className="text-xl font-bold text-white">1</span>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 transform">
                    <div className="rounded bg-purple-600 px-2 py-1 text-xs font-bold text-white">
                      Уровень
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-4 right-4">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50"
                  onClick={() => handleToFavorites()}
                >
                  <Heart
                    className={cn("h-4 w-4 text-black", isFavorite && "text-red-500")}
                  />
                </button>
              </div>
            </div>
          </div>
          <div
            className="mt-2 flex flex-col items-center justify-center"
            onClick={() =>
              navigate({
                to: "/user-profile/$id",
                params: { id: organizer?.id!.toString()! },
              })
            }
          >
            <div className="text-2xl font-bold">
              {organizer?.name} {organizer?.surname}
            </div>
            <div className="text-sm text-gray-500">
              {organizer?.city}, {organizer?.birthday}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-white">
            <div
              className="rounded-2xl bg-[#2462FF] px-4 py-2"
              onClick={() => handleSubscribe()}
            >
              {isSubscribed ? "Отписаться" : "Подписаться"}
            </div>
            <div
              className="rounded-2xl bg-[#9924FF] px-4 py-2"
              onClick={() => handleSendRequest()}
            >
              {isRequest ? "Отменить запрос" : "Добавить в друзья"}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 px-4">
            <div className="text-2xl font-bold">Интересы</div>
            <div className="text-sm text-gray-500">{organizer?.bio}</div>
          </div>
          <div className="mt-4 flex flex-col gap-2 px-4">
            <div className="text-2xl font-bold">Достижения</div>
            <div className="text-sm text-gray-500">
              У этого пользователя нет достижений
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 pl-4">
            <div className="text-2xl font-bold">Навыки</div>
            <div className="flex w-full gap-2 overflow-x-auto pb-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[20vh] w-[40vw] flex-shrink-0 rounded-2xl bg-[#A3FFCD]"
                ></div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 px-4">
            <div className="text-2xl font-bold">Инвентарь</div>
            <div className="text-sm text-gray-500">
              Инвентарь этого пользователя пока пуст
            </div>
          </div>
        </div>
      )}
    </>
  );
}

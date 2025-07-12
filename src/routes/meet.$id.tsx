import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Heart } from "lucide-react";
import { useMemo } from "react";
import { useScroll } from "~/components/hooks/useScroll";
import { Coin } from "~/components/Icons/Coin";
import { QuestCard } from "~/components/QuestCard";
import { meetingsConfig } from "~/config/meetings";
import { cn } from "~/lib/utils/cn";
import { getEventData } from "~/lib/utils/getEventData";
import { useTRPC } from "~/trpc/init/react";
export const Route = createFileRoute("/meet/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
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
    return meetingsWithEvents?.some(
      (m) => m.id === parseInt(id) && m.userId === user?.id,
    );
  }, [meetingsWithEvents, user?.id]);

  console.log(isUserMeeting, "isUserMeeting");

  const meeting = isUserMeeting
    ? meetingsWithEvents?.find((m) => m.id === parseInt(id))
    : meetingsConfig.find((m) => m.id === parseInt(id));

  console.log(meeting, "meeting");

  const organizer = isUserMeeting
    ? user
    : meetingsWithEvents?.find((m) => m.id === meeting?.id)?.organizer;

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
    <div className="flex h-full flex-col overflow-y-auto pt-14 pb-10">
      <header className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between bg-white p-4">
        <ArrowLeft
          className="absolute left-4 h-6 w-6"
          onClick={() => window.history.back()}
        />
        <div className="flex flex-1 justify-center text-xl font-bold">Встреча</div>
      </header>
      <div className="flex flex-col p-4">
        <QuestCard quest={event!} />
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
          <div className="p-3 text-black">Отказать</div>
          <div
            onClick={() => handleJoin()}
            className="flex flex-1 items-center justify-center rounded-tl-2xl rounded-tr-lg rounded-br-2xl rounded-bl-lg bg-[#9924FF] px-3 py-3"
          >
            {isParticipant ? "Покинуть" : "Присоединиться"}
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
              <Heart className={cn("h-4 w-4 text-black", isFavorite && "text-red-500")} />
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
        <div className="text-sm text-gray-500">У этого пользователя нет достижений</div>
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
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  Brain,
  Briefcase,
  Calendar1,
  Dumbbell,
  Flag,
  Heart,
  Mars,
  Star,
  Users,
  Venus,
} from "lucide-react";
import { useMemo, useState } from "react";
import PullToRefresh from "react-simple-pull-to-refresh";
import { ComplaintDrawer } from "~/components/ComplaintDrawer";
import { FullScreenPhoto } from "~/components/FullScreenPhoto";
import { useScroll } from "~/components/hooks/useScroll";
import { LevelInfoModal } from "~/components/LevelInfoModal";
import { ProfileMore } from "~/components/ProfileMore";
import { UserFriends } from "~/components/UserFriends";
import { UserSubscribers } from "~/components/UserSubscribers";
import { levelsConfig } from "~/config/levels";
import { usePeopleComplaints } from "~/hooks/usePeopleComplaints";
import { usePlatform } from "~/hooks/usePlatform";
import { useSwipeableGallery } from "~/hooks/useSwipeableGallery";
import { cn } from "~/lib/utils/cn";
import { getImage } from "~/lib/utils/getImage";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { getUserAge } from "~/lib/utils/getUserAge";
import { getInterestLabel } from "~/lib/utils/interestLabels";
import { useTRPC } from "~/trpc/init/react";
export const Route = createFileRoute("/user-profile/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
  const queryClient = useQueryClient();
  const isMobile = usePlatform();
  const [isFriendsPage, setIsFriendsPage] = useState(false);
  const [isSubscribersPage, setIsSubscribersPage] = useState(false);
  const [isMore, setIsMore] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const { state } = useRouterState({ select: (s) => s.location });
  const trpc = useTRPC();
  const { id } = Route.useParams();
  const { data: me } = useQuery(trpc.main.getUser.queryOptions());
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const user = users?.find((user) => user.id === Number(id));

  const [isClicked, setIsClicked] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const { data: userMeetings } = useQuery(
    trpc.meetings.getMeetings.queryOptions({ userId: Number(id) }),
  );

  const allPhotos = useMemo(() => {
    return [user?.photo, ...(user?.gallery ?? [])].filter(Boolean) as string[];
  }, [user]);

  const {
    currentIndex,
    setCurrentIndex,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    didSwipe,
  } = useSwipeableGallery(allPhotos);

  const { data: userSubscribers } = useQuery(
    trpc.main.getUserSubscribers.queryOptions({ userId: user?.id }),
  );

  const sendRequest = useMutation(trpc.friends.sendRequest.mutationOptions());
  const unSendRequest = useMutation(trpc.friends.unSendRequest.mutationOptions());
  const { data: userRequests } = useQuery(trpc.main.getMyRequests.queryOptions());

  const unFriend = useMutation(trpc.friends.unFriend.mutationOptions());

  const isRequest = useMemo(() => {
    return userRequests?.some((f) => f.toUserId === user?.id);
  }, [userRequests, user?.id]);

  const { data: events } = useQuery(
    trpc.event.getUserEvents.queryOptions({ userId: user?.id! }),
  );

  const activeQuests = useMemo(() => {
    return events?.filter((event) => event.type === "Квест") || [];
  }, [events]);

  const subscribe = useMutation(trpc.main.subscribe.mutationOptions());
  const unsubscribe = useMutation(trpc.main.unSubscribe.mutationOptions());

  const addToFavorites = useMutation(trpc.main.addToFavorites.mutationOptions());
  const removeFromFavorites = useMutation(
    trpc.main.removeFromFavorites.mutationOptions(),
  );
  const { data: userFavorites } = useQuery(trpc.main.getUserFavorites.queryOptions());

  const { data: friends } = useQuery(
    trpc.friends.getFriends.queryOptions({ userId: user?.id }),
  );

  const isFriend = useMemo(() => {
    return friends?.some(
      (f) =>
        (f.fromUserId === user?.id && f.toUserId === me?.id) ||
        (f.toUserId === user?.id && f.fromUserId === me?.id),
    );
  }, [friends, user?.id, me?.id]);

  const uniqueFriends = useMemo(() => {
    if (!friends || !user?.id) return [];
    const seen = new Set<number>();
    return friends
      .filter((r) => r.status === "accepted")
      .filter((r) => {
        const counterpartId = r.fromUserId === user?.id ? r.toUserId : r.fromUserId;
        if (counterpartId == null) return false;
        if (seen.has(counterpartId)) return false;
        seen.add(counterpartId);
        return true;
      });
  }, [friends, user?.id]);

  const handleSendRequest = () => {
    if (isRequest) {
      unSendRequest.mutate({ userId: user?.id! });
      queryClient.setQueryData(trpc.main.getMyRequests.queryKey(), (old: any) => {
        return old.filter((f: any) => f.toUserId !== user?.id);
      });
    } else {
      sendRequest.mutate({ userId: user?.id! });
      queryClient.setQueryData(trpc.main.getMyRequests.queryKey(), (old: any) => {
        return [...(old || []), { fromUserId: user?.id!, toUserId: user?.id! }];
      });
    }
  };

  const handleSubscribe = () => {
    if (isSubscribed) {
      unsubscribe.mutate({ userId: user?.id! });
      queryClient.setQueryData(trpc.main.getUserSubscribers.queryKey(), (old: any) => {
        return old.filter((s: any) => s.targetUserId !== user?.id);
      });
    } else {
      subscribe.mutate({ userId: user?.id! });
      queryClient.setQueryData(trpc.main.getUserSubscribers.queryKey(), (old: any) => {
        return [...(old || []), { subscriberId: user?.id!, targetUserId: user?.id! }];
      });
    }
  };

  const isFavorite = useMemo(() => {
    return userFavorites?.some(
      (f) => f.toUserId === user?.id && f.fromUserId === user?.id,
    );
  }, [userFavorites, user?.id]);

  const handleToFavorites = () => {
    if (isFavorite) {
      removeFromFavorites.mutate({ userId: user?.id!, type: "user" });
      queryClient.setQueryData(trpc.main.getUserFavorites.queryKey(), (old: any) => {
        return old.filter((f: any) => f.toUserId !== user?.id);
      });
    } else {
      addToFavorites.mutate({ userId: user?.id!, type: "user" });
      queryClient.setQueryData(trpc.main.getUserFavorites.queryKey(), (old: any) => {
        return [
          ...(old || []),
          { fromUserId: user?.id!, toUserId: user?.id!, type: "user" },
        ];
      });
    }
  };

  const isPhotoFavorite = useMemo(
    () => (photo: string | undefined) => {
      return userFavorites?.some((f) => f.type === "photo" && f.photo === photo);
    },
    [userFavorites],
  );

  const handlePhotoToFavorites = ({ photo }: { photo: string }) => {
    if (isPhotoFavorite(photo)) {
      removeFromFavorites.mutate({ userId: user?.id!, type: "photo", photo });
      queryClient.setQueryData(trpc.main.getUserFavorites.queryKey(), (old: any) => {
        return old.filter((f: any) => f.photo !== photo);
      });
    } else {
      addToFavorites.mutate({ userId: user?.id!, type: "photo", photo });
      queryClient.setQueryData(trpc.main.getUserFavorites.queryKey(), (old: any) => {
        return [
          ...(old || []),
          { fromUserId: user?.id!, toUserId: user?.id!, photo, type: "photo" },
        ];
      });
    }
  };

  const isSubscribed = useMemo(() => {
    return userSubscribers?.some(
      (s) => s.targetUserId === user?.id && s.subscriberId === user?.id,
    );
  }, [userSubscribers, user?.id]);

  const age = getUserAge(user?.birthday || "");

  const isOwner = useMemo(() => {
    return me?.id === user?.id;
  }, [me?.id, user?.id]);

  const handleRemoveFriend = () => {
    unFriend.mutate({ userId: user?.id! });
    // Optimistically update cache
    queryClient.setQueryData(trpc.friends.getFriends.queryKey(), (old: any) => {
      return (old || []).filter((f: any) => {
        return !(
          (f.fromUserId === user?.id && f.toUserId === me?.id) ||
          (f.toUserId === user?.id && f.fromUserId === me?.id)
        );
      });
    });

    queryClient.setQueryData(trpc.main.getMyRequests.queryKey(), (old: any) => {
      return old.filter((f: any) => {
        return !(
          (f.fromUserId === user?.id && f.toUserId === me?.id) ||
          (f.toUserId === user?.id && f.fromUserId === me?.id)
        );
      });
    });
  };

  console.log(userSubscribers, "userSubscribers");

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.main.getUsers.queryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.meetings.getMeetings.queryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.main.getUserSubscribers.queryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.friends.getFriends.queryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.main.getMyRequests.queryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.event.getUserEvents.queryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.main.getUserFavorites.queryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.main.getComplaints.queryKey(),
    });
  };

  const { data: complaints } = useQuery(trpc.main.getComplaints.queryOptions());

  const {
    isComplaintOpen,
    setIsComplaintOpen,
    complaint,
    setComplaint,
    openComplaintDrawer,
    handleSubmitComplaint,
  } = usePeopleComplaints(me);

  const isUserComplained = useMemo(() => {
    return Boolean(complaints?.some((c) => c.type === "user" && c.toUserId === user?.id));
  }, [complaints, user?.id]);

  const handleComplaintAction = () => {
    if (!user?.id) return;
    openComplaintDrawer(user.id, isUserComplained);
  };

  return (
    <div>
      {isFriendsPage ? (
        <UserFriends
          viewedUser={user}
          users={users}
          setIsFriendsPage={setIsFriendsPage}
        />
      ) : isSubscribersPage ? (
        <UserSubscribers viewedUser={user} setIsSubscribersPage={setIsSubscribersPage} />
      ) : (
        <div
          data-mobile={isMobile}
          className="min-h-screen bg-gray-50/50 pb-8 text-black"
        >
          {/* Fixed Header */}
          <div
            data-mobile={isMobile}
            className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-4 backdrop-blur-xl data-[mobile=true]:pt-14"
          >
            <button
              onClick={() => (isMore ? setIsMore(false) : window.history.back())}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:bg-gray-100 active:scale-90"
            >
              <ArrowLeft className="h-6 w-6 text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">
              {isMore ? `Об ${user?.name} ${user?.surname}` : "Профиль"}
            </h1>
            <div className="flex w-10 items-center justify-center">
              {!isOwner && !isMore && (
                <button
                  onClick={handleComplaintAction}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90",
                    isUserComplained
                      ? "bg-red-50 text-red-500"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
                  )}
                >
                  <Flag
                    className="h-5 w-5"
                    fill={isUserComplained ? "currentColor" : "none"}
                  />
                </button>
              )}
            </div>
          </div>

          <div data-mobile={isMobile} className="h-full pt-20 data-[mobile=true]:pt-32">
            <PullToRefresh onRefresh={handleRefresh} className={cn("min-h-screen")}>
              {!isMore ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
                      <div
                        className="relative h-96 w-full touch-pan-y"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                        <img
                          src={getImage(user as any, allPhotos[currentIndex] || "")}
                          alt={user?.name || ""}
                          className="h-full w-full object-cover transition-transform duration-500 active:scale-105"
                          onClick={() => {
                            if (didSwipe.current) return;
                            setIsClicked(!isClicked);
                            setIsFullScreen(true);
                          }}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {allPhotos.length > 1 && (
                          <div className="absolute bottom-15 left-1/2 z-20 flex -translate-x-1/2 gap-1">
                            {allPhotos.map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "h-1 rounded-full transition-all duration-300",
                                  i === currentIndex ? "w-6 bg-white" : "w-2 bg-white/40",
                                )}
                              />
                            ))}
                          </div>
                        )}

                        <div className="absolute right-0 bottom-5 left-0 px-4">
                          <div className="scrollbar-hidden flex gap-2 overflow-x-auto py-2">
                            {allPhotos.map((img, idx) => {
                              if (idx === currentIndex) return null;
                              return (
                                <img
                                  key={idx}
                                  src={
                                    img.startsWith("data:image/")
                                      ? img
                                      : getImageUrl(img || "")
                                  }
                                  alt=""
                                  className="h-14 w-14 flex-shrink-0 cursor-pointer rounded-xl border-2 border-white/20 object-cover shadow-sm transition-transform active:scale-90"
                                  onClick={() => setCurrentIndex(idx)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative -mt-6 px-5 pb-6">
                    <div className="relative z-10 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative -mt-12">
                          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white p-1 shadow-lg ring-1 ring-gray-100">
                            {(() => {
                              if (!user?.level || user.xp == null) {
                                return (
                                  <div className="flex h-full w-full items-center justify-center rounded-full bg-violet-600 text-2xl font-bold text-white">
                                    {user?.level}
                                  </div>
                                );
                              }
                              const currentLevelIdx = Math.max(
                                0,
                                levelsConfig.findIndex((l) => l.level === user.level),
                              );
                              const currentLevel = levelsConfig[currentLevelIdx];
                              const nextLevel = levelsConfig[currentLevelIdx + 1];
                              const xpToNext = nextLevel
                                ? nextLevel.xpToNextLevel
                                : currentLevel.xpToNextLevel;
                              const progress =
                                nextLevel && xpToNext
                                  ? Math.min(1, user.xp / xpToNext)
                                  : 1;

                              const size = 88;
                              const strokeWidth = 6;
                              const radius = (size - strokeWidth) / 2;
                              const circumference = 2 * Math.PI * radius;
                              const offset = circumference * (1 - progress);

                              return (
                                <div
                                  className="relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-full transition-transform active:scale-95"
                                  onClick={() => setIsLevelModalOpen(true)}
                                >
                                  <svg
                                    width={size}
                                    height={size}
                                    className="-rotate-90 transform"
                                  >
                                    <circle
                                      cx={size / 2}
                                      cy={size / 2}
                                      r={radius}
                                      stroke="#F3F4F6"
                                      strokeWidth={strokeWidth}
                                      fill="white"
                                    />
                                    <circle
                                      cx={size / 2}
                                      cy={size / 2}
                                      r={radius}
                                      stroke="#7C3AED"
                                      strokeWidth={strokeWidth}
                                      fill="none"
                                      strokeDasharray={circumference}
                                      strokeDashoffset={offset}
                                      strokeLinecap="round"
                                      className="transition-all duration-1000 ease-out"
                                    />
                                  </svg>
                                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-900">
                                    {user.level}
                                  </span>
                                </div>
                              );
                            })()}
                            <div className="absolute -bottom-2 rounded-full bg-yellow-400 p-1 shadow-sm ring-2 ring-white">
                              <Star className="h-4 w-4 fill-white text-white" />
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <h2 className="text-2xl font-bold text-gray-900">
                            {user?.name} {user?.surname}
                          </h2>
                          <div className="mt-1 flex items-center justify-center gap-2 text-sm font-medium text-gray-500">
                            <span>г. {user?.city}</span>
                            <span>•</span>
                            <span>{age} лет</span>
                            {user?.sex === "male" ? (
                              <Mars className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Venus className="h-4 w-4 text-pink-500" />
                            )}
                          </div>
                          <div className="mt-2 inline-flex items-center rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700 ring-1 ring-yellow-200 ring-inset">
                            Рейтинг 4.5
                          </div>
                        </div>

                        <div className="grid w-full grid-cols-2 gap-3">
                          <div
                            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl bg-gray-50 p-4 transition-all hover:bg-gray-100 active:scale-[0.98]"
                            onClick={() => setIsSubscribersPage(true)}
                          >
                            <span className="text-xl font-bold text-gray-900">
                              {userSubscribers?.length || 0}
                            </span>
                            <span className="text-xs font-medium text-gray-500">
                              Подписчики
                            </span>
                          </div>
                          <div
                            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl bg-gray-50 p-4 transition-all hover:bg-gray-100 active:scale-[0.98]"
                            onClick={() => setIsFriendsPage(true)}
                          >
                            <span className="text-xl font-bold text-gray-900">
                              {uniqueFriends.length || 0}
                            </span>
                            <span className="text-xs font-medium text-gray-500">
                              Друзья
                            </span>
                          </div>
                        </div>

                        <div className="flex w-full gap-3">
                          <button
                            className="flex flex-1 items-center justify-center rounded-2xl bg-violet-600 px-4 py-3 font-medium text-white transition-transform active:scale-95"
                            onClick={() => handleSubscribe()}
                          >
                            {isSubscribed ? "Отписаться" : "Подписаться"}
                          </button>
                          {isFriend ? (
                            <button
                              className="rounded-2xl bg-red-50 px-4 py-3 font-medium text-red-600 transition-transform active:scale-95"
                              onClick={() => handleRemoveFriend()}
                            >
                              Удалить
                            </button>
                          ) : (
                            <button
                              className="flex flex-1 items-center justify-center rounded-2xl bg-gray-900 px-4 py-3 font-medium text-white transition-transform active:scale-95"
                              onClick={() => handleSendRequest()}
                            >
                              {isRequest ? "Отменить запрос" : "Добавить в друзья"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-6">
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to="/user-quests/$id"
                        params={{ id: user?.id!.toString()! }}
                        preload="viewport"
                        className="group relative overflow-hidden rounded-3xl bg-yellow-400 p-5 shadow-sm transition-transform active:scale-[0.98]"
                      >
                        <div className="relative z-10">
                          <div className="mb-1 text-3xl font-bold text-gray-900">
                            {activeQuests?.length || 0}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900/80">
                            <span>
                              <Star className="h-4 w-4 fill-white text-white" />
                            </span>
                            <span>Квесты</span>
                          </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/20 blur-2xl transition-transform group-hover:scale-150" />
                      </Link>
                      <Link
                        to="/user-meetings/$id"
                        params={{ id: user?.id!.toString()! }}
                        preload="viewport"
                        className="group relative overflow-hidden rounded-3xl bg-violet-600 p-5 shadow-sm transition-transform active:scale-[0.98]"
                      >
                        <div className="relative z-10">
                          <div className="mb-1 text-3xl font-bold text-white">
                            {userMeetings?.length || 0}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-white/90">
                            <Calendar1 className="h-4 w-4" />
                            <span>Встречи</span>
                          </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/20 blur-2xl transition-transform group-hover:scale-150" />
                      </Link>
                    </div>
                  </div>

                  <div className="px-5 pb-6">
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Обо мне</h3>
                        <button
                          className="text-sm font-medium text-violet-600"
                          onClick={() => setIsMore(!isMore)}
                        >
                          Подробнее
                        </button>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-600">
                        {user?.bio ||
                          "Расскажите о себе, чтобы другие пользователи могли узнать вас"}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-6">
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                      <h3 className="mb-3 text-lg font-bold text-gray-900">Интересы</h3>
                      {user?.interests &&
                      Object.entries(user.interests).filter(([key, value]) => value)
                        .length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(user.interests)
                            .filter(([key, value]) => value)
                            .slice(0, 4)
                            .map(([key, value]) => (
                              <div key={key} className="rounded-2xl bg-gray-50 p-3">
                                <div className="mb-1 text-xs text-gray-500 capitalize">
                                  {getInterestLabel(key)}
                                </div>
                                <div className="text-sm font-bold text-gray-900">
                                  {value}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Нет интересов</p>
                      )}
                    </div>
                  </div>

                  <div className="px-5 pb-6">
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                      <h3 className="mb-3 text-lg font-bold text-gray-900">Достижения</h3>
                      <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                          <img src="/shit.png" alt="achievement" className="h-8 w-8" />
                        </div>
                        <div className="flex flex-1 flex-col gap-0.5">
                          <div className="text-sm font-bold text-gray-900">
                            Любитель квестов
                          </div>
                          <div className="text-xs font-medium text-emerald-600">
                            Продвинутое
                          </div>
                        </div>
                        <div className="rounded-full bg-violet-600 px-2.5 py-1 text-xs font-bold text-white">
                          10/10
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-6">
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                      <h3 className="mb-4 text-lg font-bold text-gray-900">Навыки</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            title: "Физические",
                            icon: <Dumbbell className="h-4 w-4" />,
                            bg: "#A3FFCD",
                            text: "text-emerald-900",
                            skills: ["Сила", "Выносливость", "Ловкость"],
                          },
                          {
                            title: "Интеллект",
                            icon: <Brain className="h-4 w-4" />,
                            bg: "#A3BDFF",
                            text: "text-blue-900",
                            skills: ["Логика", "Память", "Внимание"],
                          },
                          {
                            title: "Социальные",
                            icon: <Users className="h-4 w-4" />,
                            bg: "#FFD4A3",
                            text: "text-orange-900",
                            skills: ["Общение", "Эмпатия", "Лидерство"],
                          },
                          {
                            title: "Работа",
                            icon: <Briefcase className="h-4 w-4" />,
                            bg: "#FFA3A3",
                            text: "text-red-900",
                            skills: ["Экспертиза", "Планы", "Адаптация"],
                          },
                        ].map((skill, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col rounded-2xl p-4 transition-transform active:scale-[0.98]"
                            style={{ backgroundColor: skill.bg }}
                          >
                            <div
                              className={cn("mb-3 flex items-center gap-2", skill.text)}
                            >
                              {skill.icon}
                              <span className="text-xs font-bold">{skill.title}</span>
                            </div>

                            <div className="flex flex-col gap-3">
                              {skill.skills.map((skillName, barIdx) => (
                                <div key={barIdx} className="flex flex-col gap-1">
                                  <div className="flex justify-between text-[10px] font-semibold opacity-80">
                                    <span>{skillName}</span>
                                    <span>{50 + barIdx * 20}%</span>
                                  </div>
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                                    <div
                                      className="h-full rounded-full bg-white"
                                      style={{
                                        width: `${50 + barIdx * 20}%`,
                                        transition: "width 0.3s",
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-24">
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                      <h3 className="mb-3 text-lg font-bold text-gray-900">Инвентарь</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { img: "/green-cap.png", name: "Fly Eagle!" },
                          { img: "/knife.png", name: "Меч берсерка" },
                          { img: "/shit.png", name: "Стальной щит" },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-gray-50 p-3 text-center"
                          >
                            <img
                              src={item.img}
                              alt={item.name}
                              className="h-16 w-16 object-contain"
                            />
                            <span className="text-xs leading-tight font-medium text-gray-900">
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <FullScreenPhoto
                    allPhotos={allPhotos}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                    setIsFullScreen={setIsFullScreen}
                    isOpen={isFullScreen && allPhotos.length > 0}
                  >
                    {allPhotos.length > 0 && (
                      <Heart
                        className={cn(
                          "absolute right-4 bottom-4 z-[100001] h-10 w-10 cursor-pointer rounded-lg bg-neutral-500 p-2 text-white",
                          isPhotoFavorite(allPhotos[currentIndex]) && "text-red-500",
                        )}
                        onClick={() => {
                          handlePhotoToFavorites({ photo: allPhotos[currentIndex] });
                        }}
                      />
                    )}
                  </FullScreenPhoto>
                  {user?.id !== me?.id && (
                    <div className="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-center gap-4 bg-white/80 p-4 pb-4 backdrop-blur-xl">
                      <Link
                        to="/invite"
                        search={{ id: user?.id!.toString()! }}
                        preload="viewport"
                        className="flex w-full items-center justify-center rounded-2xl bg-gray-900 py-4 text-base font-bold text-white shadow-lg transition-transform active:scale-[0.98]"
                      >
                        Пригласить
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <ProfileMore
                  user={user}
                  allPhotos={allPhotos}
                  currentIndex={currentIndex}
                  age={Number(age)}
                  userSubscribersCount={userSubscribers?.length}
                  uniqueFriends={uniqueFriends}
                  isSubscribed={isSubscribed!}
                  isFriend={isFriend!}
                  isRequest={isRequest!}
                  isFavorite={isFavorite!}
                  activeQuests={activeQuests}
                  isClicked={isClicked}
                  setIsClicked={setIsClicked}
                  setCurrentIndex={setCurrentIndex}
                  setIsFullScreen={setIsFullScreen}
                  handleToFavorites={handleToFavorites}
                  handleSubscribe={handleSubscribe}
                  handleRemoveFriend={handleRemoveFriend}
                  handleSendRequest={handleSendRequest}
                />
              )}

              {/* Level Info Modal */}
              <LevelInfoModal
                isOpen={isLevelModalOpen}
                onClose={() => setIsLevelModalOpen(false)}
                currentLevel={user?.level ?? undefined}
                currentXp={user?.xp ?? undefined}
              />

              {/* Complaint Drawer */}
              {isComplaintOpen && (
                <ComplaintDrawer
                  handleSendComplaint={() => {
                    if (user?.id) {
                      handleSubmitComplaint(user.id);
                    }
                  }}
                  complaint={complaint}
                  setComplaint={setComplaint}
                  open={isComplaintOpen}
                  onOpenChange={setIsComplaintOpen}
                  userId={user?.id as number}
                  type="user"
                  isComplained={isUserComplained}
                />
              )}
            </PullToRefresh>
          </div>
        </div>
      )}
    </div>
  );
}

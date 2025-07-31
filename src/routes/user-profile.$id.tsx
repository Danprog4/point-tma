import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  X as XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useScroll } from "~/components/hooks/useScroll";
import { Calendar } from "~/components/Icons/Calendar";
import { ProfileMore } from "~/components/ProfileMore";
import { UserFriends } from "~/components/UserFriends";
import { UserSubscribers } from "~/components/UserSubscribers";
import { cn } from "~/lib/utils/cn";
import { getAge } from "~/lib/utils/getAge";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { getInterestLabel } from "~/lib/utils/interestLabels";
import { useTRPC } from "~/trpc/init/react";
export const Route = createFileRoute("/user-profile/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
  const queryClient = useQueryClient();
  const [isFriendsPage, setIsFriendsPage] = useState(false);
  const [isSubscribersPage, setIsSubscribersPage] = useState(false);
  const [isMore, setIsMore] = useState(false);
  const { state } = useRouterState({ select: (s) => s.location });
  console.log(state, "state");
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const { data: me } = useQuery(trpc.main.getUser.queryOptions());
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const user = users?.find((user) => user.id === Number(id));

  // Gallery & photo state
  const [mainPhoto, setMainPhoto] = useState<string | undefined>(
    user?.photo || undefined,
  );
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(user?.gallery ?? []);
  const [isClicked, setIsClicked] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: userMeetings } = useQuery(
    trpc.meetings.getMeetings.queryOptions({ userId: Number(id) }),
  );
  console.log(userMeetings, "userMeetings");
  const allPhotos = useMemo(() => {
    return [mainPhoto, ...galleryPhotos].filter(Boolean) as string[];
  }, [mainPhoto, galleryPhotos]);

  // Sync local state when fetched user changes
  useEffect(() => {
    setMainPhoto(user?.photo || undefined);
    setGalleryPhotos(user?.gallery ?? []);
  }, [user]);

  const { data: userSubscriptions } = useQuery(
    trpc.main.getUserSubscriptions.queryOptions(),
  );

  const sendRequest = useMutation(trpc.friends.sendRequest.mutationOptions());
  const unSendRequest = useMutation(trpc.friends.unSendRequest.mutationOptions());
  const { data: userRequests } = useQuery(trpc.main.getMyRequests.queryOptions());

  const { data: friends } = useQuery(trpc.friends.getFriends.queryOptions());

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

  const isFriend = useMemo(() => {
    return friends?.some(
      (f) =>
        (f.fromUserId === user?.id && f.toUserId === me?.id) ||
        (f.toUserId === user?.id && f.fromUserId === me?.id),
    );
  }, [friends, user?.id, me?.id]);

  const subscribe = useMutation(trpc.main.subscribe.mutationOptions());
  const unsubscribe = useMutation(trpc.main.unSubscribe.mutationOptions());

  const addToFavorites = useMutation(trpc.main.addToFavorites.mutationOptions());
  const removeFromFavorites = useMutation(
    trpc.main.removeFromFavorites.mutationOptions(),
  );
  const { data: userFavorites } = useQuery(trpc.main.getUserFavorites.queryOptions());

  const uniqueFriends = useMemo(() => {
    if (!friends || !user?.id) return [];
    const seen = new Set<number>();
    return friends
      .filter((r) => r.status === "accepted")
      .filter((r) => {
        const counterpartId = r.fromUserId === user.id ? r.toUserId : r.fromUserId;
        if (counterpartId == null) return false;
        if (seen.has(counterpartId)) return false;
        seen.add(counterpartId);
        return true;
      });
  }, [friends, user?.id]);

  // Get subscribers count for this user
  const userSubscribersCount = useMemo(() => {
    return userSubscriptions?.filter((s) => s.targetUserId === user?.id);
  }, [userSubscriptions, user?.id]);

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
      queryClient.setQueryData(trpc.main.getUserSubscriptions.queryKey(), (old: any) => {
        return old.filter((s: any) => s.targetUserId !== user?.id);
      });
    } else {
      subscribe.mutate({ userId: user?.id! });
      queryClient.setQueryData(trpc.main.getUserSubscriptions.queryKey(), (old: any) => {
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

  console.log(userMeetings, "userMeetings");

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
    return userSubscriptions?.some(
      (s) => s.targetUserId === user?.id && s.subscriberId === user?.id,
    );
  }, [userSubscriptions, user?.id]);

  const age = getAge(user?.birthday ?? undefined);

  const isOwner = useMemo(() => {
    return me?.id === user?.id;
  }, [me?.id, user?.id]);

  console.log(isOwner, "isOwner");

  console.log(user?.photoUrl, "mainPhoto");

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
  };

  console.log(allPhotos[currentIndex], "current photo");
  console.log(user?.gallery, "gallery");
  console.log(currentIndex, "currentIndex");

  return (
    <>
      {isFriendsPage ? (
        <UserFriends
          viewedUser={user}
          users={users}
          setIsFriendsPage={setIsFriendsPage}
        />
      ) : isSubscribersPage ? (
        <UserSubscribers viewedUser={user} setIsSubscribersPage={setIsSubscribersPage} />
      ) : (
        <div className="scrollbar-hidden overflow-y-auto pt-14 pb-20">
          {isMore ? (
            <div className="fixed top-0 right-0 left-0 z-10 flex items-center justify-center bg-white p-4">
              <button
                onClick={() => setIsMore(false)}
                className="absolute left-4 flex h-6 w-6 items-center justify-center"
              >
                <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
              </button>
              <h1 className="text-base font-bold text-gray-800">
                Об {user?.name} {user?.surname}
              </h1>
            </div>
          ) : (
            <div className="fixed top-0 right-0 left-0 z-10 flex items-center justify-center bg-white p-4">
              <button
                // TODO: Make user-meetings as component
                onClick={() => navigate({ to: "/profile" })}
                className="absolute left-4 flex h-6 w-6 items-center justify-center"
              >
                <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
              </button>
              <h1 className="text-base font-bold text-gray-800">Профиль</h1>
            </div>
          )}
          {!isMore ? (
            <>
              <div className="relative">
                <div className="relative h-[30vh] rounded-t-2xl">
                  <div className="absolute top-4 right-4 z-10"></div>
                  <img
                    src={
                      mainPhoto
                        ? getImageUrl(mainPhoto)
                        : user?.photo
                          ? getImageUrl(user?.photo ?? "")
                          : user?.photoUrl || ""
                    }
                    alt={user?.name || ""}
                    className="h-full w-full rounded-2xl object-cover"
                    onClick={() => {
                      setIsClicked(!isClicked);
                      setCurrentIndex(0);
                      setIsFullScreen(true);
                    }}
                  />
                </div>
              </div>
              <div className="scrollbar-hidden flex gap-2 overflow-x-auto px-4 pt-4">
                {galleryPhotos.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.startsWith("data:image/") ? img : getImageUrl(img || "")}
                    alt=""
                    className="h-20 w-20 cursor-pointer rounded-lg object-cover"
                    onClick={() => {
                      setGalleryPhotos((prev) => {
                        const newGallery = prev.filter((i) => i !== img);
                        if (mainPhoto) newGallery.push(mainPhoto);
                        return newGallery;
                      });
                      setMainPhoto(img);
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 px-4 py-4">
                <div className="relative flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-purple-800 bg-purple-600">
                    <span className="text-xl font-bold text-white">1</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <h2 className="text-xl font-bold text-black">
                      {user?.name} {user?.surname}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center">
                  <Star className="h-7 w-7 fill-blue-500 text-blue-500" />
                </div>

                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToFavorites();
                  }}
                >
                  <Heart
                    className={cn("h-6 w-6 text-black", isFavorite && "text-red-500")}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between px-4 pb-4">
                <div className="text-sm text-neutral-500">
                  г. {user?.city}, {age || "не указано"}
                </div>
                <div className="rounded-lg bg-[#FFF2BD] px-2 text-sm">Рейтинг 4.5</div>
              </div>

              <div className="flex items-center justify-center gap-4 px-4 pb-4">
                <div
                  className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl border border-gray-200 p-4"
                  onClick={() => setIsSubscribersPage(true)}
                >
                  <div>{userSubscribersCount?.length || 0}</div>
                  <div className="text-sm text-neutral-500">Подписчиков</div>
                </div>
                <div
                  className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl border border-gray-200 p-4"
                  onClick={() => setIsFriendsPage(true)}
                >
                  <div className="cursor-pointer">{uniqueFriends.length || 0}</div>
                  <div className="text-sm text-neutral-500">Друзей</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 px-4 pb-4 text-white">
                <div
                  className="flex flex-1 items-center justify-center rounded-2xl bg-[#2462FF] px-4 py-2"
                  onClick={() => handleSubscribe()}
                >
                  {isSubscribed ? "Отписаться" : "Подписаться"}
                </div>
                {isFriend ? (
                  <div
                    className="rounded-2xl bg-red-600 px-4 py-2"
                    onClick={() => handleRemoveFriend()}
                  >
                    Удалить из друзей
                  </div>
                ) : (
                  <div
                    className="flex flex-1 items-center justify-center rounded-2xl bg-[#9924FF] px-4 py-2"
                    onClick={() => handleSendRequest()}
                  >
                    {isRequest ? "Отменить запрос" : "Добавить в друзья"}
                  </div>
                )}
              </div>

              <div className="mt-4 mb-6 px-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-yellow-400 p-3 shadow-sm">
                    <div className="mb-1 text-center text-xl font-bold text-black">
                      {activeQuests?.length || 0}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <div className="flex h-4 w-4 items-center justify-center rounded bg-[#FFF2BD]">
                        !
                      </div>
                      <span className="text-sm text-black">Квесты</span>
                    </div>
                  </div>
                  <div
                    className="rounded-xl bg-purple-600 p-3 shadow-sm"
                    onClick={() => {
                      navigate({
                        to: "/user-meetings/$id",
                        params: { id: user?.id!.toString()! },
                      });
                    }}
                  >
                    <div className="mb-1 text-center text-xl font-bold text-white">
                      {userMeetings?.length || 0}
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Calendar height={16} width={16} />
                      <span className="text-sm text-white">Встречи</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full px-4">
                <div className="flex w-full flex-col items-start justify-between pb-4">
                  <div className="flex w-full items-center justify-between">
                    <h3 className="text-xl font-bold text-black">Обо мне</h3>
                    <div
                      className="text-sm text-blue-500"
                      onClick={() => setIsMore(!isMore)}
                    >
                      Подробнее
                    </div>
                  </div>
                  {user?.bio ? (
                    <div className="text-sm text-black">{user.bio}</div>
                  ) : (
                    <div className="text-sm text-black">
                      Расскажите о себе, чтобы другие пользователи могли узнать вас
                    </div>
                  )}
                </div>
              </div>

              <div className="mx-4">
                <div className="flex flex-col items-start justify-between py-3">
                  <h3 className="text-xl font-bold text-black">Интересы</h3>
                  {user?.interests &&
                  Object.entries(user.interests).filter(([key, value]) => value).length >
                    0 ? (
                    <div className="mt-2 grid w-full grid-cols-2 gap-2">
                      {Object.entries(user.interests)
                        .filter(([key, value]) => value)
                        .slice(0, 4)
                        .map(([key, value]) => (
                          <div key={key} className="flex flex-col">
                            <div className="text-xs text-gray-500 capitalize">
                              {getInterestLabel(key)}
                            </div>
                            <div className="text-sm font-medium text-black">{value}</div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-sm text-black">
                      Расскажите о себе, чтобы другие пользователи могли узнать вас
                    </div>
                  )}
                </div>
              </div>

              {/* TODO: Interests add here */}
              {/* <div className="flex flex-col gap-2 px-4">
        <div className="text-sm text-gray-500">{user?.bio}</div>
      </div> */}

              <div className="mt-4 flex flex-col gap-2 px-4">
                <div className="text-2xl font-bold">Достижения</div>

                <div className="mt-2 flex w-full items-center gap-4 rounded-2xl border border-[#A3FFCD] bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full">
                    <img src="/shit.png" alt="achievement" className="h-10 w-10" />
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <div className="text-base font-bold text-black">Любитель квестов</div>
                    <div className="text-sm text-[#00A349]">Продвинутое</div>
                    <div className="rounded-full bg-[#9924FF] px-2 text-white">10/10</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 pl-4">
                <div className="text-2xl font-bold">Навыки</div>
                <div className="scrollbar-hidden flex w-full gap-3 overflow-x-auto pb-2">
                  {[
                    {
                      title: (
                        <>
                          Физические
                          <br />
                          навыки
                        </>
                      ),
                      bg: "#A3FFCD",
                      skills: ["Сила", "Выносливость", "Ловкость"],
                    },
                    {
                      title: "Интеллектуальные навыки",
                      bg: "#A3BDFF",
                      accent: "#002EA3",
                      skills: ["Логика", "Память", "Внимание"],
                    },
                    {
                      title: (
                        <>
                          Социальные <br />
                          навыки
                        </>
                      ),
                      bg: "#FFD4A3",
                      accent: "#A35700",
                      skills: ["Коммуникация", "Эмпатия", "Лидерство"],
                    },
                    {
                      title: "Профессиональные умения",
                      bg: "#FFA3A3",
                      accent: "#A30000",
                      skills: ["Экспертиза", "Планирование", "Адаптация"],
                    },
                  ].map((skill, idx) => (
                    <div
                      key={idx}
                      className="flex shrink-0 flex-col rounded-2xl"
                      style={{ background: skill.bg, width: 148, padding: 12 }}
                    >
                      <div className="text-xs font-bold">{skill.title}</div>

                      <div className="mt-2 flex flex-col gap-3">
                        {skill.skills.map((skillName, barIdx) => (
                          <div key={barIdx} className="flex flex-col gap-1">
                            <div className="h flex h-6 w-full items-center overflow-hidden rounded-full bg-[#1212121A]">
                              <div
                                className="flex h-full items-center rounded-full"
                                style={{
                                  width: `${50 + barIdx * 20}%`,
                                  background: "white",
                                  transition: "width 0.3s",
                                }}
                              >
                                <div className="px-2 text-xs text-black">{skillName}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex w-full flex-col gap-2 px-4">
                <div className="text-2xl font-bold">Инвентарь</div>
                <div className="flex w-full justify-between gap-2">
                  <div className="flex aspect-square h-25 flex-col items-center justify-center rounded-lg">
                    <img src="/green-cap.png" alt="coin" className="h-20 w-20" />
                    <span className="mt-1 text-sm">Fly Eagle! Fly! </span>
                  </div>
                  <div className="flex aspect-square h-25 flex-col items-center justify-center rounded-lg">
                    <img src="/knife.png" alt="coin" className="h-20 w-20" />
                    <span className="mt-1 text-sm">Меч берсер...</span>
                  </div>
                  <div className="flex aspect-square h-25 flex-col items-center justify-center rounded-lg">
                    <img src="/shit.png" alt="coin" className="h-20 w-20" />
                    <span className="mt-1 text-sm">Стальной щ...</span>
                  </div>
                </div>
              </div>

              {isFullScreen && allPhotos.length > 0 && (
                <div className="bg-opacity-90 fixed inset-0 z-[100000] flex items-center justify-center bg-black">
                  {allPhotos.length > 1 && (
                    <ChevronLeft
                      className="absolute left-4 h-10 w-10 cursor-pointer text-white"
                      onClick={() =>
                        setCurrentIndex(
                          (prev) => (prev - 1 + allPhotos.length) % allPhotos.length,
                        )
                      }
                    />
                  )}

                  {(() => {
                    const imgSrc = allPhotos[currentIndex];
                    return (
                      <img
                        src={
                          imgSrc.startsWith("data:image/") ? imgSrc : getImageUrl(imgSrc)
                        }
                        alt="Full view"
                        className="max-h-full max-w-full object-contain"
                      />
                    );
                  })()}

                  {allPhotos.length > 1 && (
                    <ChevronRight
                      className="absolute right-4 h-10 w-10 cursor-pointer text-white"
                      onClick={() =>
                        setCurrentIndex((prev) => (prev + 1) % allPhotos.length)
                      }
                    />
                  )}

                  <XIcon
                    className="absolute top-4 right-4 h-8 w-8 cursor-pointer text-white"
                    onClick={() => setIsFullScreen(false)}
                  />

                  <Heart
                    className={cn(
                      "absolute right-4 bottom-4 h-10 w-10 cursor-pointer rounded-lg bg-neutral-500 p-2 text-white",
                      isPhotoFavorite(allPhotos[currentIndex]) && "text-red-500",
                    )}
                    onClick={() => {
                      handlePhotoToFavorites({ photo: allPhotos[currentIndex] });
                    }}
                  />
                </div>
              )}
              {user?.id !== me?.id && (
                <div className="fixed right-0 bottom-0 left-0 flex items-center justify-center gap-10 rounded-2xl bg-white px-4 py-3 text-white">
                  <div
                    onClick={() =>
                      navigate({
                        to: "/invite",
                        search: { id: user?.id!.toString()! },
                      })
                    }
                    className="flex flex-1 items-center justify-center rounded-tl-2xl rounded-tr-lg rounded-br-2xl rounded-bl-lg bg-[#9924FF] px-3 py-3 text-white"
                  >
                    Пригласить
                  </div>
                </div>
              )}
            </>
          ) : (
            <ProfileMore
              user={user}
              mainPhoto={mainPhoto}
              galleryPhotos={galleryPhotos}
              age={age}
              userSubscribersCount={userSubscribersCount}
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
              setGalleryPhotos={setGalleryPhotos}
              setMainPhoto={setMainPhoto}
              handleToFavorites={handleToFavorites}
              handleSubscribe={handleSubscribe}
              handleRemoveFriend={handleRemoveFriend}
              handleSendRequest={handleSendRequest}
            />
          )}
        </div>
      )}
    </>
  );
}

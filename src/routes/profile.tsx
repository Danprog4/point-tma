import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BarChart3,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  History,
  Maximize2,
  Package,
  Search,
  Settings,
  Star,
  X as XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Header } from "~/components/Header";
import { useScroll } from "~/components/hooks/useScroll";

import { CloseRed } from "~/components/Icons/CloseRed";
import { Coin } from "~/components/Icons/Coin";
import { MenuItem } from "~/components/MenuItem";
import { questsData } from "~/config/quests";
import { getAge } from "~/lib/utils/getAge";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
export const Route = createFileRoute("/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const navigate = useNavigate();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const [page, setPage] = useState<"info" | "friends">("info");
  const [mainPhoto, setMainPhoto] = useState<string | undefined>(
    user?.photo || undefined,
  );
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(user?.gallery ?? []);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const allPhotos = useMemo(() => {
    return [mainPhoto, ...galleryPhotos].filter(Boolean) as string[];
  }, [mainPhoto, galleryPhotos]);

  useEffect(() => {
    setMainPhoto(user?.photo || undefined);
    setGalleryPhotos(user?.gallery ?? []);
  }, [user]);

  const { data: activeEvents } = useQuery(trpc.event.getMyEvents.queryOptions());
  const [isClicked, setIsClicked] = useState(false);
  const { data: friends } = useQuery(trpc.friends.getFriends.queryOptions());

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

  const { data: requests } = useQuery(trpc.friends.getRequests.queryOptions());
  const activeRequests = requests?.filter((request) => request.status === "pending");
  const { data } = useQuery(trpc.event.getMyEvents.queryOptions());
  const [search, setSearch] = useState("");
  console.log(requests, "requests");

  const activeQuests = useMemo(() => {
    return activeEvents?.filter((event) => event.type === "Квест") || [];
  }, [activeEvents]);

  const userAge = user?.birthday ? getAge(user.birthday) : undefined;

  const acceptRequestMutation = useMutation(trpc.friends.acceptRequest.mutationOptions());
  const declineRequestMutation = useMutation(
    trpc.friends.declineRequest.mutationOptions(),
  );

  const filteredEvents = data?.filter((event) => event.type === "Квест");
  const QuestsData = filteredEvents?.map((event) => {
    const quest = questsData.find((q) => q.id === event.eventId);
    return quest
      ? {
          ...event,
          description: quest.description,
          hasAchievement: quest.hasAchievement,
          reward: quest.rewards?.find((r) => r.type === "point")?.value || 0,
          title: quest.title,
          date: quest.date,
          location: quest.location,
          price: quest.price,
          type: quest.type,
          category: quest.category,
          organizer: quest.organizer,
          image: quest.image,
        }
      : event;
  });

  const completedQuestsData = QuestsData?.filter((q) => q.isCompleted === true);
  console.log(completedQuestsData, "completedQuestsData");
  const uncompletedQuestsData = QuestsData?.filter((q) => q.isCompleted === false);
  console.log(uncompletedQuestsData, "uncompletedQuestsData");

  const pageState = uncompletedQuestsData?.length === 0 ? "completed" : "active";

  const acceptRequest = (userId: number) => {
    acceptRequestMutation.mutate({ userId });
    queryClient.setQueryData(trpc.friends.getRequests.queryKey(), (old: any) => {
      return old.map(
        (request: any) => request.id === request.id && { ...request, status: "accepted" },
      );
    });
  };

  const declineRequest = (userId: number) => {
    declineRequestMutation.mutate({ userId });
    queryClient.setQueryData(trpc.friends.getRequests.queryKey(), (old: any) => {
      return old.map(
        (request: any) => request.id === request.id && { ...request, status: "rejected" },
      );
    });
  };

  console.log(pageState, "pageState");
  return (
    <div className="min-h-screen overflow-y-auto bg-white pt-14 pb-20">
      <Header />

      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-black">Профиль</h1>
        </div>
        <Settings
          className="h-5 w-5 cursor-pointer text-black"
          onClick={() => navigate({ to: "/profile-sett" })}
        />
      </div>

      <div className="flex gap-4 px-4 pb-4">
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
            page === "friends" ? "bg-black text-white" : "bg-white text-black"
          }`}
          onClick={() => setPage("friends")}
        >
          Друзья
        </button>
      </div>

      {page === "info" && (
        <>
          <div className="relative">
            <div className="relative h-60">
              <div className="absolute top-4 right-4 z-10">
                <Maximize2
                  className="h-6 w-6 cursor-pointer text-black drop-shadow"
                  onClick={() => {
                    setCurrentIndex(0);
                    setIsFullScreen(true);
                  }}
                />
              </div>

              <img
                src={
                  mainPhoto && mainPhoto.startsWith("data:image/")
                    ? mainPhoto
                    : getImageUrl(mainPhoto ?? "")
                }
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                onClick={() => setIsClicked(!isClicked)}
              />
              {isClicked && (
                <>
                  <div className="absolute bottom-2 left-2 flex items-center">
                    <div className="relative mb-2 flex items-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-purple-800 bg-purple-600">
                        <span className="text-xl font-bold text-white">1</span>
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 transform">
                        <div className="rounded-lg bg-purple-600 px-2 py-1 text-xs font-bold text-white">
                          Уровень
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2 pt-8">
                      {galleryPhotos.map((img, idx) => (
                        <img
                          key={idx}
                          src={
                            img?.startsWith("data:image/") ? img : getImageUrl(img || "")
                          }
                          alt=""
                          className="h-12 w-12 cursor-pointer rounded-lg object-cover"
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
                  </div>
                  <div className="absolute top-4 left-4 flex items-center justify-center gap-2 rounded-md bg-[#FFD943] px-2 py-1">
                    <div className="font-medium text-black">Пройти верификацию</div>
                    <ArrowRight className="h-4 w-4 text-black" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="px-4 py-4">
            <div className="text-center">
              <div className="mb-1 flex items-center justify-center gap-2">
                <h2 className="text-xl font-bold text-black">
                  {user?.name} {user?.surname}
                </h2>
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-blue-500 text-blue-500" />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                г. {user?.city}, {userAge}
              </p>
            </div>
          </div>

          <div className="flex w-full items-center justify-start gap-1 px-4">
            <div className="flex h-14 flex-1 flex-col justify-center rounded-sm rounded-tl-2xl bg-[#DEB8FF] px-4 py-2">
              <div className="flex flex-col gap-2">
                <div className="text-sm text-nowrap">Заполенность профиля 0%</div>
                <div className="h-2 w-full rounded-full bg-white"></div>
              </div>
            </div>
            <div
              className="flex h-14 cursor-pointer items-center justify-center rounded-sm rounded-br-2xl bg-[#9924FF] px-4 py-2"
              onClick={() => navigate({ to: "/fill-profile" })}
            >
              <div className="text-white">Заполнить</div>
            </div>
          </div>

          {/* Digital Avatar Card */}
          {/* <div className="mx-4 mb-4">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-5">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-purple-600" />
                <span className="text-base font-medium text-black">Цифровой аватар</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div> */}

          <div className="mt-4 mb-6 px-4">
            <div className="grid grid-cols-2 gap-4">
              <div
                className="rounded-xl bg-yellow-400 p-3 shadow-sm"
                onClick={() => {
                  navigate({
                    to: "/user-quests/$page",
                    params: { page: pageState },
                  });
                }}
              >
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
                  navigate({ to: "/points" });
                }}
              >
                <div className="mb-1 text-center text-xl font-bold text-white">
                  {user?.balance || 0}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Coin />
                  <span className="text-sm text-white">Points</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interests Section */}
          <div className="mx-4">
            <div className="flex flex-col items-start justify-between py-3">
              <h3 className="text-xl font-bold text-black">Обо мне</h3>
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
              {user?.interests ? (
                <div className="text-sm text-black">{user.interests}</div>
              ) : (
                <div className="text-sm text-black">
                  Расскажите о себе, чтобы другие пользователи могли узнать вас
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="mb-6">
            <div className="space-y-0">
              <MenuItem
                onClick={() => {
                  navigate({ to: "/skills" });
                  console.log("clicked");
                }}
                icon={<BarChart3 className="h-6 w-6 text-purple-300" />}
                title="Ваши навыки"
              />
              <MenuItem
                onClick={() => {
                  navigate({ to: "/achievments" });
                }}
                icon={<Award className="h-6 w-6 text-purple-300" />}
                title="Достижения"
              />
              <MenuItem
                onClick={() => {
                  navigate({ to: "/calendar" });
                }}
                icon={<Calendar className="h-6 w-6 text-purple-300" />}
                title="Календарь"
              />
              <MenuItem
                onClick={() => {
                  navigate({ to: "/history" });
                }}
                icon={<History className="h-6 w-6 text-purple-300" />}
                title="История"
              />
              <MenuItem
                onClick={() => {
                  navigate({ to: "/inventory" });
                }}
                icon={<Package className="h-6 w-6 text-purple-300" />}
                title="Инвентарь"
              />
            </div>
          </div>
        </>
      )}

      {page === "friends" && (
        <>
          <div className="relative px-4 py-4">
            <input
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              value={search}
              type="text"
              placeholder="Поиск друзей"
              className="mb-4 h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
            />
            <div className="absolute top-7 right-7">
              <Search className="h-5 w-5 text-gray-400" />
            </div>

            {search && (
              <div className="flex flex-col gap-4">
                <div className="text-lg font-medium">Пользователи</div>
                {users
                  ?.filter(
                    (user) =>
                      user?.name?.toLowerCase().includes(search.toLowerCase()) ||
                      user?.surname?.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((user) => (
                    <div
                      key={user.id}
                      onClick={() => {
                        navigate({
                          to: "/user-profile/$id",
                          params: { id: user.id.toString() },
                        });
                      }}
                    >
                      <div className="flex items-center justify-between pb-4">
                        <div className="flex items-center justify-start gap-2">
                          <img
                            src={getImageUrl(user?.photo || "")}
                            alt=""
                            className="h-14 w-14 rounded-lg"
                          />
                          <div className="flex flex-col items-start justify-between gap-2">
                            <div className="text-lg">
                              {user?.name} {user?.surname}
                            </div>
                            <div>{user?.birthday}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
            {activeRequests && activeRequests?.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="text-lg font-medium">Запросы</div>
                {activeRequests.map((request) => {
                  const requestUser = users?.find((u) => u.id === request.fromUserId);
                  return (
                    <div
                      key={request.id}
                      onClick={() => {
                        navigate({
                          to: "/user-profile/$id",
                          params: { id: requestUser?.id.toString() || "" },
                        });
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center justify-start gap-2">
                          <div
                            className="mr-4 p-2"
                            onClick={() => declineRequest(request.fromUserId!)}
                          >
                            <CloseRed />
                          </div>
                          <img
                            src={getImageUrl(requestUser?.photo || "")}
                            alt=""
                            className="h-14 w-14 rounded-lg"
                          />
                          <div className="flex flex-col items-start justify-between gap-2">
                            <div className="text-lg">
                              {requestUser?.name} {requestUser?.surname}
                            </div>
                            <div>{requestUser?.birthday}</div>
                          </div>
                        </div>
                        <div
                          className="flex items-center justify-center rounded-lg bg-green-500 p-2 text-white"
                          onClick={() => acceptRequest(request.fromUserId!)}
                        >
                          <Check className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {uniqueFriends && uniqueFriends.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="text-lg font-medium">Друзья</div>
                {uniqueFriends.map((request) => {
                  const requestUser = users?.find(
                    (u) =>
                      u.id ===
                      (request.fromUserId === user?.id
                        ? request.toUserId
                        : request.fromUserId),
                  );
                  return (
                    <div
                      key={request.id}
                      onClick={() => {
                        navigate({
                          to: "/user-profile/$id",
                          params: { id: requestUser?.id.toString() || "" },
                        });
                      }}
                    >
                      <div className="flex items-center justify-between pb-4">
                        <div className="flex items-center justify-start gap-2">
                          <img
                            src={getImageUrl(requestUser?.photo || "")}
                            alt=""
                            className="h-14 w-14 rounded-lg"
                          />
                          <div className="flex flex-col items-start justify-between gap-2">
                            <div className="text-lg">
                              {requestUser?.name} {requestUser?.surname}
                            </div>
                            <div>{requestUser?.birthday}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {isFullScreen && allPhotos.length > 0 && (
        <div className="bg-opacity-90 fixed inset-0 z-50 flex items-center justify-center bg-black">
          {/* Left arrow */}
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
                src={imgSrc.startsWith("data:image/") ? imgSrc : getImageUrl(imgSrc)}
                alt="Full view"
                className="max-h-full max-w-full object-contain"
              />
            );
          })()}

          {allPhotos.length > 1 && (
            <ChevronRight
              className="absolute right-4 h-10 w-10 cursor-pointer text-white"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % allPhotos.length)}
            />
          )}

          <XIcon
            className="absolute top-4 right-4 h-8 w-8 cursor-pointer text-white"
            onClick={() => setIsFullScreen(false)}
          />
        </div>
      )}
    </div>
  );
}

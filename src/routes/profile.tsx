import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  Calendar,
  Calendar1,
  ChevronLeft,
  ChevronRight,
  Crown,
  History,
  Lock,
  Package,
  Settings,
  Star,
  X as XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Header } from "~/components/Header";
import { useScroll } from "~/components/hooks/useScroll";
import { FavIcon } from "~/components/Icons/Fav";
import { MenuItem } from "~/components/MenuItem";
import { UserFriends } from "~/components/UserFriends";
import { UserSubscribers } from "~/components/UserSubscribers";
import { questsData } from "~/config/quests";
import { steps } from "~/config/steps";
import { useFriendsData } from "~/hooks/useFriendsData";
import { usePlatform } from "~/hooks/usePlatform";
import { getAge } from "~/lib/utils/getAge";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { getInterestLabel } from "~/lib/utils/interestLabels";
import { useTRPC } from "~/trpc/init/react";
export const Route = createFileRoute("/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();

  // Use the friends data hook
  const { users, activeRequests, uniqueFriends, user, acceptRequest, declineRequest } =
    useFriendsData();

  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [isSubscribersPage, setIsSubscribersPage] = useState(false);
  const [isFriendsPage, setIsFriendsPage] = useState(false);
  const navigate = useNavigate();
  const [page, setPage] = useState<"info" | "friends">("info");
  const [mainPhoto, setMainPhoto] = useState<string | undefined>(
    user?.photo || undefined,
  );
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(user?.gallery ?? []);

  const { data: userSubscribers } = useQuery(
    trpc.main.getUserSubscribers.queryOptions({ userId: user?.id }),
  );
  const userSteps = Object.entries(user?.interests || {}).filter(
    ([key, value]) => value,
  ).length;

  const getPercent = () => {
    const totalSteps = steps.length - 1;
    return ((userSteps / totalSteps) * 100).toFixed(0);
  };

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

  const { data: userMeetings } = useQuery(
    trpc.meetings.getMeetings.queryOptions({
      userId: user?.id,
    }),
  );

  const { data } = useQuery(trpc.event.getMyEvents.queryOptions());
  const [search, setSearch] = useState("");

  const activeQuests = useMemo(() => {
    return activeEvents?.filter((event) => event.type === "Квест") || [];
  }, [activeEvents]);

  const userAge = user?.birthday ? getAge(user.birthday) : undefined;

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

  console.log(pageState, "pageState");

  console.log(userSubscribers, "userSubscribers");

  const isMobile = usePlatform();
  return (
    <>
      {isSubscribersPage ? (
        <UserSubscribers viewedUser={user} setIsSubscribersPage={setIsSubscribersPage} />
      ) : isFriendsPage ? (
        <>
          <UserFriends
            viewedUser={user}
            setIsFriendsPage={setIsFriendsPage}
            users={users}
          />
        </>
      ) : (
        <div
          data-mobile={isMobile}
          className="min-h-screen overflow-y-auto bg-white pt-14 pb-20 data-[mobile=true]:pt-39"
        >
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

          {/* <div className="flex gap-4 px-4 pb-4">
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
          </div> */}

          {page === "info" && (
            <>
              <div className="relative">
                <div className="relative h-90 rounded-t-2xl">
                  <img
                    src={
                      mainPhoto && mainPhoto.startsWith("data:image/")
                        ? mainPhoto
                        : getImageUrl(mainPhoto ?? "")
                    }
                    alt=""
                    className="absolute inset-0 h-full w-full rounded-t-2xl object-cover"
                    onClick={() => {
                      setIsClicked(!isClicked);
                      setCurrentIndex(0);
                      setIsFullScreen(true);
                    }}
                  />
                </div>
              </div>

              <div className="scrollbar-hidden scrollbar-hidden flex flex-nowrap gap-2 overflow-x-auto px-4 pt-4">
                {galleryPhotos.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.startsWith("data:image/") ? img : getImageUrl(img || "")}
                    alt=""
                    className="h-20 w-20 flex-shrink-0 cursor-pointer rounded-lg object-cover"
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

              {/* User Info */}
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
              </div>

              <div className="flex items-center justify-between px-4 pb-4">
                <div className="text-sm text-neutral-500">
                  г. {user?.city}, {userAge}
                </div>
                <div className="rounded-lg bg-[#FFF2BD] px-2 text-sm">Рейтинг 4.5</div>
              </div>

              {/* TODO: add real followers and real friends count*/}
              <div className="flex items-center justify-center gap-4 px-4 pb-4">
                <div
                  className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl border border-gray-200 p-4"
                  onClick={() => setIsSubscribersPage(true)}
                >
                  <div>{userSubscribers?.length || 0}</div>
                  <div className="text-sm text-neutral-500">Подписчики</div>
                </div>
                <div
                  className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl border border-gray-200 p-4"
                  onClick={() => setIsFriendsPage(true)}
                >
                  <div>{uniqueFriends.length || 0}</div>
                  <div className="text-sm text-neutral-500">Друзья</div>
                </div>
              </div>

              <div className="px-4">
                <div className="flex flex-col items-start justify-between pb-4">
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

              <div className="flex w-full items-center justify-start gap-1 px-4">
                <div className="flex h-14 flex-1 flex-col justify-center rounded-sm rounded-tl-2xl bg-[#DEB8FF] px-4 py-2">
                  <div className="flex flex-col gap-2">
                    <div className="text-sm text-nowrap">
                      Заполенность профиля {getPercent()}%
                    </div>
                    <div className="h-2 w-full rounded-full bg-white">
                      <div
                        className="h-2 rounded-full bg-[#9924FF]"
                        style={{ width: `${getPercent()}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div
                  className="flex h-14 cursor-pointer items-center justify-center rounded-sm rounded-br-2xl bg-[#9924FF] px-4 py-2"
                  onClick={() =>
                    navigate({
                      to: "/fill-profile",
                      search: {
                        isSettingsSearch: getPercent() === "100" ? "true" : "false",
                      },
                    })
                  }
                >
                  <div className="text-white">
                    {getPercent() === "100" ? "Изменить" : "Заполнить"}
                  </div>
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

              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="h-6 w-6 text-purple-600" />
                    <span className="text-base font-medium text-black">
                      Цифровой аватар
                    </span>
                  </div>
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="mt-4 mb-6 px-4">
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="rounded-xl bg-yellow-400 p-3 shadow-sm"
                    onClick={() => {
                      navigate({
                        to: "/user-quests/$id",
                        params: { id: user?.id!.toString()! },
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
                      <Calendar1 className="h-4 w-4 text-white" />
                      <span className="text-sm text-white">Встречи</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interests Section */}

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
                      navigate({ to: "/favourites" });
                    }}
                    icon={<FavIcon />}
                    title="Избранное"
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

          {/* {page === "friends" && <Friends />} */}

          {isFullScreen && allPhotos.length > 0 && (
            <div className="bg-opacity-90 fixed inset-0 z-[100000] flex items-center justify-center bg-black">
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
                className="absolute top-24 right-4 h-8 w-8 cursor-pointer text-white"
                onClick={() => setIsFullScreen(false)}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

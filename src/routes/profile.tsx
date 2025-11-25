import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Award,
  BarChart3,
  Calendar,
  Calendar1,
  Crown,
  History,
  Lock,
  Mars,
  Package,
  Repeat2,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  Target,
  Venus,
} from "lucide-react";
import { useMemo, useState } from "react";
import PullToRefresh from "react-simple-pull-to-refresh";
import { FullScreenPhoto } from "~/components/FullScreenPhoto";
import { Header } from "~/components/Header";
import { useScrollRestoration } from "~/components/hooks/useScrollRes";
import { FavIcon } from "~/components/Icons/Fav";
import { LevelInfoModal } from "~/components/LevelInfoModal";
import { MenuItem } from "~/components/MenuItem";
import MyTrades from "~/components/MyTrades";
import { UserFriends } from "~/components/UserFriends";
import { UserSubscribers } from "~/components/UserSubscribers";
import { WarningsBansDrawer } from "~/components/WarningsBansDrawer";
import { levelsConfig } from "~/config/levels";
import { steps } from "~/config/steps";
import { useFriendsData } from "~/hooks/useFriendsData";
import { usePlatform } from "~/hooks/usePlatform";
import { useSwipeableGallery } from "~/hooks/useSwipeableGallery";
import { cn } from "~/lib/utils/cn";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { getUserAge } from "~/lib/utils/getUserAge";
import { getInterestLabel } from "~/lib/utils/interestLabels";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { useTRPC } from "~/trpc/init/react";
export const Route = createFileRoute("/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  useScrollRestoration("profile");

  // Use the friends data hook
  const { users, activeRequests, uniqueFriends, user, acceptRequest, declineRequest } =
    useFriendsData();

  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [isSubscribersPage, setIsSubscribersPage] = useState(false);
  const [isFriendsPage, setIsFriendsPage] = useState(false);
  const [isTradesPage, setIsTradesPage] = useState(false);
  const [isWarningsBansOpen, setIsWarningsBansOpen] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [page, setPage] = useState<"info" | "friends">("info");

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

  const { data: questsData } = useQuery(
    trpc.event.getEventsByCategory.queryOptions({ category: "Квест" }),
  );

  const { data: warnings } = useQuery(trpc.main.getUserWarnings.queryOptions());
  const { data: bans } = useQuery(trpc.main.getUserBans.queryOptions());
  const userSteps = Object.entries(user?.interests || {}).filter(
    ([key, value]) => value,
  ).length;

  const getPercent = () => {
    const totalSteps = steps.length - 1;
    return ((userSteps / totalSteps) * 100).toFixed(0);
  };

  const [isFullScreen, setIsFullScreen] = useState(false);

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

  const userAge = getUserAge(user?.birthday || "");

  const filteredEvents = data?.filter((event) => event.type === "Квест");
  const QuestsData = filteredEvents?.map((event) => {
    const quest = questsData?.find((q) => q.id === event.eventId);
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
  const uncompletedQuestsData = QuestsData?.filter((q) => q.isCompleted === false);

  const pageState = uncompletedQuestsData?.length === 0 ? "completed" : "active";

  const isMobile = usePlatform();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.main.getUser.queryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.main.getUserSubscribers.queryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.event.getMyEvents.queryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.meetings.getMeetings.queryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.main.getUserFavorites.queryKey(),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.trades.getMyTrades.queryKey(),
    });
  };
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
      ) : isTradesPage ? (
        <MyTrades onBack={() => setIsTradesPage(false)} />
      ) : (
        <div
          data-mobile={isMobile}
          className="min-h-screen bg-gray-50/50 pt-14 pb-4 text-black data-[mobile=true]:pt-39"
        >
          <Header />

          <PullToRefresh onRefresh={handleRefresh} className={cn("min-h-screen")}>
            {/* Header Section */}
            <div className="flex items-center justify-between px-5 py-4">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Профиль</h1>
              <Link to="/profile-sett" preload="viewport">
                <button className="rounded-full p-2 transition-colors transition-transform hover:bg-gray-200 active:scale-90">
                  <Settings className="h-6 w-6 text-gray-900" />
                </button>
              </Link>
            </div>

            {page === "info" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Main Photo Card */}
                <div>
                  <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
                    <div
                      className="relative h-96 w-full touch-pan-y"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <img
                        src={
                          allPhotos[currentIndex] &&
                          allPhotos[currentIndex].startsWith("data:image/")
                            ? allPhotos[currentIndex]
                            : getImageUrl(allPhotos[currentIndex] ?? "")
                        }
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 active:scale-105"
                        onClick={() => {
                          if (didSwipe.current) return;
                          setIsClicked(!isClicked);
                          setIsFullScreen(true);
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Photo Indicators */}
                      {allPhotos.length > 1 && (
                        <div className="absolute top-0 right-0 left-0 z-20 flex gap-1 bg-gradient-to-b from-black/40 to-transparent px-4 py-4">
                          {allPhotos.map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-1 flex-1 rounded-full transition-all duration-300",
                                i === currentIndex ? "bg-white" : "bg-white/40",
                              )}
                            />
                          ))}
                        </div>
                      )}

                      {/* Photo Gallery Strip (Overlaid at bottom) */}
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

                {/* User Info & Level */}
                <div className="relative -mt-6 px-5 pb-6">
                  <div className="relative z-10 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                    <div className="flex flex-col items-center gap-4">
                      {/* Avatar/Level Circle */}
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
                              nextLevel && xpToNext ? Math.min(1, user.xp / xpToNext) : 1;

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

                      {/* Name & Stats */}
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {user?.name} {user?.surname}
                        </h2>
                        <div className="mt-1 flex items-center justify-center gap-2 text-sm font-medium text-gray-500">
                          <span>г. {user?.city}</span>
                          <span>•</span>
                          <span>{userAge} лет</span>
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

                      {/* Stats Cards */}
                      <div className="grid w-full grid-cols-2 gap-3">
                        <div
                          className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl bg-gray-50 p-4 transition-colors transition-transform hover:bg-gray-100 active:scale-[0.98]"
                          onClick={() => {
                            setIsSubscribersPage(true);
                            saveScrollPosition("profile");
                          }}
                        >
                          <span className="text-xl font-bold text-gray-900">
                            {userSubscribers?.length || 0}
                          </span>
                          <span className="text-xs font-medium text-gray-500">
                            Подписчики
                          </span>
                        </div>
                        <div
                          className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl bg-gray-50 p-4 transition-colors transition-transform hover:bg-gray-100 active:scale-[0.98]"
                          onClick={() => {
                            setIsFriendsPage(true);
                            saveScrollPosition("profile");
                          }}
                        >
                          <span className="text-xl font-bold text-gray-900">
                            {uniqueFriends.length || 0}
                          </span>
                          <span className="text-xs font-medium text-gray-500">
                            Друзья
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* About */}
                <div className="px-5 pb-6">
                  <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                    <h3 className="mb-3 text-lg font-bold text-gray-900">Обо мне</h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      {user?.bio ||
                        "Расскажите о себе, чтобы другие пользователи могли узнать вас"}
                    </p>
                  </div>
                </div>

                {/* Profile Completion */}
                <div className="px-5 pb-6">
                  <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
                    <div className="flex items-center p-2">
                      <div className="flex-1 rounded-2xl bg-violet-50 p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-violet-900">Заполненность</span>
                            <span className="text-violet-700">{getPercent()}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/50">
                            <div
                              className="h-full rounded-full bg-violet-600"
                              style={{ width: `${getPercent()}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <Link
                        to="/fill-profile"
                        search={{
                          isSettingsSearch: getPercent() === "100" ? "true" : "false",
                        }}
                        preload="viewport"
                        className="ml-2 flex h-full items-center justify-center rounded-2xl bg-gray-900 px-6 py-4 font-medium text-white transition-colors transition-transform hover:bg-gray-800 active:scale-95"
                      >
                        {getPercent() === "100" ? "Изменить" : "Заполнить"}
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Interests */}
                <div className="px-5 pb-6">
                  <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                    <h3 className="mb-3 text-lg font-bold text-gray-900">Интересы</h3>
                    {user?.interests &&
                    Object.entries(user.interests).filter(([_, v]) => v).length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(user.interests)
                          .filter(([_, value]) => value)
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

                {/* Digital Avatar (Placeholder) */}
                <div className="px-5 pb-6">
                  <div className="flex items-center justify-between rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white shadow-lg shadow-violet-200">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                        <Crown className="h-6 w-6 text-white" />
                      </div>
                      <span className="font-bold">Цифровой аватар</span>
                    </div>
                    <Lock className="h-5 w-5 text-white/60" />
                  </div>
                </div>

                {/* Quests & Meetings Stats */}
                <div className="px-5 pb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/user-quests/$id"
                      params={{ id: user?.id!.toString()! }}
                      preload="viewport"
                      onClick={() => saveScrollPosition("profile")}
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
                      onClick={() => saveScrollPosition("profile")}
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

                {/* Menu */}
                <div className="px-5 pb-24">
                  <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
                    <Link
                      to="/market"
                      preload="viewport"
                      onClick={() => saveScrollPosition("profile")}
                    >
                      <MenuItem
                        icon={<ShoppingCart className="h-5 w-5 text-violet-500" />}
                        title="Маркетплейс"
                      />
                    </Link>
                    <div className="h-px bg-gray-50" />
                    <Link
                      to="/shop"
                      preload="viewport"
                      onClick={() => saveScrollPosition("profile")}
                    >
                      <MenuItem
                        icon={<ShoppingBag className="h-5 w-5 text-violet-500" />}
                        title="Магазин"
                      />
                    </Link>
                    <div className="h-px bg-gray-50" />
                    <Link
                      to="/skills"
                      preload="viewport"
                      onClick={() => saveScrollPosition("profile")}
                    >
                      <MenuItem
                        icon={<BarChart3 className="h-5 w-5 text-violet-500" />}
                        title="Ваши навыки"
                      />
                    </Link>
                    <div className="h-px bg-gray-50" />
                    <Link
                      to="/achievments"
                      preload="viewport"
                      onClick={() => saveScrollPosition("profile")}
                    >
                      <MenuItem
                        icon={<Award className="h-5 w-5 text-violet-500" />}
                        title="Достижения"
                      />
                    </Link>
                    <div className="h-px bg-gray-50" />
                    <Link
                      to="/calendar"
                      preload="viewport"
                      onClick={() => saveScrollPosition("profile")}
                    >
                      <MenuItem
                        icon={<Calendar className="h-5 w-5 text-violet-500" />}
                        title="Календарь"
                      />
                    </Link>
                    <div className="h-px bg-gray-50" />
                    <Link
                      to="/favourites"
                      preload="viewport"
                      onClick={() => saveScrollPosition("profile")}
                    >
                      <MenuItem icon={<FavIcon />} title="Избранное" />
                    </Link>
                    <div className="h-px bg-gray-50" />
                    <Link
                      to="/history"
                      preload="viewport"
                      onClick={() => saveScrollPosition("profile")}
                    >
                      <MenuItem
                        icon={<History className="h-5 w-5 text-violet-500" />}
                        title="История"
                      />
                    </Link>
                    <div className="h-px bg-gray-50" />
                    <Link
                      to="/inventory"
                      preload="viewport"
                      onClick={() => saveScrollPosition("profile")}
                    >
                      <MenuItem
                        icon={<Package className="h-5 w-5 text-violet-500" />}
                        title="Инвентарь"
                      />
                    </Link>
                    <div className="h-px bg-gray-50" />
                    <Link
                      to="/tasks"
                      preload="viewport"
                      onClick={() => saveScrollPosition("profile")}
                    >
                      <MenuItem
                        icon={<Target className="h-5 w-5 text-violet-500" />}
                        title="Задания"
                      />
                    </Link>
                    <div className="h-px bg-gray-50" />
                    <MenuItem
                      onClick={() => {
                        saveScrollPosition("profile");
                        setIsTradesPage(true);
                      }}
                      icon={<Repeat2 className="h-5 w-5 text-violet-500" />}
                      title="Мои обмены"
                    />
                    <div className="h-px bg-gray-50" />
                    <MenuItem
                      onClick={() => setIsWarningsBansOpen(true)}
                      icon={
                        <AlertTriangle
                          className={cn(
                            "h-5 w-5",
                            (warnings?.length || 0) + (bans?.length || 0) > 0
                              ? "text-orange-500"
                              : "text-violet-500",
                          )}
                        />
                      }
                      title="Модерация"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Level Info Modal */}
            <LevelInfoModal
              isOpen={isLevelModalOpen}
              onClose={() => setIsLevelModalOpen(false)}
              currentLevel={user?.level ?? undefined}
              currentXp={user?.xp ?? undefined}
            />

            <FullScreenPhoto
              allPhotos={allPhotos}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              setIsFullScreen={setIsFullScreen}
              isOpen={isFullScreen && allPhotos.length > 0}
            />

            {isWarningsBansOpen && (
              <WarningsBansDrawer
                open={isWarningsBansOpen}
                onOpenChange={(open) => {
                  setIsWarningsBansOpen(open);
                }}
              />
            )}
          </PullToRefresh>
        </div>
      )}
    </>
  );
}

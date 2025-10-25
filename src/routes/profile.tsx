import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  BarChart3,
  Calendar,
  Calendar1,
  ChevronRight,
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
import { useEffect, useMemo, useState } from "react";
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
  const [mainPhoto, setMainPhoto] = useState<string | undefined>(
    user?.photo || undefined,
  );
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>(user?.gallery ?? []);

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
  console.log(completedQuestsData, "completedQuestsData");
  const uncompletedQuestsData = QuestsData?.filter((q) => q.isCompleted === false);
  console.log(uncompletedQuestsData, "uncompletedQuestsData");

  const pageState = uncompletedQuestsData?.length === 0 ? "completed" : "active";

  console.log(pageState, "pageState");

  console.log(userSubscribers, "userSubscribers");

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
          className="min-h-screen overflow-y-auto bg-white pt-14 pb-20 text-black data-[mobile=true]:pt-39"
        >
          <Header />

          <PullToRefresh onRefresh={handleRefresh} className="text-white">
            <motion.div
              className="flex items-center justify-between px-4 py-5"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-black">Профиль</h1>
              </div>
              <Link to="/profile-sett" preload="viewport">
                <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.3 }}>
                  <Settings className="h-5 w-5 cursor-pointer text-black" />
                </motion.div>
              </Link>
            </motion.div>

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
              <motion.div
                className="text-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="relative h-90 overflow-hidden rounded-t-2xl">
                    <motion.img
                      src={
                        mainPhoto && mainPhoto.startsWith("data:image/")
                          ? mainPhoto
                          : getImageUrl(mainPhoto ?? "")
                      }
                      alt=""
                      className="absolute inset-0 h-full w-full cursor-pointer rounded-t-2xl object-cover"
                      onClick={() => {
                        setIsClicked(!isClicked);
                        setCurrentIndex(0);
                        setIsFullScreen(true);
                      }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>

                <motion.div
                  className="scrollbar-hidden scrollbar-hidden flex flex-nowrap gap-2 overflow-x-auto px-4 pt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {galleryPhotos.map((img, idx) => (
                    <motion.img
                      key={idx}
                      src={img.startsWith("data:image/") ? img : getImageUrl(img || "")}
                      alt=""
                      className="h-20 w-20 flex-shrink-0 cursor-pointer rounded-lg object-cover"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.3 + idx * 0.05,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
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
                </motion.div>

                {/* User Info */}
                <motion.div
                  className="flex items-center justify-center gap-4 px-4 py-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="relative flex items-center">
                    {/* Круг с прогресс-баром по XP */}
                    {(() => {
                      // Импортируем уровни и XP
                      // levelsConfig: [{level, xpToNextLevel}, ...]
                      // user?.level, user?.xp
                      // Если нет данных, просто рендерим круг
                      if (!user?.level || user.xp == null) {
                        return (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 bg-purple-600">
                            <span className="text-xl font-bold text-white">
                              {user?.level}
                            </span>
                          </div>
                        );
                      }
                      // Получаем данные о текущем и следующем уровне
                      // levelsConfig[0] - level 1, ...
                      const currentLevelIdx = Math.max(
                        0,
                        levelsConfig.findIndex((l) => l.level === user.level),
                      );
                      const currentLevel = levelsConfig[currentLevelIdx];
                      const nextLevel = levelsConfig[currentLevelIdx + 1];
                      // Сколько XP нужно для следующего уровня
                      const xpToNext = nextLevel
                        ? nextLevel.xpToNextLevel
                        : currentLevel.xpToNextLevel;
                      // Сколько XP у пользователя на этом уровне
                      // Если есть поле user.xp, считаем прогресс
                      // Если нет, показываем полностью закрашенный круг
                      const progress =
                        nextLevel && xpToNext ? Math.min(1, user.xp / xpToNext) : 1;

                      // SVG круг с прогрессом
                      const size = 40;
                      const strokeWidth = 4;
                      const radius = (size - strokeWidth) / 2;
                      const circumference = 2 * Math.PI * radius;
                      const offset = circumference * (1 - progress);

                      return (
                        <motion.div
                          className="relative flex cursor-pointer items-center justify-center"
                          style={{ width: size, height: size }}
                          onClick={() => setIsLevelModalOpen(true)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <svg width={size} height={size}>
                            {/* Серый фон круга */}
                            <circle
                              cx={size / 2}
                              cy={size / 2}
                              r={radius}
                              stroke="#E5E7EB"
                              strokeWidth={strokeWidth}
                              fill="#7C3AED"
                            />
                            {/* Синий прогресс */}
                            <circle
                              cx={size / 2}
                              cy={size / 2}
                              r={radius}
                              stroke="#2563EB"
                              strokeWidth={strokeWidth}
                              fill="none"
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                              style={{
                                transition: "stroke-dashoffset 0.5s",
                              }}
                            />
                          </svg>
                          <span className="absolute top-0 left-0 flex h-full w-full items-center justify-center text-xl font-bold text-white">
                            {user.level}
                          </span>
                        </motion.div>
                      );
                    })()}
                  </div>
                  <div className="text-center">
                    <div className="mb-1 flex items-center justify-center gap-2">
                      <h2 className="text-xl font-bold text-black">
                        {user?.name} {user?.surname}
                      </h2>
                    </div>
                  </div>
                  <motion.div
                    className="flex items-center"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Star className="h-7 w-7 fill-blue-500 text-blue-500" />
                  </motion.div>
                </motion.div>

                <div className="flex items-center justify-between px-4 pb-4">
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    г. {user?.city}, {userAge}
                    <div>
                      {user?.sex === "male" ? (
                        <Mars className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Venus className="h-4 w-4 text-pink-600" />
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-[#FFF2BD] px-2 text-sm">Рейтинг 4.5</div>
                </div>

                {/* TODO: add real followers and real friends count*/}
                <motion.div
                  className="flex items-center justify-center gap-4 px-4 pb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <motion.div
                    className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-gray-200 p-4"
                    onClick={() => {
                      setIsSubscribersPage(true);
                      saveScrollPosition("profile");
                    }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div>{userSubscribers?.length || 0}</div>
                    <div className="text-sm text-neutral-500">Подписчики</div>
                  </motion.div>
                  <motion.div
                    className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-gray-200 p-4"
                    onClick={() => {
                      setIsFriendsPage(true);
                      saveScrollPosition("profile");
                    }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div>{uniqueFriends.length || 0}</div>
                    <div className="text-sm text-neutral-500">Друзья</div>
                  </motion.div>
                </motion.div>

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
                  <Link
                    to="/fill-profile"
                    search={{
                      isSettingsSearch: getPercent() === "100" ? "true" : "false",
                    }}
                    preload="viewport"
                    className="flex h-14 cursor-pointer items-center justify-center rounded-sm rounded-br-2xl bg-[#9924FF] px-4 py-2"
                  >
                    <div className="text-white">
                      {getPercent() === "100" ? "Изменить" : "Заполнить"}
                    </div>
                  </Link>
                </div>

                <div className="mx-4">
                  <div className="flex flex-col items-start justify-between py-3">
                    <h3 className="text-xl font-bold text-black">Интересы</h3>
                    {user?.interests &&
                    Object.entries(user.interests).filter(([key, value]) => value)
                      .length > 0 ? (
                      <div className="mt-2 grid w-full grid-cols-2 gap-2">
                        {Object.entries(user.interests)
                          .filter(([key, value]) => value)
                          .map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                              <div className="text-xs text-gray-500 capitalize">
                                {getInterestLabel(key)}
                              </div>
                              <div className="text-sm font-medium text-black">
                                {value}
                              </div>
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
                    <Link
                      to="/user-quests/$id"
                      params={{ id: user?.id!.toString()! }}
                      preload="viewport"
                      className="rounded-xl bg-yellow-400 p-3 shadow-sm"
                      onClick={() => {
                        saveScrollPosition("profile");
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
                    </Link>
                    <Link
                      to="/user-meetings/$id"
                      params={{ id: user?.id!.toString()! }}
                      preload="viewport"
                      className="rounded-xl bg-purple-600 p-3 shadow-sm"
                      onClick={() => {
                        saveScrollPosition("profile");
                      }}
                    >
                      <div className="mb-1 text-center text-xl font-bold text-white">
                        {userMeetings?.length || 0}
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <Calendar1 className="h-4 w-4 text-white" />
                        <span className="text-sm text-white">Встречи</span>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Interests Section */}

                {/* Menu Items */}
                <div className="mb-6">
                  <div className="space-y-0">
                    <Link
                      to="/market"
                      preload="viewport"
                      onClick={() => {
                        saveScrollPosition("profile");
                      }}
                    >
                      <MenuItem
                        icon={<ShoppingCart className="h-6 w-6 text-purple-300" />}
                        title="Маркетплейс"
                      />
                    </Link>
                    <Link
                      to="/shop"
                      preload="viewport"
                      onClick={() => {
                        saveScrollPosition("profile");
                      }}
                    >
                      <MenuItem
                        icon={<ShoppingBag className="h-6 w-6 text-purple-300" />}
                        title="Магазин"
                      />
                    </Link>
                    <Link
                      to="/skills"
                      preload="viewport"
                      onClick={() => {
                        saveScrollPosition("profile");
                      }}
                    >
                      <MenuItem
                        icon={<BarChart3 className="h-6 w-6 text-purple-300" />}
                        title="Ваши навыки"
                      />
                    </Link>
                    <Link
                      to="/achievments"
                      preload="viewport"
                      onClick={() => {
                        saveScrollPosition("profile");
                      }}
                    >
                      <MenuItem
                        icon={<Award className="h-6 w-6 text-purple-300" />}
                        title="Достижения"
                      />
                    </Link>
                    <Link
                      to="/calendar"
                      preload="viewport"
                      onClick={() => {
                        saveScrollPosition("profile");
                      }}
                    >
                      <MenuItem
                        icon={<Calendar className="h-6 w-6 text-purple-300" />}
                        title="Календарь"
                      />
                    </Link>
                    <Link
                      to="/favourites"
                      preload="viewport"
                      onClick={() => {
                        saveScrollPosition("profile");
                      }}
                    >
                      <MenuItem icon={<FavIcon />} title="Избранное" />
                    </Link>
                    <Link
                      to="/history"
                      preload="viewport"
                      onClick={() => {
                        saveScrollPosition("profile");
                      }}
                    >
                      <MenuItem
                        icon={<History className="h-6 w-6 text-purple-300" />}
                        title="История"
                      />
                    </Link>
                    <Link
                      to="/inventory"
                      preload="viewport"
                      onClick={() => {
                        saveScrollPosition("profile");
                      }}
                    >
                      <MenuItem
                        icon={<Package className="h-6 w-6 text-purple-300" />}
                        title="Инвентарь"
                      />
                    </Link>
                    <Link
                      to="/tasks"
                      preload="viewport"
                      onClick={() => {
                        saveScrollPosition("profile");
                      }}
                    >
                      <MenuItem
                        icon={<Target className="h-6 w-6 text-purple-300" />}
                        title="Задания"
                      />
                    </Link>
                    <MenuItem
                      onClick={() => {
                        saveScrollPosition("profile");
                        setIsTradesPage(true);
                      }}
                      icon={<Repeat2 className="h-6 w-6 text-purple-300" />}
                      title="Мои обмены"
                    />

                    <div
                      onClick={() => setIsWarningsBansOpen(true)}
                      className="flex cursor-pointer items-center justify-between border-b border-gray-100 px-4 py-5 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle
                          className={`h-6 w-6 ${
                            (warnings?.length || 0) + (bans?.length || 0) > 0
                              ? "text-orange-500"
                              : "text-purple-300"
                          }`}
                        />
                        <span className="text-base font-medium text-black">
                          Модерация
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* {page === "friends" && <Friends />} */}

            {/* Level Info Modal */}
            <LevelInfoModal
              isOpen={isLevelModalOpen}
              onClose={() => setIsLevelModalOpen(false)}
              currentLevel={user?.level ?? undefined}
              currentXp={user?.xp ?? undefined}
            />

            {isFullScreen && allPhotos.length > 0 && (
              <FullScreenPhoto
                allPhotos={allPhotos}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
                setIsFullScreen={setIsFullScreen}
              />
            )}

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

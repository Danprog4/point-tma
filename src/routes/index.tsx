import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
import { Calendar } from "~/components/Calendar";
import { Header } from "~/components/Header";
import { Selecter } from "~/components/Selecter";
import { useScrollRestoration } from "~/components/hooks/useScrollRes";

import { EventCard } from "~/components/EventCard";
import FilterDrawer from "~/components/FilterDrawer";
import { WhiteFilter } from "~/components/Icons/WhiteFilter";

import { motion } from "framer-motion";
import PullToRefresh from "react-simple-pull-to-refresh";
import { useSnapshot } from "valtio";
import { CheckInModal } from "~/components/CheckInModal";
import { useFilteredEvents } from "~/hooks/useFilteredEvents";
import { usePlatform } from "~/hooks/usePlatform";
import { calculateStreak } from "~/lib/utils/calculateStreak";
import { lockBodyScroll, unlockBodyScroll } from "~/lib/utils/drawerScroll";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { actions, store } from "~/store/checkInStore";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  useScrollRestoration("home");
  const { isCheckedInToday } = useSnapshot(store);
  const [selectedFilter, setSelectedFilter] = useState("Все");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: popularEvents } = useQuery(trpc.main.getPopularEvents.queryOptions());
  const { data: newEvents } = useQuery(trpc.event.getNewEvents.queryOptions());
  const { data, isLoading } = useQuery(trpc.main.getHello.queryOptions());
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showMapTest, setShowMapTest] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<[number, number] | null>(null);

  // Используем новый хук для кэширования и фильтрации событий
  const {
    events: eventsData,
    eventsByCategory,
    isLoading: eventsLoading,
  } = useFilteredEvents({
    category: selectedFilter === "Все" ? undefined : selectedFilter,
    search,
  });

  // Получаем отфильтрованные данные
  const kinoData = eventsByCategory["Кино"] || [];
  const questsData = eventsByCategory["Квест"] || [];
  const conferencesData = eventsByCategory["Конференция"] || [];
  const partiesData = eventsByCategory["Вечеринка"] || [];

  function ConferenceCard({ conf }: { conf: any }) {
    return (
      <div className="flex flex-col items-center gap-2 text-center text-sm text-nowrap">
        <div className={`h-48 w-36 ${conf.bg || ""} relative overflow-hidden rounded-lg`}>
          {conf.image && (
            <img
              src={conf.image}
              alt={conf.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute bottom-2 left-2">
            <span className="rounded-lg bg-yellow-100 px-2 py-1 text-xs font-bold">
              🎉 Конференция
            </span>
          </div>
          {conf.image && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{conf.title}</h3>
        </div>
      </div>
    );
  }

  const isMobile = usePlatform();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: trpc.event.getEvents.queryKey() });
  };

  const searchAdress = useMutation(trpc.yandex.suggest.mutationOptions());

  // Вычисляем стрик на фронте используя ту же функцию что и на бэке
  const currentStreak = user ? calculateStreak(user) : 0;

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen bg-white pt-14 pb-10 data-[mobile=true]:pt-39"
    >
      <Header />

      <PullToRefresh onRefresh={handleRefresh} className="text-white">
        {!isCheckedInToday && user && (
          <CheckInModal
            onClose={() => {
              actions.setIsCheckedInToday(true);
            }}
            currentStreak={currentStreak}
          />
        )}

        <motion.div
          className="flex items-center justify-between px-4 py-5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-3xl font-bold text-black">Афиша</h1>
        </motion.div>

        <motion.div
          className="mb-4 flex items-center justify-center gap-6 px-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <input
            type="text"
            placeholder="Поиск событий"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black transition-all placeholder:text-black/50 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none"
          />

          <FilterDrawer
            open={isOpen}
            onOpenChange={(open) => {
              if (open) {
                lockBodyScroll();
              } else {
                unlockBodyScroll();
              }
              setIsOpen(open);
            }}
          >
            <motion.div
              className="flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-[#9924FF]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <WhiteFilter />
            </motion.div>
          </FilterDrawer>
        </motion.div>

        <div className="w-full flex-1 overflow-x-hidden overflow-y-auto">
          <div className="flex items-center gap-6 p-4 pb-6">
            <div className="flex items-center gap-2">
              <Selecter height="h-10" width="w-full" placeholder="Алматы" />
            </div>

            <div className="scrollbar-hidden flex flex-nowrap gap-3 overflow-x-auto">
              {[
                { emoji: "🎉", name: "Популярное" },
                { emoji: "🆕", name: "Новое" },
                { emoji: "🎞", name: "Кино" },
                { emoji: "💃", name: "Вечеринки" },
                { emoji: "📈", name: "Конференции" },
                { emoji: "🤝", name: "Нетворкинг" },
                { emoji: "🕵️‍♂️", name: "Квесты" },
              ].map((chip) => (
                <Link
                  key={chip.name}
                  to="/all/$name"
                  params={{ name: chip.name }}
                  preload="viewport"
                  className={`flex flex-row flex-nowrap items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm text-nowrap shadow-sm transition-all ${
                    selectedFilter === chip.name
                      ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                      : "border border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50"
                  }`}
                  onClick={() => {
                    setSelectedFilter(chip.name);
                  }}
                >
                  <span>{chip.emoji}</span>
                  <span className="font-medium">{chip.name}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="relative mb-4 w-full overflow-x-hidden">
            <div className="group relative h-80 w-full overflow-hidden rounded-2xl shadow-xl">
              <video
                src="https://cdn.pixabay.com/video/2022/03/16/110945-689949688_large.mp4"
                className="pointer-events-none absolute top-0 left-0 z-[-1] h-full w-full object-cover transition-transform select-none group-hover:scale-105"
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="absolute top-4 left-4">
                <span className="rounded-full bg-yellow-400 px-3 py-1.5 text-xs font-semibold text-black shadow-lg">
                  ⚽ Футбол
                </span>
              </div>
              <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                <h2 className="mb-2 text-xl font-bold text-white drop-shadow-lg">
                  Матч Динамо Минск и Динамо Москва
                </h2>
                <div className="flex items-center gap-3 text-sm text-white/90">
                  <span className="flex items-center gap-1">📅 15 января</span>
                  <span className="text-white/50">•</span>
                  <span className="flex items-center gap-1">📍 Халык Арена</span>
                </div>
              </div>
            </div>
          </div>

          <Calendar />
          <div className="mx-auto mb-4 flex max-w-[145px] items-center justify-center">
            <Selecter
              height="h-8"
              width="w-full"
              placeholder="Все события"
              cities={[
                "Популярное",
                "Новые",
                "Все события",
                "Кино",
                "Театр",
                "Концерты",
                "Конференции",
                "Вечеринки",
              ]}
            />
          </div>

          <div className="mb-6 w-full overflow-x-hidden">
            <div className="mb-4 flex items-center justify-between px-4">
              <h2 className="text-xl font-bold text-gray-900">Популярное</h2>
              <Link
                to="/all/$name"
                params={{ name: "Популярное" }}
                preload="viewport"
                onClick={() => {
                  saveScrollPosition("home");
                }}
              >
                <ArrowRight className="h-5 w-5 cursor-pointer text-gray-500" />
              </Link>
            </div>
            <div className="scrollbar-hidden flex gap-4 overflow-x-auto text-black">
              {(popularEvents?.slice?.(0, 5) || [])
                .filter((event) =>
                  event.title?.toLowerCase().includes(search.toLowerCase()),
                )
                .map((event: any, idx: number) => (
                  <Link
                    key={idx}
                    to="/event/$name/$id"
                    params={{ name: event.category, id: event.id }}
                    preload="viewport"
                    onClick={() => {
                      saveScrollPosition("home");
                    }}
                  >
                    <EventCard event={event} />
                  </Link>
                ))}
            </div>
          </div>

          <div className="mb-6 w-full overflow-x-hidden">
            <div className="mb-4 flex items-center justify-between px-4 text-black">
              <h2 className="text-xl font-bold text-gray-900">Новое</h2>
              <Link
                to="/all/$name"
                params={{ name: "Новое" }}
                preload="viewport"
                onClick={() => {
                  saveScrollPosition("home");
                }}
              >
                <ArrowRight className="h-5 w-5 cursor-pointer text-gray-500" />
              </Link>
            </div>
            <div className="scrollbar-hidden flex gap-4 overflow-x-auto text-black">
              {(newEvents?.slice?.(0, 5) || [])
                .filter((event) =>
                  event.title?.toLowerCase().includes(search.toLowerCase()),
                )
                .map((event: any, idx: number) => (
                  <Link
                    key={idx}
                    to="/event/$name/$id"
                    params={{ name: event.category, id: event.id }}
                    preload="viewport"
                    onClick={() => {
                      saveScrollPosition("home");
                    }}
                  >
                    <EventCard event={event} />
                  </Link>
                ))}
            </div>
          </div>

          <div className="mb-6 w-full overflow-x-hidden">
            <div className="mb-4 flex items-center justify-between px-4 text-black">
              <h2 className="text-xl font-bold text-gray-900">Кино</h2>
              <Link
                to="/all/$name"
                params={{ name: "Кино" }}
                preload="viewport"
                onClick={() => {
                  saveScrollPosition("home");
                }}
              >
                <ArrowRight className="h-5 w-5 cursor-pointer text-gray-500" />
              </Link>
            </div>
            <div className="scrollbar-hidden flex gap-4 overflow-x-auto text-black">
              {(kinoData?.slice?.(0, 5) || [])
                .filter((event) =>
                  event.title?.toLowerCase().includes(search.toLowerCase()),
                )
                .map((event: any, idx: number) => (
                  <Link
                    key={idx}
                    to="/event/$name/$id"
                    params={{ name: event.category, id: event.id }}
                    preload="viewport"
                    onClick={() => {
                      saveScrollPosition("home");
                    }}
                  >
                    <EventCard event={event} />
                  </Link>
                ))}
            </div>
          </div>

          {/* Quests Section */}
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between px-4 text-black">
              <h2 className="text-xl font-bold text-gray-900">Квесты</h2>
              <Link
                to="/all/$name"
                params={{ name: "Квесты" }}
                preload="viewport"
                onClick={() => {
                  saveScrollPosition("home");
                }}
              >
                <ArrowRight className="h-5 w-5 cursor-pointer text-gray-500" />
              </Link>
            </div>
            <div className="scrollbar-hidden flex gap-4 overflow-x-auto text-black">
              {(questsData?.slice?.(0, 5) || [])
                .filter((event) =>
                  event.title?.toLowerCase().includes(search.toLowerCase()),
                )
                .map((event: any, idx: number) => (
                  <Link
                    key={idx}
                    to="/event/$name/$id"
                    params={{ name: event.category, id: event.id }}
                    preload="viewport"
                    onClick={() => {
                      saveScrollPosition("home");
                    }}
                  >
                    <EventCard event={event} />
                  </Link>
                ))}
            </div>
          </div>

          {/* Banner */}
          <div className="mb-6 px-4 text-black">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true, margin: "-100px" }}
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 p-8 text-white shadow-lg"
            >
              {/* Animated background elements */}
              <motion.div
                className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-3xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-0 -left-8 h-24 w-24 rounded-full bg-white/10 blur-2xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
              />

              <Link
                to="/all/$name"
                params={{ name: "Квесты" }}
                preload="viewport"
                onClick={() => {
                  saveScrollPosition("home");
                }}
              >
                <div className="relative flex items-center justify-between">
                  <motion.div
                    className="flex flex-col gap-1"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    viewport={{ once: true, margin: "-100px" }}
                  >
                    <span className="text-2xl font-bold">Квесты для компании</span>
                    <span className="text-sm font-medium text-white/80">
                      Приключения ждут вас
                    </span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md"
                  >
                    <Plus className="h-6 w-6 text-purple-600" />
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Top Conferences */}
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between px-4 text-black">
              <h2 className="text-xl font-bold text-gray-900">ТОП Конференций</h2>
              <Link
                to="/all/$name"
                params={{ name: "Конференции" }}
                preload="viewport"
                onClick={() => {
                  saveScrollPosition("home");
                }}
              >
                <ArrowRight className="h-5 w-5 cursor-pointer text-gray-500" />
              </Link>
            </div>
            <div className="scrollbar-hidden flex w-full gap-4 overflow-x-auto text-black">
              {(conferencesData?.slice?.(0, 5) || [])
                .filter((conf) =>
                  conf.title?.toLowerCase().includes(search.toLowerCase()),
                )
                .map((conf: any, idx: number) => (
                  <Link
                    key={idx}
                    to="/event/$name/$id"
                    params={{ name: conf.category, id: conf.id }}
                    preload="viewport"
                    onClick={() => {
                      saveScrollPosition("home");
                    }}
                  >
                    <ConferenceCard conf={conf} />
                  </Link>
                ))}
            </div>
          </div>

          {/* Parties Section */}
          <div className="mb-20">
            <div className="mb-4 flex items-center justify-between px-4 text-black">
              <h2 className="text-xl font-bold text-gray-900">Вечеринки</h2>
              <Link
                to="/all/$name"
                params={{ name: "Вечеринки" }}
                preload="viewport"
                onClick={() => {
                  saveScrollPosition("home");
                }}
              >
                <ArrowRight className="h-5 w-5 cursor-pointer text-gray-500" />
              </Link>
            </div>
            <div className="scrollbar-hidden flex gap-4 overflow-x-auto text-black">
              {(partiesData?.slice?.(0, 5) || [])
                .filter((event) =>
                  event.title?.toLowerCase().includes(search.toLowerCase()),
                )
                .map((event: any, idx: number) => (
                  <Link
                    key={idx}
                    to="/event/$name/$id"
                    params={{ name: event.category, id: event.id }}
                    preload="viewport"
                    onClick={() => {
                      saveScrollPosition("home");
                    }}
                  >
                    <EventCard event={event} />
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </PullToRefresh>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar as CalendarIcon, MapPin, Plus, Search } from "lucide-react";
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
import { useFilterConfig } from "~/config/filter";
import { filterEvent, sortEvents, useFilteredEvents } from "~/hooks/useFilteredEvents";
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

  const [filters, setFilters] = useState({
    sortBy: "По дате: новые сначала",
    category: "Все",
    location: "Все",
    type: "Все",
    organizer: "Все",
    isSeries: false,
    hasAchievement: "Все",
    price: { min: 0, max: 1000000 },
  });

  const filterConfig = useFilterConfig(filters.category);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: popularEvents } = useQuery(trpc.main.getPopularEvents.queryOptions());
  const { data: newEvents } = useQuery(trpc.event.getNewEvents.queryOptions());
  const { data, isLoading } = useQuery(trpc.main.getHello.queryOptions());
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Используем новый хук для кэширования и фильтрации событий
  const filterOptions = {
    sortBy: filters.sortBy,
    category: filters.category === "Все" ? undefined : filters.category,
    search,
    location: filters.location === "Все" ? undefined : filters.location,
    type: filters.type === "Все" ? undefined : filters.type,
    organizer: filters.organizer === "Все" ? undefined : filters.organizer,
    isSeries: filters.isSeries,
    hasAchievement: filters.hasAchievement === "Все" ? undefined : filters.hasAchievement,
    priceRange: filters.price,
    date: selectedDate || undefined,
  };

  const {
    events: eventsData,
    eventsByCategory,
    isLoading: eventsLoading,
  } = useFilteredEvents(filterOptions);

  // Filter popular and new events manually
  const filteredPopularEvents = sortEvents(
    (popularEvents || []).filter((event: any) => filterEvent(event, filterOptions)),
    filters.sortBy,
  );

  const filteredNewEvents = sortEvents(
    (newEvents || []).filter((event: any) => filterEvent(event, filterOptions)),
    filters.sortBy,
  );

  // Получаем отфильтрованные данные
  const kinoData = eventsData.filter((e) => e.category === "Кино");
  const questsData = eventsData.filter((e) => e.category === "Квест");
  const conferencesData = eventsData.filter((e) => e.category === "Конференция");
  const partiesData = eventsData.filter((e) => e.category === "Вечеринка");

  console.log(eventsByCategory);

  function ConferenceCard({ conf }: { conf: any }) {
    return (
      <div className="group relative flex w-[160px] flex-col gap-3 overflow-hidden rounded-2xl transition-all hover:scale-[1.02]">
        <div
          className={`relative h-[220px] w-full overflow-hidden rounded-2xl ${conf.bg || "bg-gray-100"}`}
        >
          {conf.image && (
            <img
              src={conf.image}
              alt={conf.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute top-3 left-3">
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
              Конференция
            </span>
          </div>

          <div className="absolute right-3 bottom-3 left-3">
            <h3 className="line-clamp-3 text-sm leading-tight font-bold text-white">
              {conf.title}
            </h3>
            {conf.date && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-white/80">
                <CalendarIcon className="h-3 w-3" />
                <span>{conf.date}</span>
              </div>
            )}
          </div>
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

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };

      // Reset type when category changes
      if (key === "category" && value !== prev.category) {
        newFilters.type = "Все";
      }

      return newFilters;
    });
  };

  const hasAnyEvents =
    filteredPopularEvents.length > 0 ||
    filteredNewEvents.length > 0 ||
    kinoData.length > 0 ||
    questsData.length > 0 ||
    conferencesData.length > 0 ||
    partiesData.length > 0;

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen bg-[#FAFAFA] pt-20 pb-24 data-[mobile=true]:pt-39"
    >
      <Header />

      <PullToRefresh onRefresh={handleRefresh} className="text-purple-500">
        {!isCheckedInToday && user && (
          <CheckInModal
            onClose={() => {
              actions.setIsCheckedInToday(true);
            }}
            currentStreak={currentStreak}
          />
        )}

        <motion.div
          className="flex items-center justify-between px-5 py-4 pt-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-[32px] font-extrabold tracking-tight text-gray-900">
            Афиша
          </h1>
        </motion.div>

        <motion.div
          className="mb-6 px-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск событий, мест..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full rounded-2xl border-none bg-white pr-4 pl-4 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-gray-100 transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

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
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={() => {
                setFilters({
                  sortBy: "По дате: новые сначала",
                  category: "Все",
                  location: "Все",
                  type: "Все",
                  organizer: "Все",
                  isSeries: false,
                  hasAchievement: "Все",
                  price: { min: 0, max: 1000000 },
                });
                setSearch("");
                setSelectedDate(null);
              }}
              config={filterConfig.main}
            >
              <motion.button
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-200 transition-colors hover:bg-purple-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
              >
                <WhiteFilter />
              </motion.button>
            </FilterDrawer>
          </div>
        </motion.div>

        <div className="w-full flex-1 overflow-x-hidden">
          <div className="mb-8">
            <div className="flex items-center gap-4 px-5 pb-2">
              {/* <div className="w-[140px]">
                <Selecter height="h-10" width="w-full" placeholder="Алматы" />
              </div> */}

              <div className="scrollbar-hidden flex flex-1 gap-2 overflow-x-auto py-2">
                {[
                  { emoji: "🔥", name: "Популярное" },
                  { emoji: "🆕", name: "Новое" },
                  { emoji: "🎬", name: "Кино" },
                  { emoji: "💃", name: "Вечеринки" },
                  { emoji: "🎤", name: "Конференции" },
                  { emoji: "🤝", name: "Нетворкинг" },
                  { emoji: "🧩", name: "Квесты" },
                ].map((chip) => (
                  <Link
                    key={chip.name}
                    to="/all/$name"
                    params={{ name: chip.name }}
                    preload="viewport"
                    className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50"
                    onClick={() => {
                      if (chip.name === "Популярное" || chip.name === "Новое") {
                        setFilters((prev) => ({ ...prev, category: "Все" }));
                      } else {
                        setFilters((prev) => ({ ...prev, category: chip.name }));
                      }
                    }}
                  >
                    <span>{chip.emoji}</span>
                    <span>{chip.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mb-8 w-full px-5">
            <div className="group relative h-[280px] w-full overflow-hidden rounded-[32px] shadow-2xl shadow-gray-200">
              <video
                src="https://cdn.pixabay.com/video/2022/03/16/110945-689949688_large.mp4"
                className="pointer-events-none absolute top-0 left-0 z-[-1] h-full w-full object-cover transition-transform select-none group-hover:scale-105"
                autoPlay
                muted
                loop
                playsInline
              />
              <div className="absolute top-5 left-5 z-10">
                <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
                  ⚽ Матч дня
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute right-0 bottom-0 left-0 p-6">
                <h2 className="mb-2 text-2xl leading-tight font-bold text-white">
                  Динамо Минск vs <br /> Динамо Москва
                </h2>
                <div className="flex items-center gap-4 text-sm font-medium text-white/90">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4" /> 15 января
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/50" />
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> Халык Арена
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Calendar
            selectedDate={selectedDate}
            onDateSelect={(date) => setSelectedDate(date)}
          />

          <div className="mx-auto mt-4 mb-8 flex w-[160px] items-center justify-center">
            <Selecter
              height="h-9"
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

          {/* Popular Events */}
          {filteredPopularEvents.length > 0 && (
            <div className="mb-10 w-full overflow-x-hidden">
              <div className="mb-5 flex items-center justify-between px-5">
                <h2 className="text-[22px] font-bold text-gray-900">Популярное</h2>
                <Link
                  to="/all/$name"
                  params={{ name: "Популярное" }}
                  preload="viewport"
                  onClick={() => saveScrollPosition("home")}
                  className="flex items-center justify-center rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                >
                  <ArrowRight className="h-4 w-4 text-gray-600" />
                </Link>
              </div>
              <div className="scrollbar-hidden flex gap-4 overflow-x-auto px-5 pb-4">
                {(filteredPopularEvents?.slice?.(0, 5) || []).map(
                  (event: any, idx: number) => (
                    <Link
                      key={idx}
                      to="/event/$name/$id"
                      params={{ name: event.category, id: event.id }}
                      preload="viewport"
                      onClick={() => saveScrollPosition("home")}
                      className="flex-shrink-0"
                    >
                      <EventCard event={event} />
                    </Link>
                  ),
                )}
              </div>
            </div>
          )}

          {/* New Events */}
          {filteredNewEvents.length > 0 && (
            <div className="mb-10 w-full overflow-x-hidden">
              <div className="mb-5 flex items-center justify-between px-5">
                <h2 className="text-[22px] font-bold text-gray-900">Новое</h2>
                <Link
                  to="/all/$name"
                  params={{ name: "Новое" }}
                  preload="viewport"
                  onClick={() => saveScrollPosition("home")}
                  className="flex items-center justify-center rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                >
                  <ArrowRight className="h-4 w-4 text-gray-600" />
                </Link>
              </div>
              <div className="scrollbar-hidden flex gap-4 overflow-x-auto px-5 pb-4">
                {(filteredNewEvents?.slice?.(0, 5) || []).map(
                  (event: any, idx: number) => (
                    <Link
                      key={idx}
                      to="/event/$name/$id"
                      params={{ name: event.category, id: event.id }}
                      preload="viewport"
                      onClick={() => saveScrollPosition("home")}
                      className="flex-shrink-0"
                    >
                      <EventCard event={event} />
                    </Link>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Cinema */}
          {kinoData.length > 0 && (
            <div className="mb-10 w-full overflow-x-hidden">
              <div className="mb-5 flex items-center justify-between px-5">
                <h2 className="text-[22px] font-bold text-gray-900">Кино</h2>
                <Link
                  to="/all/$name"
                  params={{ name: "Кино" }}
                  preload="viewport"
                  onClick={() => saveScrollPosition("home")}
                  className="flex items-center justify-center rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                >
                  <ArrowRight className="h-4 w-4 text-gray-600" />
                </Link>
              </div>
              <div className="scrollbar-hidden flex gap-4 overflow-x-auto px-5 pb-4">
                {(kinoData?.slice?.(0, 5) || []).map((event: any, idx: number) => (
                  <Link
                    key={idx}
                    to="/event/$name/$id"
                    params={{ name: event.category, id: event.id }}
                    preload="viewport"
                    onClick={() => saveScrollPosition("home")}
                    className="flex-shrink-0"
                  >
                    <EventCard event={event} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quests Promo */}
          {questsData.length > 0 && (
            <div className="mb-10 px-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, margin: "-50px" }}
                className="group relative overflow-hidden rounded-[32px] bg-[#1A1A1A] p-8 text-white shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 via-transparent to-blue-600/30 opacity-50" />
                <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />

                <Link
                  to="/all/$name"
                  params={{ name: "Квесты" }}
                  preload="viewport"
                  onClick={() => saveScrollPosition("home")}
                  className="relative z-10 flex items-center justify-between"
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-lg font-medium text-purple-300">
                      Приключения
                    </span>
                    <span className="text-3xl leading-tight font-extrabold">
                      Квесты для
                      <br />
                      компании
                    </span>
                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-white/70 group-hover:text-white">
                      <span>Выбрать квест</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-110 group-hover:bg-white/20">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                </Link>
              </motion.div>
            </div>
          )}

          {/* Quests List */}
          {questsData.length > 0 && (
            <div className="mb-10">
              <div className="mb-5 flex items-center justify-between px-5">
                <h2 className="text-[22px] font-bold text-gray-900">Квесты</h2>
                <Link
                  to="/all/$name"
                  params={{ name: "Квесты" }}
                  preload="viewport"
                  onClick={() => saveScrollPosition("home")}
                  className="flex items-center justify-center rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                >
                  <ArrowRight className="h-4 w-4 text-gray-600" />
                </Link>
              </div>
              <div className="scrollbar-hidden flex gap-4 overflow-x-auto px-5 pb-4">
                {(questsData?.slice?.(0, 5) || []).map((event: any, idx: number) => (
                  <Link
                    key={idx}
                    to="/event/$name/$id"
                    params={{ name: event.category, id: event.id }}
                    preload="viewport"
                    onClick={() => saveScrollPosition("home")}
                    className="flex-shrink-0"
                  >
                    <EventCard event={event} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Conferences */}
          {conferencesData.length > 0 && (
            <div className="mb-10">
              <div className="mb-5 flex items-center justify-between px-5">
                <h2 className="text-[22px] font-bold text-gray-900">Конференции</h2>
                <Link
                  to="/all/$name"
                  params={{ name: "Конференции" }}
                  preload="viewport"
                  onClick={() => saveScrollPosition("home")}
                  className="flex items-center justify-center rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                >
                  <ArrowRight className="h-4 w-4 text-gray-600" />
                </Link>
              </div>
              <div className="scrollbar-hidden flex gap-4 overflow-x-auto px-5 pb-4">
                {(conferencesData?.slice?.(0, 5) || []).map((conf: any, idx: number) => (
                  <Link
                    key={idx}
                    to="/event/$name/$id"
                    params={{ name: conf.category, id: conf.id }}
                    preload="viewport"
                    onClick={() => saveScrollPosition("home")}
                    className="flex-shrink-0"
                  >
                    <ConferenceCard conf={conf} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Parties */}
          {partiesData.length > 0 && (
            <div className="mb-10">
              <div className="mb-5 flex items-center justify-between px-5">
                <h2 className="text-[22px] font-bold text-gray-900">Вечеринки</h2>
                <Link
                  to="/all/$name"
                  params={{ name: "Вечеринки" }}
                  preload="viewport"
                  onClick={() => saveScrollPosition("home")}
                  className="flex items-center justify-center rounded-full bg-gray-100 p-2 transition-colors hover:bg-gray-200"
                >
                  <ArrowRight className="h-4 w-4 text-gray-600" />
                </Link>
              </div>
              <div className="scrollbar-hidden flex gap-4 overflow-x-auto px-5 pb-4">
                {(partiesData?.slice?.(0, 5) || []).map((event: any, idx: number) => (
                  <Link
                    key={idx}
                    to="/event/$name/$id"
                    params={{ name: event.category, id: event.id }}
                    preload="viewport"
                    onClick={() => saveScrollPosition("home")}
                    className="flex-shrink-0"
                  >
                    <EventCard event={event} />
                  </Link>
                ))}
              </div>
            </div>
          )}
          {/* Empty State */}
          {!hasAnyEvents && !eventsLoading && (
            <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
              <div className="mb-4 text-6xl">😔</div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                К сожалению, ничего не найдено
              </h3>
              <p className="max-w-[300px] text-gray-500">
                Попробуйте изменить фильтры или поискать что-то другое
              </p>
              <button
                onClick={() => {
                  setFilters({
                    sortBy: "По дате: новые сначала",
                    category: "Все",
                    location: "Все",
                    type: "Все",
                    organizer: "Все",
                    isSeries: false,
                    hasAchievement: "Все",
                    price: { min: 0, max: 1000000 },
                  });
                  setSearch("");
                  setSelectedDate(null);
                }}
                className="mt-6 rounded-2xl bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}

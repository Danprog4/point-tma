import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Plus, Search, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PullToRefresh from "react-simple-pull-to-refresh";
import { Calendar } from "~/components/Calendar";
import FilterDrawer from "~/components/FilterDrawer";
import { Header } from "~/components/Header";
import { useInfiniteScroll, useScrollRestoration } from "~/components/hooks/useScrollRes";
import { WhiteFilter } from "~/components/Icons/WhiteFilter";
import { Spinner } from "~/components/Spinner";
import { usePlatform } from "~/hooks/usePlatform";
import { cn } from "~/lib/utils";
import { lockBodyScroll, unlockBodyScroll } from "~/lib/utils/drawerScroll";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/meetings")({
  component: RouteComponent,
});

function RouteComponent() {
  useScrollRestoration("meetings");
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery(
      trpc.meetings.getMeetingsPagination.infiniteQueryOptions(
        {
          limit: 5,
        },
        {
          getNextPageParam: (lastPage) => lastPage.nextCursor,
          staleTime: 2 * 60 * 1000,
          gcTime: 5 * 60 * 1000,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          refetchOnReconnect: false,
        },
      ),
    );

  const handleRefresh = async () => {
    setIsFetchingMore(true);
    await queryClient.invalidateQueries({
      queryKey: trpc.meetings.getMeetings.queryKey(),
    });
    setIsFetchingMore(false);
  };

  const { data: meetRequests } = useQuery(trpc.meetings.getRequests.queryOptions());
  const activeMeetRequests = meetRequests?.filter(
    (request) => request.status === "pending",
  );

  const loadMoreRef = useInfiniteScroll(
    () => fetchNextPage(),
    isFetchingNextPage,
    hasNextPage || false,
    200,
  );

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && data?.pages.length) {
      const timer = setTimeout(() => {
        fetchNextPage();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, data?.pages.length]);

  const allMeetings = data?.pages.flatMap((page) => page.items) ?? [];

  const [activeFilter, setActiveFilter] = useState("Все");
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filters = ["Все", "Конференции", "Вечеринки", "Квесты", "Кино", "Нетворкинг"];
  const filterMap = {
    Все: null,
    Конференции: "Конференция",
    Вечеринки: "Вечеринка",
    Квесты: "Квест",
    Кино: "Кино",
    Нетворкинг: "Нетворкинг",
  };

  const filteredMeetings = useMemo(() => {
    return allMeetings
      ?.filter((m: any) => !m.isCompleted)
      ?.filter((meeting: any) => {
        if (activeFilter === "Все") return true;
        return meeting.type === filterMap[activeFilter as keyof typeof filterMap];
      })
      .filter((meeting: any) => {
        const eventTitle = meeting.name || "Без названия";
        const organizerName = meeting.user?.name || "Неизвестно";
        return (
          eventTitle.toLowerCase().includes(search.toLowerCase()) ||
          organizerName.toLowerCase().includes(search.toLowerCase())
        );
      });
  }, [allMeetings, activeFilter, search]);

  const isMobile = usePlatform();

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen bg-gray-50/50 pt-14 pb-32 data-[mobile=true]:pt-39"
    >
      <Header />

      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
        <div className="flex flex-col space-y-6">
          {/* Page Title & My Meetings Link */}
          <div className="flex items-center justify-between px-5 pt-4">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold tracking-tight text-gray-900"
            >
              Встречи
            </motion.h1>

            <Link
              to="/my-meetings"
              preload="viewport"
              onClick={() => saveScrollPosition("meetings")}
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-gray-200"
              >
                <span>Мои встречи</span>
                {activeMeetRequests && activeMeetRequests.length > 0 && (
                  <span className="absolute top-0 -right-1 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                  </span>
                )}
              </motion.button>
            </Link>
          </div>

          {/* Search & Filter */}
          <div className="px-5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Поиск встреч..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 w-full rounded-2xl border-none bg-white pr-4 pl-11 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 transition-all outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <FilterDrawer
                open={isOpen}
                onOpenChange={(open) => {
                  if (open) lockBodyScroll();
                  else unlockBodyScroll();
                  setIsOpen(open);
                }}
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200 transition-colors hover:bg-violet-700"
                >
                  <WhiteFilter />
                </motion.button>
              </FilterDrawer>
            </div>
          </div>

          {/* Calendar */}
          <div className="px-1">
            <Calendar />
          </div>

          {/* Categories */}
          <div className="scrollbar-hidden flex gap-2 overflow-x-auto px-5 pb-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-95",
                  activeFilter === filter
                    ? "bg-gray-900 text-white shadow-lg shadow-gray-200"
                    : "bg-white text-gray-600 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50",
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Actual/Featured Meetings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-5">
              <h2 className="text-lg font-bold text-gray-900">Актуальные встречи</h2>
            </div>

            <div className="scrollbar-hidden flex gap-4 overflow-x-auto px-5 pb-4">
              {allMeetings?.slice(0, 7).map((event: any, idx: number) => (
                <Link
                  key={idx}
                  to="/meet/$id"
                  params={{ id: event.id.toString() }}
                  preload="viewport"
                  onClick={() => saveScrollPosition("meetings")}
                >
                  <div className="relative h-[200px] w-[280px] flex-shrink-0 overflow-hidden rounded-3xl bg-white shadow-md transition-transform duration-200 active:scale-[0.98]">
                    <img
                      src={getImageUrl(event.image!)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    <div className="absolute right-0 bottom-0 left-0 p-4">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-lg bg-white/20 px-2 py-1 text-xs font-medium text-white backdrop-blur-md">
                          Сегодня
                        </span>
                      </div>
                      <h3 className="line-clamp-2 text-base font-bold text-white">
                        {event.name || "Без названия"}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Main Meetings Feed */}
          <div className="px-5 pb-24">
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner />
                </div>
              ) : (
                <>
                  {filteredMeetings?.map((meeting: any) => (
                    <Link
                      key={meeting.id}
                      to="/meet/$id"
                      params={{ id: meeting.id?.toString() || "" }}
                      preload="viewport"
                      onClick={() => saveScrollPosition("meetings")}
                      className="block"
                    >
                      <div className="overflow-hidden rounded-3xl bg-white p-3 shadow-sm ring-1 ring-gray-100 transition-transform duration-200 active:scale-[0.98]">
                        <div className="flex gap-4">
                          {/* Left: Image */}
                          <div className="relative h-32 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                            <img
                              src={getImageUrl(meeting.image || "")}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>

                          {/* Right: Content */}
                          <div className="flex flex-1 flex-col justify-between py-1">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="line-clamp-2 text-base leading-tight font-bold text-gray-900">
                                  {meeting.name || "Без названия"}
                                </h3>
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                                {meeting.description}
                              </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 overflow-hidden rounded-full ring-2 ring-gray-50">
                                  <img
                                    src={getImageUrl(meeting.user?.photo || "")}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <span className="max-w-[100px] truncate text-xs font-medium text-gray-700">
                                  {meeting.user?.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600">
                                <Users className="h-3 w-3" />
                                <span>{meeting.participantsCount || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Info */}
                        <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">
                              {meeting.locations?.[0]?.location || "Москва"}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-violet-600">
                            15:30
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>

            {/* Loader */}
            <div ref={loadMoreRef} className="flex justify-center py-6">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-gray-100">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent"></div>
                  <span className="text-xs font-medium text-gray-600">Загрузка...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </PullToRefresh>

      {/* FAB: Create Meeting */}
      {!isFetchingMore && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed right-5 bottom-24 z-30"
          >
            <Link
              to="/createMeet"
              preload="viewport"
              onClick={() => saveScrollPosition("meetings")}
            >
              <button className="group flex items-center gap-2 rounded-full bg-gray-900 py-3.5 pr-5 pl-4 text-white shadow-xl shadow-gray-900/20 transition-all hover:bg-gray-800 active:scale-95">
                <Plus className="h-5 w-5" />
                <span className="font-bold">Создать</span>
              </button>
            </Link>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

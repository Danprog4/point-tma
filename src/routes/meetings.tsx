import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Calendar } from "~/components/Calendar";
import FilterDrawer from "~/components/FilterDrawer";
import { Header } from "~/components/Header";
import { useInfiniteScroll, useScrollRestoration } from "~/components/hooks/useScrollRes";
import { LocationIcon } from "~/components/Icons/Location";
import { WhiteFilter } from "~/components/Icons/WhiteFilter";
import { usePlatform } from "~/hooks/usePlatform";
import { lockBodyScroll, unlockBodyScroll } from "~/lib/utils/drawerScroll";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/meetings")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  useScrollRestoration("meetings");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    trpc.meetings.getMeetingsPagination.infiniteQueryOptions(
      {
        limit: 8, // Увеличиваем лимит для лучшей производительности
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        // Добавляем кэширование
        staleTime: 2 * 60 * 1000, // 2 минуты
        gcTime: 5 * 60 * 1000, // 5 минут
        // Оптимизация для мобильных устройств
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        // Предзагрузка следующей страницы
        refetchOnReconnect: false,
      },
    ),
  );

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.meetings.getMeetingsPagination.queryKey(),
    });
  };

  const { data: meetRequests } = useQuery(trpc.meetings.getRequests.queryOptions());
  const activeMeetRequests = meetRequests?.filter(
    (request) => request.status === "pending",
  );

  // Используем хук для бесконечной прокрутки
  const loadMoreRef = useInfiniteScroll(
    () => fetchNextPage(),
    isFetchingNextPage,
    hasNextPage || false,
    200,
  );

  // Предзагрузка следующей страницы для улучшения UX
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && data?.pages.length) {
      const timer = setTimeout(() => {
        fetchNextPage();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, data?.pages.length]);

  // Объединяем все страницы данных
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

  // Фильтрация встреч
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
      className="min-h-screen overflow-y-auto bg-white pt-14 pb-32 data-[mobile=true]:pt-39"
    >
      {/* Top Navigation */}
      <Header />

      {/* Page Title */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-black">Встречи</h1>
        </div>
        <div
          className="flex cursor-pointer items-center justify-center rounded-full bg-[#F3E5FF] px-4 py-2 text-sm font-medium text-black"
          style={{ boxShadow: "0px 4px 16px 0px #9924FF66" }}
          onClick={() => {
            saveScrollPosition("meetings");
            navigate({ to: "/my-meetings" });
          }}
        >
          {activeMeetRequests && activeMeetRequests?.length > 0 ? (
            <div className="relative">
              Мои встречи
              <div className="absolute top-0 right-[-10px] rounded-full bg-red-500"></div>
            </div>
          ) : (
            "Мои встречи"
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-center gap-6 px-4">
        <input
          type="text"
          placeholder="Поиск встреч"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
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
          <div className="flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-[#9924FF]">
            <WhiteFilter />
          </div>
        </FilterDrawer>
      </div>

      <Calendar />

      <div className="scrollbar-hidden flex w-full flex-1 items-center gap-6 overflow-x-auto px-4">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter
                ? "bg-black text-white"
                : "border-gray-200 bg-white text-black"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Meetings List */}
      <div className="scrollbar-hidden flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 mt-4 w-full px-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Актуальные встречи</h2>
              <ArrowRight className="h-5 w-5 text-gray-500" />
            </div>
            <div className="scrollbar-hidden flex gap-4 overflow-x-auto">
              {allMeetings?.slice(0, 7).map((event: any, idx: number) => (
                <div
                  onClick={() => {
                    saveScrollPosition("meetings");
                    navigate({
                      to: "/meet/$id",
                      params: { id: event.id.toString() },
                    });
                  }}
                  key={idx}
                  className="h-[25vh] w-[40vw] flex-shrink-0 overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <div className={`relative h-full w-full`}>
                    <img
                      src={getImageUrl(event.image!)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2">
                      <span className="rounded-lg bg-yellow-100 px-2 py-1 text-xs font-bold">
                        {event.name?.slice(0, 10) +
                          (event.name?.length! > 10 ? "..." : "")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Meetings List with alternating layout */}
          <div className="scrollbar-hidden col-span-2 space-y-4">
            {filteredMeetings?.map((meeting: any, groupIndex: number) => (
              <div key={meeting.id || groupIndex}>
                <div
                  className="cursor-pointer overflow-hidden rounded-2xl"
                  onClick={() => {
                    saveScrollPosition("meetings");
                    navigate({
                      to: "/meet/$id",
                      params: { id: meeting.id?.toString() || "" },
                    });
                  }}
                >
                  {/* Avatar Section */}
                  <div className="relative h-90 w-full rounded-2xl">
                    <img
                      src={getImageUrl(meeting.image || "")}
                      alt={meeting.user?.name || ""}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  {/* Text Content */}
                  <div className="px-4">
                    <div className="py-2">
                      <div className="space-y-1">
                        <h3 className="text-lg leading-tight font-bold text-gray-900">
                          {meeting?.name}
                        </h3>
                        <p className="line-clamp-2 text-xs leading-tight text-gray-600">
                          {meeting.description || "Без названия"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full">
                        <img
                          src={getImageUrl(
                            meeting.user?.photo ||
                              meeting.user?.photoUrl ||
                              meeting.image ||
                              "",
                          )}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="font-bold">
                          {meeting.user?.name || "Неизвестно"}
                        </div>
                        <div className="text-sm text-neutral-500">Организатор</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <LocationIcon />
                        <div className="text-sm text-neutral-500">
                          {meeting.locations?.[0]?.location || "Москва"}
                        </div>
                      </div>
                      <div className="text-sm text-neutral-500">Сегодня в 15:30</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Лоадер для пагинации */}
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-purple-600"></div>
                  <span className="text-sm text-gray-500">Загрузка...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="fixed right-4 bottom-20 left-4">
        <button
          onClick={() => {
            saveScrollPosition("meetings");
            navigate({ to: "/createMeet" });
          }}
          className="w-full rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
        >
          Создать встречу
        </button>
      </div>
    </div>
  );
}

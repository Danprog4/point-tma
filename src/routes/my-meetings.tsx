import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  PlusCircle,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useScrollRestoration } from "~/components/hooks/useScrollRes";
import { Coin } from "~/components/Icons/Coin";
import { MeetCard } from "~/components/MeetCard";
import { usePlatform } from "~/hooks/usePlatform";
import { useRequests } from "~/hooks/useRequests";
import { cn } from "~/lib/utils/cn";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
import { Quest } from "~/types/quest";

export const Route = createFileRoute("/my-meetings")({
  component: RouteComponent,
});

function RouteComponent() {
  useScrollRestoration("my-meetings");
  const [activeFilter, setActiveFilter] = useState("Активные");
  const trpc = useTRPC();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const { data: meetings, refetch: refetchMeetings } = useQuery({
    ...trpc.meetings.getMeetings.queryOptions(),
    staleTime: 0,
  });
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const [search, setSearch] = useState<string>("");

  const {
    pendingInvitesInfo: invitesWithInfo,
    pendingRequestsInfo: requestsWithInfo,
    accept: handleAcceptRequest,
    decline: handleDeclineRequest,
  } = useRequests(user?.id, meetings || [], users || []);

  const { data: participants, refetch: refetchParticipants } = useQuery({
    ...trpc.meetings.getParticipants.queryOptions(),
    staleTime: 0,
  });

  useEffect(() => {
    refetchMeetings();
  }, [refetchMeetings, activeFilter]);

  const createdMeetings = useMemo(() => {
    return meetings?.filter((m) => m.userId === user?.id) || [];
  }, [meetings, user?.id]);

  const acceptedMeetings = useMemo(() => {
    if (!participants || !meetings) return [];

    const acceptedIds = participants
      .filter(
        (p: any) =>
          p.status === "accepted" &&
          (p.toUserId === user?.id || p.fromUserId === user?.id),
      )
      .map((p: any) => p.meetId);

    return meetings.filter((m) => acceptedIds.includes(m.id));
  }, [participants, meetings, user?.id]);

  const meetingsWithEvents = useMemo(() => {
    const combined = [...createdMeetings, ...acceptedMeetings];
    const uniqueMap = new Map(combined.map((m) => [m.id, m]));
    return Array.from(uniqueMap.values());
  }, [createdMeetings, acceptedMeetings]);

  const completedMeetings = useMemo(() => {
    return meetingsWithEvents?.filter((m) => m.isCompleted) || [];
  }, [meetingsWithEvents]);

  const activeMeetings = useMemo(() => {
    return meetingsWithEvents?.filter((m) => !m.isCompleted) || [];
  }, [meetingsWithEvents]);

  const filters = [
    { name: "Активные", count: activeMeetings?.length || 0 },
    { name: "Завершенные", count: completedMeetings?.length || 0 },
    { name: "Приглашения", count: invitesWithInfo?.length || 0 },
    { name: "Заявки", count: requestsWithInfo?.length || 0 },
  ];

  const isMobile = usePlatform();

  // Reusable list item component for consistency
  const MeetingListItem = ({
    item,
    type,
  }: {
    item: any;
    type: "active" | "completed";
  }) => {
    const isCustom = item?.isCustom;
    const description = isCustom ? item?.description : item?.meeting?.description;
    const truncatedDesc =
      description && description.length > 80
        ? description.slice(0, 80) + "..."
        : description;

    const date = item?.date || item?.meeting?.date;
    const time = item?.time || item?.meeting?.time;

    return (
      <div
        className="group relative overflow-hidden rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md active:scale-[0.99]"
        onClick={() => {
          // Use MeetCard logic or navigation directly
          // For now assuming direct navigation as in original MeetCard
        }}
      >
        <MeetCard meet={item || ({} as Quest)} isNavigable={true} />

        {/* Additional Info Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {date && (
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {date}
              </div>
            )}
            {time && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {time}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {item?.meeting?.hasAchievement && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-600">
                Достижение
              </span>
            )}
            {(item?.meeting as any)?.rewards?.find((r: any) => r.type === "point") && (
              <div className="flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5">
                <span className="text-xs font-bold text-yellow-700">
                  +
                  {(item?.meeting as any)?.rewards
                    ?.find((r: any) => r.type === "point")
                    ?.value?.toLocaleString()}
                </span>
                <Coin />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen bg-[#FAFAFA] pb-20 data-[mobile=true]:pt-24"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white/80 px-4 py-4 backdrop-blur-xl data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => window.history.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:bg-gray-100 active:scale-95"
        >
          <ArrowLeft className="h-6 w-6 text-gray-900" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Мои встречи</h1>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full text-violet-600 transition-transform hover:bg-violet-50 active:scale-95"
          onClick={() => navigate({ to: "/createMeet" })}
        >
          <PlusCircle className="h-6 w-6" strokeWidth={2} />
        </button>
      </div>

      <div className="pt-24 data-[mobile=true]:pt-36">
        {/* Search Bar */}
        <div className="mb-4 px-4">
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-violet-500" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию..."
              className="block w-full rounded-2xl border-none bg-white py-3 pr-4 pl-10 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 transition-shadow placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="scrollbar-hidden mb-6 flex w-full gap-2 overflow-x-auto px-4 pb-2">
          {filters.map((filter) => (
            <button
              key={filter.name}
              onClick={() => setActiveFilter(filter.name)}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold whitespace-nowrap transition-all active:scale-95",
                activeFilter === filter.name
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                  : "bg-white text-gray-600 shadow-sm ring-1 ring-gray-100 hover:bg-gray-50",
              )}
            >
              {filter.name}
              {filter.count > 0 && (
                <span
                  className={cn(
                    "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px]",
                    activeFilter === filter.name
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600",
                  )}
                >
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-4 px-4 pb-10">
          <AnimatePresence mode="wait">
            {activeFilter === "Активные" && (
              <motion.div
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                {activeMeetings?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 rounded-full bg-gray-50 p-6">
                      <CalendarDays className="h-12 w-12 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Нет активных встреч
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Создайте новую встречу или примите приглашение
                    </p>
                  </div>
                ) : (
                  activeMeetings
                    ?.filter((meeting: any) =>
                      meeting?.name?.toLowerCase().includes(search.toLowerCase()),
                    )
                    ?.sort(
                      (a, b) =>
                        new Date(b.createdAt!).getTime() -
                        new Date(a.createdAt!).getTime(),
                    )
                    .map((quest: any) => (
                      <MeetingListItem key={quest?.id} item={quest} type="active" />
                    ))
                )}
              </motion.div>
            )}

            {activeFilter === "Завершенные" && (
              <motion.div
                key="completed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                {completedMeetings
                  ?.filter((meeting: any) =>
                    meeting?.name?.toLowerCase().includes(search.toLowerCase()),
                  )
                  ?.sort(
                    (a, b) =>
                      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
                  )
                  .map((quest: any) => (
                    <MeetingListItem key={quest?.id} item={quest} type="completed" />
                  ))}
                {completedMeetings?.length === 0 && (
                  <div className="py-20 text-center text-sm text-gray-500">
                    История встреч пуста
                  </div>
                )}
              </motion.div>
            )}

            {activeFilter === "Приглашения" && (
              <motion.div
                key="invites"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                {invitesWithInfo?.map((request: any) => (
                  <div
                    key={request?.id}
                    className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <img
                        src={getImageUrl(
                          request.fromUser?.photo || request.fromUser?.photoUrl,
                        )}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-violet-100"
                      />
                      <div>
                        <div className="text-sm font-bold text-gray-900">
                          {request.fromUser?.name} {request.fromUser?.surname}
                        </div>
                        <div className="text-xs text-gray-500">
                          Приглашает вас на встречу
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 rounded-2xl bg-gray-50 p-3">
                      <MeetCard
                        meet={request.meeting || ({} as Quest)}
                        isNavigable={true}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-200 active:scale-95"
                        onClick={() => handleDeclineRequest(request)}
                      >
                        Отклонить
                      </button>
                      <button
                        className="flex-1 rounded-xl bg-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 active:scale-95"
                        onClick={() => handleAcceptRequest(request)}
                      >
                        Принять
                      </button>
                    </div>
                  </div>
                ))}
                {invitesWithInfo?.length === 0 && (
                  <div className="py-20 text-center text-sm text-gray-500">
                    Нет новых приглашений
                  </div>
                )}
              </motion.div>
            )}

            {activeFilter === "Заявки" && (
              <motion.div
                key="requests"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                {requestsWithInfo?.map((request: any) => (
                  <div
                    key={request?.id}
                    className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
                  >
                    <div className="mb-4 flex items-center gap-4 rounded-2xl bg-gray-50 p-3">
                      <img
                        src={getImageUrl(request.meeting?.image || "")}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="line-clamp-1 text-sm font-bold text-gray-900">
                          {request.meeting?.name}
                        </h4>
                        <span className="mt-1 inline-flex rounded-lg bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {request.meeting?.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(request.fromUser?.photo || "")}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100"
                        />
                        <div>
                          <div className="text-sm font-bold text-gray-900">
                            {request.fromUser?.name} {request.fromUser?.surname}
                          </div>
                          <div className="text-xs text-gray-500">
                            {request.fromUser?.birthday}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 transition-colors hover:bg-red-100 active:scale-95"
                          onClick={() => handleDeclineRequest(request)}
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600 transition-colors hover:bg-green-100 active:scale-95"
                          onClick={() => handleAcceptRequest(request)}
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {requestsWithInfo?.length === 0 && (
                  <div className="py-20 text-center text-sm text-gray-500">
                    Нет активных заявок
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

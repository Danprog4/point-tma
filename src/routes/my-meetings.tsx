import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Search } from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { CloseRed } from "~/components/Icons/CloseRed";
import { Coin } from "~/components/Icons/Coin";
import { MeetCard } from "~/components/MeetCard";
import { useScrollRestoration } from "~/components/hooks/useScrollRes";
import { usePlatform } from "~/hooks/usePlatform";
import { useRequests } from "~/hooks/useRequests";
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
    staleTime: 0, // Всегда считаем данные устаревшими
  });
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const [search, setSearch] = useState<string>("");
  // Используем единый hook работы с заявками / приглашениями
  const {
    pendingInvitesInfo: invitesWithInfo,
    pendingRequestsInfo: requestsWithInfo,
    accept: handleAcceptRequest,
    decline: handleDeclineRequest,
  } = useRequests(user?.id, meetings || [], users || []);
  const { data: participants, refetch: refetchParticipants } = useQuery({
    ...trpc.meetings.getParticipants.queryOptions(),
    staleTime: 0, // Всегда считаем данные устаревшими
  });

  // Принудительно обновляем данные при монтировании компонента и при изменении фильтра
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

    return Array.from(uniqueMap.values()).map((meeting) => {
      return meeting;
    });
  }, [createdMeetings, acceptedMeetings]);

  const completedMeetings = useMemo(() => {
    return meetingsWithEvents?.filter((m) => m.isCompleted) || [];
  }, [meetingsWithEvents]);

  const activeMeetings = useMemo(() => {
    return meetingsWithEvents?.filter((m) => !m.isCompleted) || [];
  }, [meetingsWithEvents]);

  // handleAcceptRequest / handleDeclineRequest уже возвращаются из useRequests

  const filters = [
    { name: "Активные", count: activeMeetings?.length || 0 },
    { name: "Завершенные", count: completedMeetings?.length || 0 },
    { name: "Приглашения", count: invitesWithInfo?.length || 0 },
    { name: "Заявки", count: requestsWithInfo?.length || 0 },
  ];

  console.log(JSON.stringify(meetings), "meetingsWithEvents");

  console.log(meetings, "meetings");

  const isMobile = usePlatform();

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen overflow-y-auto bg-white pt-16 pb-10 data-[mobile=true]:pt-39"
    >
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => window.history.back()}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-center text-base font-bold text-gray-800">Мои встречи</h1>

        <button className="flex h-6 w-6 items-center justify-center"></button>
      </div>

      <div className="scrollbar-hidden mb-4 flex w-full flex-1 items-center gap-10 overflow-x-auto px-4">
        {filters.map((filter) => (
          <button
            key={filter.name}
            onClick={() => setActiveFilter(filter.name)}
            className={`rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter.name
                ? "bg-black text-white"
                : "border-gray-200 bg-white text-black"
            }`}
          >
            {filter.name} ({filter.count})
          </button>
        ))}
      </div>
      <div className="px-4">
        <input
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          value={search}
          type="text"
          placeholder="Поиск событий"
          className="mb-4 h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
        />
        <div className="absolute top-7 right-7">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      {activeFilter === "Активные" && (
        <div className="flex flex-col gap-4">
          {activeMeetings
            ?.filter((meeting: any) =>
              meeting?.name?.toLowerCase().includes(search.toLowerCase()),
            )
            ?.sort(
              (a, b) =>
                new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
            )
            .map((quest: any) => (
              <div key={quest?.id}>
                <div className="px-4">
                  <MeetCard meet={quest || ({} as Quest)} isNavigable={true} />
                  <p className="mb-4 text-xs leading-4 text-black">
                    {(() => {
                      const description = quest?.isCustom
                        ? quest?.description
                        : quest?.meeting?.description;
                      return description && description.length > 100
                        ? description.slice(0, 100) + "..."
                        : description;
                    })()}
                  </p>
                  <div className="mb-6 flex items-center justify-between">
                    {quest?.meeting?.hasAchievement ? (
                      <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                        + Достижение
                      </span>
                    ) : (
                      <div></div>
                    )}
                    {(quest?.meeting as any)?.rewards?.find(
                      (r: any) => r.type === "point",
                    ) ? (
                      <div className="ml-auto flex items-center gap-1">
                        <span className="text-base font-medium text-black">
                          +
                          {(quest?.meeting as any)?.rewards
                            ?.find((r: any) => r.type === "point")
                            ?.value?.toLocaleString() || 0}
                        </span>

                        <span className="text-base font-medium text-black">points</span>
                        <Coin />
                      </div>
                    ) : (
                      <div></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {activeFilter === "Завершенные" && (
        <div className="flex flex-col gap-4">
          {completedMeetings
            ?.filter((meeting: any) =>
              meeting?.name?.toLowerCase().includes(search.toLowerCase()),
            )
            ?.sort(
              (a, b) =>
                new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
            )
            .map((quest: any) => (
              <div key={quest?.id}>
                <div className="px-4">
                  <MeetCard meet={quest || ({} as Quest)} isNavigable={true} />
                  <p className="mb-4 text-xs leading-4 text-black">
                    {(() => {
                      const description = quest?.isCustom
                        ? quest?.description
                        : quest?.meeting?.description;
                      return description && description.length > 100
                        ? description.slice(0, 100) + "..."
                        : description;
                    })()}
                  </p>
                  <div className="mb-6 flex items-center justify-between">
                    {quest?.meeting?.hasAchievement ? (
                      <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                        + Достижение
                      </span>
                    ) : (
                      <div></div>
                    )}
                    {(quest?.meeting as any)?.rewards?.find(
                      (r: any) => r.type === "point",
                    ) ? (
                      <div className="ml-auto flex items-center gap-1">
                        <span className="text-base font-medium text-black">
                          +
                          {(quest?.meeting as any)?.rewards
                            ?.find((r: any) => r.type === "point")
                            ?.value?.toLocaleString() || 0}
                        </span>

                        <span className="text-base font-medium text-black">points</span>
                        <Coin />
                      </div>
                    ) : (
                      <div></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {activeFilter === "Приглашения" && (
        <div className="flex flex-col gap-4">
          {invitesWithInfo?.map((request: any) => (
            <div key={request?.id}>
              <div className="px-4">
                <div className="flex items-center gap-2 pb-2">
                  <img
                    src={getImageUrl(
                      request.fromUser?.photo || request.fromUser?.photoUrl,
                    )}
                    alt=""
                    className="h-10 w-10 rounded-full"
                  />
                  {request.fromUser?.name} {request.fromUser?.surname} приглашает
                </div>
                <MeetCard meet={request.meeting || ({} as Quest)} isNavigable={true} />
                <p className="my-2 text-xs leading-4 text-black">
                  {request.meeting?.description &&
                  request.meeting.description.length > 100
                    ? request.meeting.description.slice(0, 100) + "..."
                    : request.meeting?.description}
                </p>
                <div className="mb-6 flex items-center justify-between px-4">
                  {request.meeting?.reward ? (
                    <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                      + Достижение
                    </span>
                  ) : null}
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-base font-medium text-black">
                      +
                      {(request.meeting as any)?.rewards
                        ?.find((r: any) => r.type === "point")
                        ?.value?.toLocaleString() || 0}
                    </span>

                    <span className="text-base font-medium text-black">points</span>
                    <Coin />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 px-4">
                <div
                  className="rounded-2xl px-4 py-2 text-black"
                  onClick={() => handleDeclineRequest(request)}
                >
                  Отказать
                </div>
                <div
                  className="flex flex-1 justify-center rounded-2xl bg-[#9924FF] px-4 py-2 text-center text-white"
                  onClick={() => handleAcceptRequest(request)}
                >
                  Присоединиться
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeFilter === "Заявки" && (
        <div className="flex flex-col gap-4">
          {requestsWithInfo?.map((request: any) => (
            <div key={request?.id}>
              <div className="flex items-center justify-start gap-2 px-4">
                <img
                  src={getImageUrl(request.meeting?.image || "")}
                  alt=""
                  className="h-15 w-15 rounded-lg"
                />
                <div className="flex h-full w-full flex-col items-start justify-between gap-2">
                  <div className="text-lg">{request.meeting?.name}</div>
                  <div className="rounded-2xl bg-blue-500 px-1 text-white">
                    {request.meeting?.type}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center justify-start gap-2">
                  <div className="mr-4 p-2" onClick={() => handleDeclineRequest(request)}>
                    <CloseRed />
                  </div>
                  <img
                    src={getImageUrl(request.fromUser?.photo || "")}
                    alt=""
                    className="h-14 w-14 rounded-lg"
                  />
                  <div className="flex flex-col items-start justify-between gap-2">
                    <div className="text-lg">
                      {request.fromUser?.name} {request.fromUser?.surname}
                    </div>
                    <div>{request.fromUser?.birthday}</div>
                  </div>
                </div>
                <div
                  className="flex items-center justify-center rounded-lg bg-green-500 p-2 text-white"
                  onClick={() => handleAcceptRequest(request)}
                >
                  <Check />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

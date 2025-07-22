import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";

import { useMemo, useState } from "react";
import { CloseRed } from "~/components/Icons/CloseRed";
import { Coin } from "~/components/Icons/Coin";
import { QuestCard } from "~/components/QuestCard";
import { getEventData } from "~/lib/utils/getEventData";
import { getImageUrl } from "~/lib/utils/getImageURL";

import { useTRPC } from "~/trpc/init/react";
import { Quest } from "~/types/quest";
export const Route = createFileRoute("/my-meetings")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("Мои встречи");
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const { data: meetings } = useQuery(trpc.meetings.getMeetings.queryOptions());
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const { data: requests } = useQuery(trpc.meetings.getRequests.queryOptions());

  const requestsWithInfo = useMemo(() => {
    return requests
      ?.filter((request) => request.status === "pending" && !request.isCreator)
      ?.map((request) => {
        const meeting = meetings?.find((m) => m.id === request.meetId);
        const event = getEventData(meeting?.typeOfEvent!, meeting?.idOfEvent!);
        const user = users?.find((user) => user.id === request.fromUserId);
        return { ...request, event, user };
      });
  }, [requests, meetings]);

  const invitesWithInfo = useMemo(() => {
    return requests
      ?.filter((request) => request.status === "pending" && request.toUserId === user?.id)
      ?.map((request) => {
        const meeting = meetings?.find((m) => m.id === request.meetId);
        const event = getEventData(meeting?.typeOfEvent!, meeting?.idOfEvent!);
        const fromUser = users?.find((user) => user.id === request.fromUserId);
        return { ...request, event, user: fromUser };
      });
  }, [requests, meetings, user?.id]);

  const meetingsWithEvents = meetings?.map((meeting) => {
    const event = getEventData(meeting.typeOfEvent!, meeting.idOfEvent!);
    return {
      ...meeting,
      event,
    };
  });

  const acceptRequest = useMutation(trpc.meetings.acceptRequest.mutationOptions());
  const declineRequest = useMutation(trpc.meetings.declineRequest.mutationOptions());

  const handleAcceptRequest = (request: any) => {
    acceptRequest.mutate({ meetId: request.meetId, fromUserId: request.fromUserId });
    queryClient.setQueryData(trpc.meetings.getRequests.queryKey(), (old) => {
      return old?.filter((r) => r.id !== request.id);
    });
  };

  const handleDeclineRequest = (request: any) => {
    declineRequest.mutate({ meetId: request.meetId, fromUserId: request.fromUserId });
    queryClient.setQueryData(trpc.meetings.getRequests.queryKey(), (old) => {
      return old?.filter((r) => r.id !== request.id);
    });
  };

  const filters = ["Мои встречи", "Приглашения", "Заявки"];

  console.log(JSON.stringify(meetings), "meetingsWithEvents");

  console.log(meetings, "meetings");

  return (
    <div className="min-h-screen overflow-y-auto bg-white pt-16 pb-10">
      <div className="fixed top-0 right-0 left-0 z-10 flex items-center bg-white">
        <button
          onClick={() => navigate({ to: "/meetings" })}
          className="absolute top-4 left-4 flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex w-full items-center justify-center p-4">
          <h1 className="text-center text-base font-bold text-gray-800">Мои встречи</h1>
        </div>
      </div>

      <div className="scrollbar-hidden mb-4 flex w-full flex-1 items-center gap-10 overflow-x-auto px-4">
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
      {activeFilter === "Мои встречи" && (
        <div className="flex flex-col gap-4 px-4">
          {meetingsWithEvents
            ?.sort(
              (a, b) =>
                new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
            )
            .map((quest: any) => (
              <div key={quest?.id}>
                <div className="px-4">
                  <QuestCard
                    quest={quest?.isCustom ? quest : quest?.event || ({} as Quest)}
                    isNavigable={true}
                  />
                  <p className="mb-4 text-xs leading-4 text-black">
                    {(() => {
                      const description = quest?.isCustom
                        ? quest?.description
                        : quest?.event?.description;
                      return description && description.length > 100
                        ? description.slice(0, 100) + "..."
                        : description;
                    })()}
                  </p>
                  <div className="mb-6 flex items-center justify-between">
                    {quest?.event?.hasAchievement ? (
                      <span className="rounded-full bg-purple-300 px-2.5 py-0.5 text-xs font-medium text-black">
                        + Достижение
                      </span>
                    ) : (
                      <div></div>
                    )}
                    {quest?.event?.reward ? (
                      <div className="ml-auto flex items-center gap-1">
                        <span className="text-base font-medium text-black">
                          + {quest?.event?.reward?.toLocaleString()}
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
        <div className="flex flex-col gap-4 px-4">
          {invitesWithInfo?.map((request) => (
            <div key={request?.id}>
              <div className="flex items-center justify-start gap-2 px-4">
                <img src={request.event?.image} alt="" className="h-15 w-15 rounded-lg" />
                <div className="flex h-full w-full flex-col items-start justify-between gap-2">
                  <div className="text-lg">{request.event?.title}</div>
                  <div className="rounded-2xl bg-blue-500 px-1 text-white">
                    {request.event?.type}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-4">
                <div className="flex items-center justify-start gap-2">
                  <div className="mr-4 p-2" onClick={() => handleDeclineRequest(request)}>
                    <CloseRed />
                  </div>
                  <img
                    src={getImageUrl(request.user?.photo || "")}
                    alt=""
                    className="h-14 w-14 rounded-lg"
                  />
                  <div className="flex flex-col items-start justify-between gap-2">
                    <div className="text-lg">
                      {request.user?.name} {request.user?.surname}
                    </div>
                    <div>{request.user?.birthday}</div>
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

      {activeFilter === "Заявки" && (
        <div className="flex flex-col gap-4 px-4">
          {requestsWithInfo?.map((request) => (
            <div key={request?.id}>
              <div className="flex items-center justify-start gap-2 px-4">
                <img src={request.event?.image} alt="" className="h-15 w-15 rounded-lg" />
                <div className="flex h-full w-full flex-col items-start justify-between gap-2">
                  <div className="text-lg">{request.event?.title}</div>
                  <div className="rounded-2xl bg-blue-500 px-1 text-white">
                    {request.event?.type}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-4">
                <div className="flex items-center justify-start gap-2">
                  <div className="mr-4 p-2" onClick={() => handleDeclineRequest(request)}>
                    <CloseRed />
                  </div>
                  <img
                    src={getImageUrl(request.user?.photo || "")}
                    alt=""
                    className="h-14 w-14 rounded-lg"
                  />
                  <div className="flex flex-col items-start justify-between gap-2">
                    <div className="text-lg">
                      {request.user?.name} {request.user?.surname}
                    </div>
                    <div>{request.user?.birthday}</div>
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

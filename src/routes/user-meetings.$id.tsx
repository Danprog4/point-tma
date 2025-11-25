import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { Coin } from "~/components/Icons/Coin";
import { MeetCard } from "~/components/MeetCard";
import { Spinner } from "~/components/Spinner";
import { usePlatform } from "~/hooks/usePlatform";
import { useTRPC } from "~/trpc/init/react";
import { Quest } from "~/types/quest";

export const Route = createFileRoute("/user-meetings/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const userId = parseInt(id);
  const [activeFilter, setActiveFilter] = useState("Активные");
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: viewedUser, isLoading: isLoadingUser } = useQuery(
    trpc.main.getUserById.queryOptions({ id }),
  );
  const { data: meetings, isLoading: isLoadingMeetings } = useQuery(
    trpc.meetings.getMeetings.queryOptions({ userId: userId }),
  );

  // Get meetings created by this user
  const createdMeetings = useMemo(() => {
    const created = meetings?.filter((m) => m.userId === userId) || [];
    return created;
  }, [meetings, userId]);

  // Combine and deduplicate meetings
  // Currently only showing created meetings as acceptedMeetings logic was incorrect/empty
  const allUserMeetings = useMemo(() => {
    return createdMeetings;
  }, [createdMeetings]);

  // Add event data to meetings
  const meetingsWithEvents = useMemo(() => {
    return allUserMeetings;
  }, [allUserMeetings]);

  // Separate into active and completed based on creation date (last 30 days = active)
  const activeMeetings = useMemo(() => {
    return meetingsWithEvents.filter((meeting) => {
      return !meeting.isCompleted;
    });
  }, [meetingsWithEvents]);

  const completedMeetings = useMemo(() => {
    return meetingsWithEvents.filter((meeting) => {
      return meeting.isCompleted;
    });
  }, [meetingsWithEvents]);

  const filters = [
    { name: "Активные", count: activeMeetings?.length || 0 },
    { name: "Пройденные", count: completedMeetings?.length || 0 },
  ];

  const displayMeetings =
    activeFilter === "Активные" ? activeMeetings : completedMeetings;

  const isMobile = usePlatform();

  console.log(isLoadingMeetings, isLoadingUser, "isLoadingMeetings, isLoadingUser");

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen overflow-y-auto bg-white pt-16 pb-10 data-[mobile=true]:pt-39"
    >
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-10 flex items-center justify-center bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => window.history.back()}
          className="absolute left-4 flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-base font-bold text-gray-800">
          Встречи {viewedUser?.name} {viewedUser?.surname}
        </h1>
      </div>

      <div className="scrollbar-hidden mb-4 flex w-full flex-1 items-center gap-10 overflow-x-auto px-4">
        {filters.map((filter) => (
          <button
            key={filter.name}
            onClick={() => setActiveFilter(filter.name)}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter.name
                ? "bg-black text-white"
                : "border-gray-200 bg-white text-black"
            }`}
          >
            {filter.name} ({filter.count})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {isLoadingMeetings || isLoadingUser ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <>
            {displayMeetings
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
                      {(quest?.event as any)?.rewards?.find(
                        (r: any) => r.type === "point",
                      ) ? (
                        <div className="ml-auto flex items-center gap-1">
                          <span className="text-base font-medium text-black">
                            +
                            {(quest?.event as any)?.rewards
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

            {!isLoadingMeetings && !isLoadingUser && displayMeetings?.length === 0 && (
              <div className="flex flex-col items-center justify-center px-4 py-16">
                <div className="text-center text-gray-500">
                  <p className="mb-2 text-lg font-medium">
                    {activeFilter === "Активные"
                      ? "Нет активных встреч"
                      : "Нет пройденных встреч"}
                  </p>
                  <p className="text-sm">
                    {activeFilter === "Активные"
                      ? "Пользователь пока не создал активных встреч"
                      : "У пользователя пока нет завершенных встреч"}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

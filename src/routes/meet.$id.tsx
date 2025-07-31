import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ComplaintDrawer } from "~/components/ComplaintDrawer";
import EndMeetDrawer from "~/components/EndMeetDrawer";
import { useScroll } from "~/components/hooks/useScroll";
import { Coin } from "~/components/Icons/Coin";
import { ComplaintIcon } from "~/components/Icons/Complaint";
import { Info } from "~/components/Icons/Info";
import { WhitePlusIcon } from "~/components/Icons/WhitePlus";
import InviteDrawer from "~/components/InviteDrawer";
import { More } from "~/components/More";
import { getEventData } from "~/lib/utils/getEventData";
import { getImageUrl } from "~/lib/utils/getImageURL";
import ManageDrawer from "~/ManageDrawer";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/meet/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [page, setPage] = useState("info");
  const [complaint, setComplaint] = useState("");
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const trpc = useTRPC();
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const navigate = useNavigate();
  const { data: friends } = useQuery(trpc.friends.getFriends.queryOptions());
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const { data: complaints } = useQuery(trpc.main.getComplaints.queryOptions());
  const { data: meetingsData } = useQuery(trpc.meetings.getMeetings.queryOptions());
  const endMeeting = useMutation(trpc.meetings.endMeeting.mutationOptions());
  const sendComplaint = useMutation(trpc.main.sendComplaint.mutationOptions());
  const unsendComplaint = useMutation(trpc.main.unsendComplaint.mutationOptions());

  const handleUnsendComplaint = () => {
    unsendComplaint.mutate({ id: meeting?.id! });

    queryClient.setQueryData(trpc.main.getComplaints.queryKey(), (old: any) => {
      return old.filter((c: any) => c.meetId !== meeting?.id);
    });
  };

  const meetingsWithEvents = meetingsData?.map((meeting) => {
    const organizer = users?.find((u) => u.id === meeting.userId);
    const event = getEventData(meeting.typeOfEvent!, meeting.idOfEvent!);
    return {
      ...meeting,
      organizer,
      event,
    };
  });

  const isUserMeeting = useMemo(() => {
    return meetingsWithEvents?.some((m) => m.id === parseInt(id));
  }, [meetingsWithEvents, user?.id]);

  const meeting = meetingsWithEvents?.find((m) => m.id === parseInt(id));

  const organizer = meetingsWithEvents?.find(
    (m) => m.id === parseInt(id) && m.name === meeting?.name,
  )?.organizer;

  const joinMeeting = useMutation(trpc.meetings.joinMeeting.mutationOptions());
  const leaveMeeting = useMutation(trpc.meetings.leaveMeeting.mutationOptions());
  const { data: userParticipants } = useQuery(
    trpc.meetings.getParticipants.queryOptions(),
  );

  const isJoined = useMemo(() => {
    return userParticipants?.some(
      (p) => p.meetId === meeting?.id && p.fromUserId === user?.id,
    );
  }, [userParticipants, meeting?.id, user?.id]);

  const isParticipant = useMemo(() => {
    return userParticipants
      ?.filter((p) => p.status === "accepted")
      .some((p) => p.meetId === meeting?.id && p.fromUserId === user?.id);
  }, [userParticipants, meeting?.id, user?.id]);

  const isRequestParticipant = useMemo(() => {
    return userParticipants
      ?.filter((p) => p.status === "pending")
      .some((p) => p.meetId === meeting?.id && p.fromUserId === user?.id);
  }, [userParticipants, meeting?.id, user?.id]);

  // @ts-ignore
  const eventType = isUserMeeting ? meeting?.typeOfEvent : meeting?.type;
  // @ts-ignore
  const eventId = isUserMeeting ? meeting?.idOfEvent : meeting?.id;
  const event = getEventData(eventType ?? "", eventId ?? 0);
  console.log(event, "event");

  const isOwner = useMemo(() => {
    return organizer?.id === user?.id;
  }, [organizer?.id, user?.id]);

  const handleJoin = () => {
    if (!isClicked) {
      setIsClicked(true);
      return;
    }

    if (isOwner) {
      return;
    }

    if (isParticipant || isRequestParticipant) {
      leaveMeeting.mutate({ id: meeting?.id! });
      queryClient.setQueryData(trpc.meetings.getParticipants.queryKey(), (old: any) => {
        return old.filter((p: any) => p.meetId !== meeting?.id);
      });
    } else {
      joinMeeting.mutate({ id: meeting?.id! });
      queryClient.setQueryData(trpc.meetings.getParticipants.queryKey(), (old: any) => {
        return [
          ...(old || []),
          { fromUserId: user?.id!, meetId: meeting?.id!, status: "pending" },
        ];
      });
    }
  };

  const handleBack = () => {
    if (isClicked) {
      setIsClicked(false);
      return;
    }

    window.history.back();
  };

  const handleSendComplaint = () => {
    sendComplaint.mutate({ meetId: meeting?.id!, complaint: complaint });

    queryClient.setQueryData(trpc.main.getComplaints.queryKey(), (old: any) => {
      return [
        ...(old || []),
        { meetId: meeting?.id!, userId: user?.id!, complaint: complaint },
      ];
    });
  };

  const isComplaint = useMemo(() => {
    return complaints?.some((c) => c.meetId === meeting?.id && c.userId === user?.id);
  }, [complaints, meeting?.id, user?.id]);

  const handleEndMeeting = () => {
    endMeeting.mutate({ id: meeting?.id! });

    queryClient.setQueryData(trpc.meetings.getMeetings.queryKey(), (old: any) => {
      return old.map((m: any) =>
        m.id === meeting?.id ? { ...m, isCompleted: true } : m,
      );
    });
  };

  console.log(meeting, "meeting");

  return (
    <>
      <div className="fixed top-0 left-0 z-10 flex w-full items-center justify-center bg-white">
        <div className="relative flex w-full max-w-md items-center justify-between px-4 py-3">
          <button
            onClick={() => handleBack()}
            className="flex h-6 w-6 items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-gray-800">
            Встреча
          </h1>
          {!isOwner && (
            <button
              onClick={() => {
                if (isComplaint) {
                  toast.error("Вы уже пожаловались на эту встречу");
                  return;
                }
                setIsComplaintOpen(true);
              }}
            >
              <ComplaintIcon />
            </button>
          )}
        </div>
      </div>

      <div className="scrollbar-hidden overflow-y-auto pt-18 pb-24">
        <div className="relative">
          <img
            src={getImageUrl(meeting?.image!)}
            className="h-[30vh] w-full rounded-t-xl object-cover"
          />
          <div className="absolute bottom-4 left-4 flex flex-col gap-2 text-white">
            <div className="text-2xl font-bold">{meeting?.name}</div>
            <div className="flex items-center justify-start gap-2">
              <div className="flex items-center justify-center rounded-full bg-black/25 px-2">
                {meeting?.type}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-4 px-4 pt-4">
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
              page === "participants" ? "bg-black text-white" : "bg-white text-black"
            }`}
            onClick={() => setPage("participants")}
          >
            Участники
          </button>
        </div>
        {page === "info" ? (
          <>
            <div className="flex flex-col gap-2 px-4 py-4">
              <div className="text-2xl font-bold">Описание</div>
              <div>
                {meeting?.description &&
                  meeting.description
                    .split(/\n{2,}/)
                    .map((paragraph: string, idx: number) => (
                      <p key={idx} className="mb-3 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 px-4 py-4">
              <div className="text-2xl font-bold">Локация</div>
              <div>{meeting?.location || "Москва"}</div>
            </div>
            <div className="flex flex-col gap-2 px-4 py-4">
              <div className="text-2xl font-bold">Организатор</div>
              <div
                className="relative flex items-center gap-4"
                onClick={() => {
                  navigate({
                    to: "/user-profile/$id",
                    params: { id: organizer?.id?.toString() || "" },
                  });
                }}
              >
                <div className="relative h-10 w-10 rounded-full bg-gray-200">
                  <img
                    src={
                      organizer?.photo
                        ? getImageUrl(organizer?.photo)
                        : organizer?.photoUrl || ""
                    }
                    alt={organizer?.name || ""}
                    className="h-10 w-10 cursor-pointer rounded-full"
                  />
                </div>
                <div>
                  {organizer?.name} {organizer?.surname}
                </div>
              </div>
            </div>
            {/* {event?.stages && event?.stages.length > 0 ? (
              <div className="flex flex-col gap-4 px-4 py-4">
                <div className="text-2xl font-bold">Этапы встречи</div>
                <div className="relative">
                  {event?.stages.map((stage, idx) => (
                    <div key={idx} className="flex items-start gap-4 pb-4 last:pb-0">
                      <div className="relative flex w-8 flex-none items-start justify-center">
                        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 font-bold text-black">
                          {idx + 1}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="font-bold text-black">{stage.title}</div>
                        <div className="text-sm text-black/80">{stage.desc}</div>
                      </div>
                    </div>
                  ))}
                  <div className="absolute top-8 bottom-4 left-4 w-px -translate-x-1/2 bg-gray-300" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-4 py-4">
                {event?.quests?.map((quest) => (
                  <>
                    <QuestCard key={quest.id} quest={quest as any} isNavigable={true} />
                    {event?.description.slice(0, 100)}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center justify-center rounded-full bg-[#DEB8FF] px-3 text-black">
                        + Достижение
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-base font-medium text-black">
                          +
                          {(event as any)?.rewards
                            ?.find((reward: any) => reward.type === "point")
                            ?.value?.toLocaleString() || 0}
                        </span>

                        <span>
                          {(event as any)?.rewards
                            ?.filter((reward: any) => reward.type === "text")
                            .map((reward: any) => (
                              <span key={reward.value}>{reward.value}</span>
                            ))}
                        </span>
                        <span className="text-base font-medium text-black">points</span>
                        <Coin />
                      </div>
                    </div>
                  </>
                ))}
              </div>
            )} */}

            <div className="flex flex-col justify-center gap-2 px-4 py-4">
              <div className="flex flex-col items-start justify-start text-2xl font-bold">
                <div className="flex items-center">
                  <div className="text-2xl font-bold">Награда </div>
                  <div className="text-l pl-2 font-bold">
                    +
                    {(event as any)?.rewards
                      ?.find((reward: any) => reward.type === "point")
                      ?.value?.toLocaleString() || 0}
                  </div>
                  <Coin />
                </div>

                <div className="text-sm">
                  {(event as any)?.rewards
                    ?.filter((reward: any) => reward.type === "text")
                    .map((reward: any) => (
                      <div key={reward.value}>
                        {reward.value.split("\n").map((line: string, index: number) => (
                          <div key={index}>+ {line}</div>
                        ))}
                      </div>
                    ))}
                </div>
              </div>

              <div>За успешное выполнение квеста</div>
              <div className="flex gap-2">
                <div className="flex h-25 w-25 flex-col items-center justify-center rounded-lg bg-blue-200">
                  <img src="/shit.png" alt="coin" className="h-10 w-10" />
                  <span className="mt-1 text-sm">Кепка BUCS</span>
                </div>
                <div className="flex h-25 w-25 flex-col items-center justify-center rounded-lg bg-red-200">
                  <img src="/cap.png" alt="coin" className="h-10 w-10" />
                  <span className="mt-1 text-sm">Любитель к...</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 px-4 py-4">
              <div className="text-2xl font-bold">Достижение</div>
              <div>+1 Активный участник</div>
            </div>
          </>
        ) : (
          <div className="flex flex-col">
            {meeting?.participantsIds?.map((p) => {
              const user = users?.find((u) => u.id === Number(p));
              return (
                <div key={p} className="flex flex-col gap-2 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-gray-200">
                        <img
                          src={
                            user?.photo ? getImageUrl(user?.photo) : user?.photoUrl || ""
                          }
                          alt={user?.name || ""}
                          className="h-10 w-10 rounded-full"
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="text-lg font-bold">
                          {user?.name} {user?.surname}
                        </div>
                        <div className="text-sm text-gray-500">участник</div>
                      </div>
                    </div>
                  </div>

                  <div className="h-0.5 w-full bg-gray-200"></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {meeting?.isCompleted ? (
        <div className="fixed right-0 bottom-0 left-0 mx-auto mt-4 flex w-full flex-col items-center justify-center rounded-lg bg-white text-center font-semibold text-white">
          <div className="z-[10000] flex w-full items-center justify-center gap-2 bg-[#FFE5E5] px-8 py-6 text-black">
            <Info />
            Встреча уже завершена
          </div>
        </div>
      ) : (
        <>
          {isOwner ? (
            <div className="fixed right-4 bottom-0 left-4 mx-auto mt-4 flex w-auto items-center justify-center bg-white py-4 text-center font-semibold text-white">
              <div
                className="z-[1000] rounded-tl-2xl rounded-br-2xl bg-[#9924FF] px-8 py-3 text-white"
                onClick={() => {
                  setIsInviteOpen(true);
                }}
              >
                Пригласить
              </div>
              <div
                className="z-[1000] flex-1 px-8 py-3 text-[#9924FF]"
                onClick={() => {
                  setIsEndOpen(true);
                }}
              >
                Завершить
              </div>
            </div>
          ) : isComplaint ? (
            <div>
              <div className="fixed right-0 bottom-0 left-0 mx-auto mt-4 flex w-full flex-col items-center justify-center rounded-lg bg-white text-center font-semibold text-white">
                <div className="z-[10000] flex w-full items-center justify-center gap-2 bg-[#FFE5E5] px-8 py-6 text-black">
                  <Info />
                  Вы пожаловались на эту встречу
                </div>
                <button
                  className="z-[10000] w-full rounded-tl-2xl rounded-br-2xl px-8 py-6 text-[#9924FF] disabled:opacity-50"
                  onClick={() => handleUnsendComplaint()}
                >
                  Отозвать жалобу
                </button>
              </div>
            </div>
          ) : (
            <div className="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-center gap-10 rounded-2xl bg-white px-4 py-3 text-white">
              <div
                className="flex flex-1 items-center justify-center rounded-tl-2xl rounded-tr-lg rounded-br-2xl rounded-bl-lg bg-[#9924FF] px-3 py-3 text-white"
                onClick={() => handleJoin()}
              >
                {isOwner ? (
                  <ManageDrawer open={isManageOpen} onOpenChange={setIsManageOpen}>
                    <div>Управление</div>
                  </ManageDrawer>
                ) : isParticipant ? (
                  "Выйти"
                ) : isRequestParticipant ? (
                  "Отменить запрос"
                ) : (
                  "Откликнуться"
                )}
              </div>
              <div className="flex flex-col items-center">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600"
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                >
                  <WhitePlusIcon />
                </div>
                <span className="text-xs text-black">Ещё</span>
              </div>
            </div>
          )}
        </>
      )}

      {isMoreOpen && <More setIsMoreOpen={setIsMoreOpen} event={event} />}
      {isComplaintOpen && (
        <ComplaintDrawer
          handleSendComplaint={handleSendComplaint}
          complaint={complaint}
          setComplaint={setComplaint}
          open={isComplaintOpen}
          onOpenChange={setIsComplaintOpen}
          meetId={Number(id)}
        />
      )}
      {isInviteOpen && (
        <InviteDrawer
          open={isInviteOpen}
          onOpenChange={setIsInviteOpen}
          friends={friends || []}
          selectedIds={selectedFriends}
          setSelectedIds={setSelectedFriends}
          getImageUrl={getImageUrl}
          user={user}
          users={users || []}
        ></InviteDrawer>
      )}
      {isEndOpen && (
        <EndMeetDrawer
          open={isEndOpen}
          onOpenChange={setIsEndOpen}
          meetId={Number(id)}
          handleEndMeeting={handleEndMeeting}
        />
      )}
    </>
  );
}

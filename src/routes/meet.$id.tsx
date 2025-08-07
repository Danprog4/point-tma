import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  X as XIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ComplaintDrawer } from "~/components/ComplaintDrawer";
import EndMeetDrawer from "~/components/EndMeetDrawer";
import { useScroll } from "~/components/hooks/useScroll";
import { CloseRed } from "~/components/Icons/CloseRed";
import { ComplaintIcon } from "~/components/Icons/Complaint";
import { Info } from "~/components/Icons/Info";
import { WhitePlusIcon } from "~/components/Icons/WhitePlus";
import InviteDrawer from "~/components/InviteDrawer";
import { MeetHeader } from "~/components/MeetHeader";
import { MeetInfo } from "~/components/MeetInfo";
import { More } from "~/components/More";
import { Participations } from "~/components/Participations";
import { chatData } from "~/config/chat";
import { usePlatform } from "~/hooks/usePlatform";
import { getImageUrl } from "~/lib/utils/getImageURL";
import ManageDrawer from "~/ManageDrawer";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/meet/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
  const [isParticipantPage, setIsParticipantPage] = useState(false);
  const [isOwnerState, setIsOwnerState] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [page, setPage] = useState("info");
  const [complaint, setComplaint] = useState("");
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [participants, setParticipants] = useState<number[]>([]);
  // Gallery & photo state
  const [mainPhoto, setMainPhoto] = useState<string | undefined>(undefined);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

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
  const [chatTimestamps, setChatTimestamps] = useState<number[]>([]);
  // Ref to keep the chat scrolled to the newest message
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const { data: chatMessages } = useQuery(
    trpc.meetings.getMessages.queryOptions({ meetId: Number(id) }),
  );

  // Scroll chat to the bottom whenever the messages list or page changes
  useEffect(() => {
    if (page === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [chatMessages, page]);

  // Disable page scrolling when the chat is open so that only the chat list can scroll
  useEffect(() => {
    if (page !== "chat") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [page]);

  const sendChatMessage = useMutation(
    trpc.meetings.sendMessage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.meetings.getMessages.queryKey(),
        });
      },
      onError: (err: any) => {
        toast.error(err.message || "Ошибка отправки сообщения");
      },
    }),
  );

  const handleSendChatMessage = (msg: string) => {
    if (!meeting?.id) return;
    const now = Date.now();
    const recent = chatTimestamps.filter((t) => now - t < 60_000);
    if (recent.length >= 2) {
      toast.error("Можно отправлять не более 2 сообщений в минуту");
      return;
    }
    setChatTimestamps([...recent, now]);
    sendChatMessage.mutate({ meetId: meeting.id, message: msg });
  };

  const meetingsWithEvents = useMemo(() => {
    return meetingsData?.map((meeting) => {
      const organizer = users?.find((u) => u.id === meeting.userId);

      return {
        ...meeting,
        organizer,
      };
    });
  }, [meetingsData, users]);

  const meeting = useMemo(() => {
    return meetingsWithEvents?.find((m) => m.id === parseInt(id));
  }, [meetingsWithEvents, id]);

  const allPhotos = useMemo(() => {
    return [mainPhoto, ...galleryPhotos].filter(Boolean) as string[];
  }, [mainPhoto, galleryPhotos]);

  // Sync local state when fetched meeting changes
  useEffect(() => {
    setMainPhoto(meeting?.image || undefined);
    setGalleryPhotos(meeting?.gallery ?? []);
  }, [meeting?.image, meeting?.gallery]);

  const handleUnsendComplaint = () => {
    unsendComplaint.mutate({ id: meeting?.id! });

    queryClient.setQueryData(trpc.main.getComplaints.queryKey(), (old: any) => {
      return old.filter((c: any) => c.meetId !== meeting?.id);
    });
  };

  const isUserMeeting = useMemo(() => {
    return meetingsWithEvents?.some((m) => m.id === parseInt(id));
  }, [meetingsWithEvents, user?.id]);

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
      .some(
        (p) =>
          p.meetId === meeting?.id &&
          (p.fromUserId === user?.id || p.toUserId === user?.id),
      );
  }, [userParticipants, meeting?.id, user?.id]);

  const isRequestParticipant = useMemo(() => {
    return userParticipants
      ?.filter((p) => p.status === "pending")
      .some(
        (p) =>
          p.meetId === meeting?.id &&
          (p.fromUserId === user?.id || p.toUserId === user?.id),
      );
  }, [userParticipants, meeting?.id, user?.id]);

  const isOwner = useMemo(() => {
    return organizer?.id === user?.id;
  }, [organizer?.id, user?.id]);

  const handleJoin = () => {
    if (isOwner) {
      return;
    }

    if (isParticipant || isRequestParticipant) {
      leaveMeeting.mutate({ id: meeting?.id! });
      queryClient.setQueryData(trpc.meetings.getParticipants.queryKey(), (old: any) => {
        return old.filter((p: any) => p.meetId !== meeting?.id);
      });
      queryClient.setQueryData(trpc.meetings.getRequests.queryKey(), (old: any) => {
        return old.filter((r: any) => r.meetId !== meeting?.id);
      });
      queryClient.setQueryData(trpc.meetings.getMeetings.queryKey(), (old: any) => {
        return old.map((r: any) =>
          r.id == meeting?.id
            ? {
                ...r,
                participantsIds: r.participantsIds.filter((p: any) => p !== user?.id),
              }
            : r,
        );
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

  // Handler for accepting an invitation (owner invited me)
  const handleAcceptInvite = (invite: any) => {
    joinMeeting.mutate(
      { id: invite.meetId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: trpc.meetings.getParticipants.queryKey(),
          });
        },
      },
    );
    queryClient.setQueryData(trpc.meetings.getParticipants.queryKey(), (old: any) => [
      ...(old || []),
      { fromUserId: user?.id!, meetId: invite.meetId, status: "accepted" },
    ]);
    queryClient.setQueryData(trpc.meetings.getRequests.queryKey(), (old: any) =>
      old?.filter((r: any) => r.id !== invite.id),
    );
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

  const rateUsers = useMutation(
    trpc.main.rateUsers.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.main.getUserRating.queryKey() });
      },
    }),
  );

  const handleRateUsers = (userIds: number[], rating: number) => {
    rateUsers.mutate({ userIds, rating, meetId: meeting?.id! });
  };

  const { data: userRating } = useQuery(
    trpc.main.getUserRating.queryOptions({
      meetId: meeting?.id!,
    }),
  );

  const { data: meetRating } = useQuery(
    trpc.main.getMeetRating.queryOptions({
      meetId: meeting?.id!,
    }),
  );

  const { data: requests } = useQuery(trpc.meetings.getRequests.queryOptions());

  const filteredRequests = useMemo(() => {
    console.log(requests, "requests");
    return requests?.filter(
      (r) =>
        r.meetId === meeting?.id &&
        r.status === "pending" &&
        r.toUserId === user?.id &&
        r.isRequest,
    );
  }, [requests, meeting?.id]);

  const invitedUsers = useMemo(() => {
    return requests?.filter(
      (r) =>
        r.meetId === meeting?.id &&
        r.status === "pending" &&
        r.fromUserId === user?.id &&
        !r.isRequest,
    );
  }, [requests, meeting?.id, user?.id]);

  // Re-add pending invitations to me
  const invitesForUser = requests
    ? requests.filter(
        (r) =>
          r.meetId === meeting?.id &&
          r.status === "pending" &&
          r.toUserId === user?.id &&
          !r.isRequest,
      )
    : [];
  const isInvited = invitesForUser.length > 0;

  const acceptRequest = useMutation(trpc.meetings.acceptRequest.mutationOptions());
  const declineRequest = useMutation(trpc.meetings.declineRequest.mutationOptions());

  const handleAcceptRequest = (request: any) => {
    acceptRequest.mutate({ meetId: request.meetId, fromUserId: request.fromUserId });
    queryClient.setQueryData(trpc.meetings.getRequests.queryKey(), (old) => {
      return old?.filter((r) => r.id !== request.id);
    });
    // Add accepted invitation to participants cache
    queryClient.setQueryData(trpc.meetings.getParticipants.queryKey(), (old: any) => [
      ...(old || []),
      { fromUserId: request.fromUserId, meetId: request.meetId, status: "accepted" },
    ]);
  };

  const handleDeclineRequest = (request: any) => {
    declineRequest.mutate({ meetId: request.meetId, fromUserId: request.fromUserId });
    queryClient.setQueryData(trpc.meetings.getRequests.queryKey(), (old) => {
      return old?.filter((r) => r.id !== request.id);
    });
  };

  const inviteUsers = useMutation(
    trpc.meetings.inviteUsers.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.meetings.getRequests.queryKey(),
        });
      },
    }),
  );

  const handleInvite = () => {
    if (selectedFriends.length > 0 && isDrawerOpen!) {
      inviteUsers.mutate({
        meetId: meeting?.id!,
        userIds: selectedFriends,
      });
    }
  };

  useEffect(() => {
    console.log(requests, "requests");
    if (requests && requests?.length > 0) {
      const filteredRequests = requests.filter(
        (r) =>
          r.meetId === meeting?.id &&
          r.status === "pending" &&
          r.toUserId === user?.id &&
          r.isRequest,
      );
      console.log(filteredRequests, "filteredRequests");

      setParticipants(
        requests
          .filter((r) => r.meetId === meeting?.id && r.status === "accepted")
          .map((r) => r.fromUserId)
          .filter((userId): userId is number => userId !== null),
      );
      console.log(participants, "participants");
      setSelectedFriends(filteredRequests.map((r) => r.toUserId));
    }
  }, [requests]);

  useEffect(() => {
    if (selectedFriends.length > 0 && isDrawerOpen!) {
      handleInvite();
    }
  }, [selectedFriends, isDrawerOpen]);

  const isMobile = usePlatform();

  return (
    <div className={`h-screen ${page === "chat" ? "overflow-y-hidden" : ""}`}>
      {isParticipantPage ? (
        <Participations
          meetId={meeting?.id!}
          participants={meeting?.participantsIds || []}
          setIsOpen={setIsParticipantPage}
          users={users || []}
          handleRateUsers={handleRateUsers}
          userRating={userRating}
          isOwner={isOwnerState}
          organizer={organizer}
        />
      ) : (
        <div className={`h-screen ${page === "chat" ? "overflow-y-hidden" : ""}`}>
          <div
            data-mobile={isMobile}
            className="fixed top-0 left-0 z-10 flex w-full items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
          >
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
          <div
            data-mobile={isMobile}
            className="flex gap-4 overflow-y-hidden px-4 pb-4 data-[mobile=true]:pt-38"
          >
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
            <button
              className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
                page === "chat" ? "bg-black text-white" : "bg-white text-black"
              }`}
              onClick={() => setPage("chat")}
            >
              Чат
            </button>
          </div>
          <div>
            {page === "info" && (
              <>
                <MeetHeader
                  isMobile={isMobile}
                  page={page}
                  setPage={setPage}
                  mainPhoto={mainPhoto}
                  meeting={meeting as any}
                  user={user as any}
                  getImageUrl={getImageUrl}
                  setCurrentIndex={setCurrentIndex}
                  setIsFullScreen={setIsFullScreen}
                  galleryPhotos={galleryPhotos}
                  setGalleryPhotos={setGalleryPhotos}
                  setMainPhoto={setMainPhoto}
                />
                <MeetInfo
                  meeting={meeting as any}
                  organizer={organizer as any}
                  users={users as any}
                  getImageUrl={getImageUrl}
                />
              </>
            )}
            {page === "participants" && (
              <div className="flex flex-col">
                <button
                  onClick={() => {
                    setIsDrawerOpen(true);
                  }}
                  disabled={
                    meeting?.maxParticipants !== undefined &&
                    meeting?.maxParticipants !== null &&
                    meeting?.maxParticipants <= (meeting?.participantsIds?.length || 0)
                  }
                  className="mx-4 flex items-center justify-center rounded-tl-2xl rounded-tr-lg rounded-br-2xl rounded-bl-lg bg-[#F8F0FF] px-4 py-3 text-[#721DBD]"
                >
                  Пригласить участников
                </button>
                <div className="flex flex-col gap-2 px-4 py-4">
                  <div className="items-cetner flex justify-between">
                    <div>Количество участников</div>
                    <div>
                      {Number(meeting?.participantsIds?.length || 0) + 1} из{" "}
                      {meeting?.maxParticipants || "не ограничено"}
                    </div>
                  </div>
                  <div className="h-1 w-full bg-[#9924FF]"></div>
                </div>
                <div className="mx-4 flex items-center justify-start text-xl font-bold">
                  Входящие заявки
                </div>
                {filteredRequests && filteredRequests?.length > 0 ? (
                  filteredRequests?.map((r) => {
                    const user = users?.find((u) => u.id === r.fromUserId);
                    return (
                      <div key={r?.id}>
                        <div className="flex items-center justify-between px-4 py-4">
                          <div className="flex items-center justify-start gap-2">
                            <div
                              className="mr-4 p-2"
                              onClick={() => handleDeclineRequest(r)}
                            >
                              <CloseRed />
                            </div>
                            <img
                              src={getImageUrl(user?.photo || "")}
                              alt=""
                              className="h-14 w-14 rounded-lg"
                            />
                            <div className="flex flex-col items-start justify-between">
                              <div className="text-lg">
                                {user?.name} {user?.surname}
                              </div>
                              <div>{user?.login}</div>
                            </div>
                          </div>
                          <div
                            className="flex items-center justify-center rounded-lg bg-green-500 p-2 text-white"
                            onClick={() => handleAcceptRequest(r)}
                          >
                            <Check />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-4 text-sm text-neutral-500">
                    Заявок на встречу пока нет
                  </div>
                )}

                <div className="mx-4 flex items-center justify-start text-xl font-bold">
                  Приглашения
                </div>
                {invitedUsers && invitedUsers.length > 0 ? (
                  invitedUsers?.map((i) => {
                    const user = users?.find((u) => u.id === i.toUserId);
                    return (
                      <div key={i.id + "r"}>
                        <div className="flex items-center justify-between px-4 pb-4">
                          <div className="flex items-center justify-start gap-2">
                            <img
                              src={getImageUrl(user?.photo || "")}
                              alt=""
                              className="h-14 w-14 rounded-lg"
                            />
                            <div className="flex flex-col items-start justify-between gap-2">
                              <div className="text-lg">
                                {user?.name} {user?.surname}
                              </div>
                              <div>{user?.login}</div>
                            </div>
                          </div>
                          {(() => {
                            const participantIds = Array.from(
                              new Set(
                                [organizer?.id, ...(meeting?.participantsIds || [])]
                                  .map((id) => Number(id))
                                  .filter(Boolean),
                              ),
                            );

                            if (participantIds.includes(user?.id || 0)) {
                              return (
                                <div className="text-sm text-nowrap text-[#00A349]">
                                  Участник
                                </div>
                              );
                            } else {
                              return (
                                <div className="text-sm text-nowrap text-[#FFA500]">
                                  Приглашен(-а)
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-4 text-sm text-neutral-500">
                    Никто не был приглашен на встречу
                  </div>
                )}

                <div className="mx-4 flex items-center justify-start text-xl font-bold">
                  Участники
                </div>

                {(() => {
                  const participantIds = Array.from(
                    new Set(
                      [organizer?.id, ...(meeting?.participantsIds || [])]
                        .map((id) => Number(id))
                        .filter(Boolean),
                    ),
                  );
                  return participantIds;
                })().map((p) => {
                  const user = users?.find((u) => u.id === Number(p));
                  return (
                    <div
                      key={`participant-${p}`}
                      className="flex flex-col gap-2 px-4 py-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-gray-200">
                            {(() => {
                              const imgSrc = user?.photo
                                ? getImageUrl(user.photo)
                                : user?.photoUrl;
                              return imgSrc ? (
                                <img
                                  src={imgSrc}
                                  alt={user?.name || ""}
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : null;
                            })()}
                          </div>
                          <div className="flex flex-col">
                            <div className="text-lg font-bold">
                              {user?.name} {user?.surname}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user?.id === organizer?.id ? "Организатор" : "Участник"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {page === "chat" && (
              <div className="flex flex-col overflow-y-hidden">
                <div className="relative flex h-[10vh] w-full items-center justify-center overflow-y-hidden">
                  <img
                    src={getImageUrl(meeting?.image || "")}
                    alt=""
                    className="h-full w-full rounded-t-2xl object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-xl font-bold text-white">{meeting?.name}</div>
                    <div className="flex items-center justify-center rounded-full bg-[#DFD2EA] px-2 text-sm text-black">
                      {meeting?.type}
                    </div>
                  </div>
                </div>
                <div className="h-[44vh] w-full space-y-2 overflow-y-auto bg-[#EBF1FF] p-4">
                  {chatMessages?.map((m: any) => {
                    const sender = users?.find((u) => u.id === m.userId);
                    const isCurrentUser = sender?.id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex items-end gap-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isCurrentUser && (
                          <img
                            src={getImageUrl(sender?.photo || "")}
                            alt=""
                            onClick={() => {
                              navigate({
                                to: "/user-profile/$id",
                                params: {
                                  id: sender?.id?.toString() || "",
                                },
                              });
                            }}
                            className="h-[30px] w-[30px] rounded-lg"
                          />
                        )}
                        <div
                          className={`relative flex w-[60%] flex-col gap-0.5 rounded-lg px-2 pt-2 pb-4 ${
                            isCurrentUser ? "bg-[#FFF7D7]" : "bg-[#A3BDFF]"
                          }`}
                        >
                          <span className="text-xs text-gray-600">
                            {sender?.name} {sender?.surname}
                          </span>
                          <span className="text-sm text-black">{m.message}</span>
                          <div className="absolute right-2 bottom-2 text-xs text-gray-600">
                            {format(new Date(m.createdAt), "HH:mm")}
                          </div>
                        </div>
                        {isCurrentUser && (
                          <img
                            src={getImageUrl(sender?.photo || "")}
                            alt=""
                            onClick={() => {
                              navigate({
                                to: "/profile",
                              });
                            }}
                            className="h-[30px] w-[30px] rounded-lg"
                          />
                        )}
                      </div>
                    );
                  })}
                  {/* Dummy element to anchor the scroll position at the bottom */}
                  <div ref={chatBottomRef} />
                </div>
              </div>
            )}
          </div>

          {meeting?.isCompleted ? (
            <div className="fixed right-0 bottom-0 left-0 z-[10000] mx-auto mt-4 flex w-full flex-col items-center justify-center rounded-lg bg-white text-center font-semibold text-white">
              <div
                className="z-[10001] cursor-pointer px-4 py-5 text-[#9924FF]"
                onClick={() => {
                  setIsParticipantPage(true);
                  setIsOwnerState(isOwner);
                }}
              >
                {isOwner ? "Оценить участников" : "Оценить встречу"}
              </div>
              <div className="z-[10000] flex w-full items-center justify-center gap-2 bg-[#FFE5E5] px-8 py-6 text-black">
                <Info />
                Встреча уже завершена
              </div>
            </div>
          ) : (
            <>
              {selectedCategory && page === "chat" && (
                <div className="fixed right-4 bottom-[8em] left-4 z-[10001] mx-auto rounded-lg bg-white p-3 shadow-lg">
                  <div className="mb-2 text-sm font-semibold text-gray-700">
                    {selectedCategory}
                  </div>
                  <div className="flex flex-col gap-2">
                    {chatData
                      .find((cat) => cat.category === selectedCategory)
                      ?.messages.map((message, index) => (
                        <button
                          key={index}
                          className="rounded-lg bg-gray-50 px-3 py-2 text-left text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                          onClick={() => {
                            handleSendChatMessage(message);
                            setSelectedCategory(null);
                          }}
                        >
                          {message}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {page === "chat" && (
                <div className="fixed right-0 bottom-20 left-0 z-[10000] mx-auto mt-4 flex w-full flex-col items-start justify-center gap-4 bg-white px-4 py-4 text-center font-semibold text-black">
                  <div className="">Быстрые ответы</div>
                  <div className="scrollbar-hidden flex w-full gap-8 overflow-x-auto whitespace-nowrap">
                    {chatData.map((category) => (
                      <div className="flex items-center justify-start gap-2">
                        <button
                          key={category.category}
                          className="flex-shrink-0 rounded-full py-2 text-black hover:bg-gray-200"
                          onClick={() => {
                            setSelectedCategory(
                              selectedCategory === category.category
                                ? null
                                : category.category,
                            );
                          }}
                        >
                          {category.category}
                        </button>
                        <div className="flex items-center justify-center">
                          <ChevronUp className="h-5 w-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isOwner ? (
                <div className="fixed right-0 bottom-0 left-0 z-[10000] mx-auto mt-4 flex w-auto items-center justify-center bg-white px-4 py-4 text-center font-semibold text-white">
                  <div
                    className="z-[1000] flex-1 px-8 py-3 text-[#9924FF]"
                    onClick={() => {
                      setIsEndOpen(true);
                    }}
                  >
                    Завершить
                  </div>
                </div>
              ) : isInvited ? (
                <div className="fixed right-0 bottom-0 left-0 z-50 mx-auto flex w-full items-center justify-around bg-white px-4 py-4 font-semibold text-black">
                  <button
                    className="px-6 py-2 text-[#00A349]"
                    onClick={() => handleAcceptInvite(invitesForUser[0])}
                  >
                    Принять приглашение
                  </button>
                  <button
                    className="px-6 py-2 text-[#FF4D4F]"
                    onClick={() => handleDeclineRequest(invitesForUser[0])}
                  >
                    Отклонить
                  </button>
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

          {isMoreOpen && <More setIsMoreOpen={setIsMoreOpen} event={meeting} />}
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

          {isEndOpen && (
            <EndMeetDrawer
              open={isEndOpen}
              onOpenChange={setIsEndOpen}
              meetId={Number(id)}
              handleEndMeeting={handleEndMeeting}
            />
          )}

          {isFullScreen && allPhotos.length > 0 && (
            <div className="bg-opacity-90 fixed inset-0 z-[100000] flex items-center justify-center bg-black">
              {allPhotos.length > 1 && (
                <ChevronLeft
                  className="absolute left-4 h-10 w-10 cursor-pointer text-white"
                  onClick={() =>
                    setCurrentIndex(
                      (prev) => (prev - 1 + allPhotos.length) % allPhotos.length,
                    )
                  }
                />
              )}

              {(() => {
                const imgSrc = allPhotos[currentIndex];
                return (
                  <img
                    src={imgSrc.startsWith("data:image/") ? imgSrc : getImageUrl(imgSrc)}
                    alt="Full view"
                    className="max-h-full max-w-full object-contain"
                  />
                );
              })()}

              {allPhotos.length > 1 && (
                <ChevronRight
                  className="absolute right-4 h-10 w-10 cursor-pointer text-white"
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % allPhotos.length)}
                />
              )}

              <XIcon
                className="absolute top-24 right-4 h-8 w-8 cursor-pointer text-white"
                onClick={() => setIsFullScreen(false)}
              />
            </div>
          )}
        </div>
      )}
      {isDrawerOpen && (
        <InviteDrawer
          meeting={meeting}
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          friends={friends || []}
          selectedIds={selectedFriends}
          setSelectedIds={setSelectedFriends}
          getImageUrl={getImageUrl}
          user={user}
          users={users || []}
          participants={participants}
          setParticipants={setParticipants}
        />
      )}
    </div>
  );
}

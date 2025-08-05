import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, X as XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
    return requests?.filter((r) => r.meetId === meeting?.id && r.status === "pending");
  }, [requests, meeting?.id]);

  const invitedUsers = useMemo(() => {
    return requests?.filter(
      (r) =>
        r.meetId === meeting?.id && r.status === "pending" && r.fromUserId === user?.id,
    );
  }, [meeting?.participantsIds, users]);

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

  const isMobile = usePlatform();

  return (
    <>
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
        <>
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
            className="flex gap-4 px-4 pb-4 data-[mobile=true]:pt-38"
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
                <div className="mx-4 flex items-center justify-center rounded-tl-2xl rounded-tr-lg rounded-br-2xl rounded-bl-lg bg-[#F8F0FF] px-4 py-3 text-[#721DBD]">
                  Пригласить участников
                </div>
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
                {filteredRequests?.map((r) => {
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
                })}

                <div className="mx-4 flex items-center justify-start text-xl font-bold">
                  Приглашения
                </div>
                {invitedUsers && invitedUsers.length > 0 ? (
                  invitedUsers?.map((i) => {
                    const user = users?.find((u) => u.id === i.toUserId);
                    return (
                      <div key={i.id}>
                        <div>{user?.name}</div>
                        <div>{user?.login}</div>
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

                {[organizer?.id, ...(meeting?.participantsIds || [])].map((p) => {
                  const user = users?.find((u) => u.id === Number(p));
                  return (
                    <div key={p} className="flex flex-col gap-2 px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-gray-200">
                            <img
                              src={
                                user?.photo
                                  ? getImageUrl(user?.photo)
                                  : user?.photoUrl || ""
                              }
                              alt={user?.name || ""}
                              className="h-10 w-10 rounded-full"
                            />
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
              <div className="flex flex-col">
                <div className="relative flex h-[10vh] w-full items-center justify-center">
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
                <div className="h-[44vh] w-full bg-[#EBF1FF]"></div>
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
                            // Handle sending the message
                            console.log("Sending message:", message);
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
                <div className="fixed right-4 bottom-20 left-4 z-[10000] mx-auto mt-4 flex w-auto flex-col items-start justify-center gap-4 bg-white py-4 text-center font-semibold text-black">
                  <div className="">Быстрые ответы</div>
                  <div className="scrollbar-hidden flex flex-nowrap gap-2 overflow-x-auto px-4">
                    {chatData.map((category) => (
                      <button
                        key={category.category}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-nowrap text-gray-700 hover:bg-gray-200"
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
                    ))}
                  </div>
                </div>
              )}
              {isOwner ? (
                <div className="fixed right-4 bottom-0 left-4 z-[10000] mx-auto mt-4 flex w-auto items-center justify-center bg-white py-4 text-center font-semibold text-white">
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
        </>
      )}
    </>
  );
}

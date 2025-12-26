import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { shareURL } from "@telegram-apps/sdk";
import { ArrowLeft, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Chat } from "~/components/Chat";
import { ChatMessages } from "~/components/ChatMessages";
import { ChatNav } from "~/components/ChatNav";
import { ComplaintDrawer } from "~/components/ComplaintDrawer";
import EndMeetDrawer from "~/components/EndMeetDrawer";
import { FullScreenPhoto } from "~/components/FullScreenPhoto";
import { useScroll } from "~/components/hooks/useScroll";
import { ComplaintIcon } from "~/components/Icons/Complaint";
import { Info } from "~/components/Icons/Info";
import { WhitePlusIcon } from "~/components/Icons/WhitePlus";
import InviteDrawer from "~/components/InviteDrawer";
import { MeetHeader } from "~/components/MeetHeader";
import { MeetInfo } from "~/components/MeetInfo";
import { MeetParticipations } from "~/components/MeetParticipations";
import { More } from "~/components/More";
import { Participations } from "~/components/Participations";
import { useMeetPage } from "~/hooks/useMeetPage";
import { usePlatform } from "~/hooks/usePlatform";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/meet/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isParticipantPage, setIsParticipantPage] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [page, setPage] = useState<"info" | "participants" | "chat">("info");
  const [complaint, setComplaint] = useState("");
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  // Gallery & photo state
  const [mainPhoto, setMainPhoto] = useState<string | undefined>(undefined);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const meetId = Number(id);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const {
    users,
    user,
    friends,
    chatMessages,
    meeting,
    organizer,
    isOwner,
    isParticipant,
    isRequestParticipant,
    isComplaint,
    isInvited,
    userRating,
    meetRating,
    invitesForUser,
    filteredRequests,
    invitedUsers,
    allParticipantIds,
    handleJoin,
    handleEndMeeting,
    handleSendComplaint,
    handleUnsendComplaint,
    handleRateUsers,
    accept,
    decline,
    inviteUsersByIds,
    handleSendChatMessage,
    handleDeleteParticipant,
  } = useMeetPage(meetId);

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

  const handleBack = () => window.history.back();

  const allPhotos = useMemo(() => {
    return [mainPhoto, ...galleryPhotos].filter(Boolean) as string[];
  }, [mainPhoto, galleryPhotos]);

  // Sync local photo state when meeting changes
  useEffect(() => {
    setMainPhoto(meeting?.image || undefined);
    setGalleryPhotos(meeting?.gallery ?? []);
  }, [meeting?.image, meeting?.gallery]);

  // Simplified: back button only
  const handleAcceptInvite = (invite: any) => accept(invite);
  const handleDeclineRequest = (request: any) => decline(request);
  useEffect(() => {
    if (selectedFriends.length > 0 && isDrawerOpen) {
      inviteUsersByIds(selectedFriends);
    }
  }, [selectedFriends, isDrawerOpen]);

  const isMobile = usePlatform();

  const saveEventOrMeet = useMutation(trpc.main.saveEventOrMeet.mutationOptions());

  const link = useMemo((): string => {
    return `https://t.me/pointTMA_bot/meet/${id}?startapp=ref_${user?.id || ""}`;
  }, [user?.id]);

  const text = useMemo((): string => {
    return `Поделись встречей ${meeting?.name} в Golss!`;
  }, [meeting?.name]);

  const handleShare = () => {
    if (shareURL.isAvailable()) {
      shareURL(link, text);
    }
  };

  const isSaved = user?.savedMeetsIds?.some((saved: any) => saved === Number(id));

  const handleSaveEventOrMeet = () => {
    saveEventOrMeet.mutate({
      meetId: Number(id),
    });
    queryClient.setQueryData(trpc.main.getUser.queryKey(), (old: any) => {
      if (!old) return old;
      if (isSaved) {
        return {
          ...old,
          savedMeetsIds: old.savedMeetsIds.filter((saved: any) => saved !== Number(id)),
        };
      } else {
        return {
          ...old,
          savedMeetsIds: [...(old.savedMeetsIds || []), Number(id)],
        };
      }
    });
  };

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
          isOwner={isOwner}
          organizer={organizer}
        />
      ) : (
        <div
          className={`flex h-full flex-col bg-gray-50 ${page === "chat" ? "overflow-y-hidden" : "overflow-y-auto"}`}
        >
          {/* Top Navigation Bar */}
          <div
            className={`fixed top-0 left-0 z-20 flex w-full items-center justify-between px-4 py-3 transition-all duration-200 ${
              isMobile ? "pt-28" : "pt-4"
            } ${page === "info" && !isMobile ? "bg-transparent" : "bg-white/80 shadow-sm backdrop-blur-md"}`}
          >
            <button
              onClick={() => handleBack()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-gray-800 transition-colors hover:bg-white"
            >
              <ArrowLeft className="h-6 w-6" strokeWidth={2.5} />
            </button>
            <h1
              className={`absolute left-1/2 -translate-x-1/2 text-lg font-bold text-gray-900 transition-opacity`}
            >
              {page === "chat"
                ? "Чат"
                : page === "participants"
                  ? "Участники"
                  : "Встреча"}
            </h1>
            <div className="flex h-10 items-center justify-center">
              {isOwner ? (
                <>
                  <button
                    onClick={handleShare}
                    className="rounded-full p-2 transition-colors transition-transform hover:bg-gray-200 active:scale-90"
                  >
                    <Share2 className="h-6 w-6 text-gray-900" />
                  </button>
                  <button
                    onClick={() => {
                      navigate({ to: "/meeting-edit", search: { meetId: id } });
                    }}
                    className="text-sm font-semibold text-[#9924FF] transition-colors hover:text-[#7a1bcc]"
                  >
                    Изменить
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleShare}
                    className="rounded-full p-2 transition-colors transition-transform hover:bg-gray-200 active:scale-90"
                  >
                    <Share2 className="h-6 w-6 text-gray-900" />
                  </button>
                  <button
                    onClick={() => {
                      if (isComplaint) {
                        toast.error("Вы уже пожаловались на эту встречу");
                        return;
                      }
                      setIsComplaintOpen(true);
                    }}
                    className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                  >
                    <ComplaintIcon />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Spacer for fixed header */}
          <div className={`${isMobile ? "h-48" : "h-20"} shrink-0`} />

          {/* Tabs - Segmented Control */}
          <div className="sticky top-[calc(var(--header-height,60px))] z-10 px-4 pb-4">
            <div className="flex w-full items-center rounded-2xl bg-gray-200/80 p-1">
              {["info", "participants", "chat"].map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all duration-200 ${
                    page === tab
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setPage(tab as "info" | "participants" | "chat")}
                >
                  {tab === "info" ? "Инфо" : tab === "participants" ? "Участники" : "Чат"}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className={`flex-1 ${page === "chat" ? "overflow-hidden" : ""}`}>
            {page === "info" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <MeetHeader
                  isMobile={isMobile}
                  page={page}
                  setPage={(p: string) => setPage(p as any)}
                  mainPhoto={mainPhoto}
                  meeting={meeting as any}
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
              </div>
            )}
            {page === "participants" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <MeetParticipations
                  isOwner={isOwner}
                  handleDeleteParticipant={handleDeleteParticipant}
                  meeting={meeting}
                  users={users}
                  user={user}
                  getImageUrl={getImageUrl}
                  handleAcceptRequest={handleAcceptInvite}
                  handleDeclineRequest={handleDeclineRequest}
                  filteredRequests={filteredRequests}
                  invitedUsers={invitedUsers}
                  organizer={organizer}
                  handleInvite={() => {}}
                  setIsDrawerOpen={setIsDrawerOpen}
                />
              </div>
            )}
            {page === "chat" && (
              <div className="h-full">
                <Chat
                  meeting={meeting}
                  chatMessages={chatMessages}
                  users={users}
                  user={user}
                  navigate={navigate}
                  chatBottomRef={chatBottomRef}
                />
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          {meeting?.isCompleted ? (
            <div className="fixed right-0 bottom-0 left-0 z-50 p-4">
              <div className="flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
                <div
                  className="flex w-full cursor-pointer items-center justify-center py-4 font-semibold text-[#9924FF] transition-colors hover:bg-gray-50"
                  onClick={() => setIsParticipantPage(true)}
                >
                  {isOwner ? "Оценить участников" : "Оценить встречу"}
                </div>
                <div className="flex w-full items-center justify-center gap-2 bg-red-50 py-3 text-sm font-medium text-red-600">
                  <Info />
                  Встреча завершена
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Specific Bottom Elements */}
              {selectedCategory && page === "chat" && (
                <ChatMessages
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  handleSendChatMessage={handleSendChatMessage}
                />
              )}
              {page === "chat" && (
                <ChatNav
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                />
              )}

              {/* Main Action Bar (Only show if NOT in chat, or adjust logic if needed) */}
              {page !== "chat" && (
                <div className="fixed right-0 bottom-0 left-0 z-40 p-4">
                  {isOwner ? (
                    <div className="flex justify-center">
                      <button
                        className="w-full max-w-md rounded-2xl bg-white/90 px-6 py-4 font-bold text-[#9924FF] shadow-lg ring-1 ring-black/5 backdrop-blur-md transition-transform active:scale-95"
                        onClick={() => setIsEndOpen(true)}
                      >
                        Завершить встречу
                      </button>
                    </div>
                  ) : isInvited ? (
                    <div className="flex items-center justify-center gap-4 rounded-2xl bg-white/90 p-2 shadow-lg ring-1 ring-black/5 backdrop-blur-md">
                      <button
                        className="flex-1 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-600 transition-colors hover:bg-green-100"
                        onClick={() => handleAcceptInvite(invitesForUser[0])}
                      >
                        Принять
                      </button>
                      <button
                        className="flex-1 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                        onClick={() => handleDeclineRequest(invitesForUser[0])}
                      >
                        Отклонить
                      </button>
                    </div>
                  ) : isComplaint ? (
                    <div className="flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
                      <div className="flex w-full items-center justify-center gap-2 bg-red-50 py-3 text-sm font-medium text-red-600">
                        <Info />
                        Вы пожаловались
                      </div>
                      <button
                        className="w-full py-4 font-semibold text-[#9924FF] transition-colors hover:bg-gray-50"
                        onClick={() => handleUnsendComplaint("event")}
                      >
                        Отозвать жалобу
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        className={`flex-1 rounded-2xl px-6 py-4 text-center font-bold text-white shadow-lg transition-transform active:scale-95 ${
                          isParticipant
                            ? "bg-red-500"
                            : isRequestParticipant
                              ? "bg-gray-500"
                              : "bg-[#9924FF]"
                        }`}
                        onClick={() => handleJoin()}
                      >
                        {isParticipant
                          ? "Выйти"
                          : isRequestParticipant
                            ? "Отменить запрос"
                            : "Откликнуться"}
                      </button>

                      <button
                        className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-white text-gray-700 shadow-lg ring-1 ring-black/5 transition-transform active:scale-95"
                        onClick={() => setIsMoreOpen(!isMoreOpen)}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9924FF]/10 text-[#9924FF]">
                          <WhitePlusIcon />
                        </div>
                        {/* Icon color fix needed if WhitePlusIcon is strictly white */}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {isMoreOpen && (
            <More
              handleGiveTicket={() => {}}
              handleInvite={() => {}}
              setIsMoreOpen={setIsMoreOpen}
              meet={meeting}
              handleSaveEventOrMeet={handleSaveEventOrMeet}
              isSaved={isSaved}
            />
          )}
          {isComplaintOpen && (
            <ComplaintDrawer
              handleSendComplaint={() => handleSendComplaint(complaint, "event")}
              complaint={complaint}
              setComplaint={setComplaint}
              open={isComplaintOpen}
              onOpenChange={setIsComplaintOpen}
              meetId={Number(id)}
              type="event"
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

          <FullScreenPhoto
            allPhotos={allPhotos}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            setIsFullScreen={setIsFullScreen}
            isOpen={isFullScreen && allPhotos.length > 0}
          />
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
          participants={allParticipantIds}
          setParticipants={() => {}}
          handleBuyEvent={() => {}}
        />
      )}
    </div>
  );
}

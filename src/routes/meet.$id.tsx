import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
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
import ManageDrawer from "~/ManageDrawer";

export const Route = createFileRoute("/meet/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
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
                  setPage={(p: string) => setPage(p as any)}
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
              <MeetParticipations
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
            )}
            {page === "chat" && (
              <Chat
                meeting={meeting}
                chatMessages={chatMessages}
                users={users}
                user={user}
                navigate={navigate}
                chatBottomRef={chatBottomRef}
              />
            )}
          </div>

          {meeting?.isCompleted ? (
            <div className="fixed right-0 bottom-0 left-0 z-[10000] mx-auto mt-4 flex w-full flex-col items-center justify-center rounded-lg bg-white text-center font-semibold text-white">
              <div
                className="z-[10001] cursor-pointer px-4 py-5 text-[#9924FF]"
                onClick={() => {
                  setIsParticipantPage(true);
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
              handleSendComplaint={() => handleSendComplaint(complaint)}
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
            <FullScreenPhoto
              allPhotos={allPhotos}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              setIsFullScreen={setIsFullScreen}
            />
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
          participants={allParticipantIds}
          setParticipants={() => {}}
        />
      )}
    </div>
  );
}

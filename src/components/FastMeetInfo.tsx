import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FastMeet, User as UserType } from "~/db/schema";
import { useFastMeet } from "~/hooks/useFastMeet";
import { cn } from "~/lib/utils";
import { getImage } from "~/lib/utils/getImage";
import { useTRPC } from "~/trpc/init/react";
import { Chat } from "./Chat";
import { ChatMessages } from "./ChatMessages";
import { ChatNav } from "./ChatNav";
import FastMeetSettings from "./FastMeetSettings";
import { CloseRed } from "./Icons/CloseRed";

interface FastMeetInfoProps {
  meet: FastMeet;
  currentUser: UserType | null;
  setIsMoreOpen: (isOpen: boolean) => void;
  onOpenChange: (open: boolean) => void;
}

export const FastMeetInfo = ({
  meet,
  currentUser,
  setIsMoreOpen,
  onOpenChange,
}: FastMeetInfoProps) => {
  // Получаем все данные из хука напрямую
  const {
    isOrganizer,
    organizer,
    pendingRequests,
    acceptedParticipants,
    handleAcceptRequest,
    handleLeaveFastMeet,
    handleDeleteFastMeet,
    handleDeclineRequest,
  } = useFastMeet(meet.id);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [page, setPage] = useState<"chat" | "settings" | "participants">("participants");
  const [chatTimestamps, setChatTimestamps] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // Fetch all users to display participant names and photos
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());

  const { data: chatMessages } = useQuery(
    trpc.meetings.getMessages.queryOptions({ fastMeetId: meet.id }),
  );

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when chat opens or messages change
  useEffect(() => {
    if (page === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [page, chatMessages]);

  // Fetch participants for this fast meet

  // Get user photo with fallback
  const getUserPhoto = (user: UserType | undefined) => {
    if (!user) return "/men.jpeg";
    return getImage(user, user.photo || "");
  };

  const sendMessage = useMutation(trpc.meetings.sendMessage.mutationOptions());

  const handleSendChatMessage = (msg: string) => {
    if (!meet?.id) return;
    const now = Date.now();
    const recent = chatTimestamps.filter((t) => now - t < 60_000);
    if (recent.length >= 2) {
      toast.error("Можно отправлять не более 2 сообщений в минуту");
      return;
    }
    setChatTimestamps([...recent, now]);
    sendMessage.mutate({ fastMeetId: meet.id, message: msg });
    queryClient.setQueryData(
      trpc.meetings.getMessages.queryKey({ fastMeetId: meet.id }),
      (old: any) => {
        const existing = Array.isArray(old) ? old : [];
        return [
          ...existing,
          {
            id: Math.random(),
            message: msg,
            userId: currentUser?.id,
            createdAt: new Date(),
            fastMeetId: meet.id,
          },
        ];
      },
    );
  };

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex gap-4 px-4">
        <button
          className={cn(
            "flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium",
            page === "participants" ? "bg-black text-white" : "bg-white text-black",
          )}
          onClick={() => setPage("participants")}
        >
          Участники
        </button>
        <button
          className={cn(
            "flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium",
            page === "chat" ? "bg-black text-white" : "bg-white text-black",
          )}
          onClick={() => setPage("chat")}
        >
          Чат
        </button>
        {isOrganizer && (
          <button
            className={cn(
              "flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium",
              page === "settings" ? "bg-black text-white" : "bg-white text-black",
            )}
            onClick={() => setPage("settings")}
          >
            Настройки
          </button>
        )}
      </div>
      {/* Pending Requests Section - Only visible to organizer */}
      {page === "participants" ? (
        <>
          {isOrganizer && (
            <>
              <div className="mx-4 flex items-center justify-start text-xl font-bold">
                Входящие заявки
              </div>
              {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((participant) => {
                    const user = users?.find((u) => u.id === participant.userId);
                    if (!user) return null;

                    return (
                      <div key={participant.id} className="px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="cursor-pointer p-2"
                              onClick={() => handleDeclineRequest(participant)}
                            >
                              <CloseRed />
                            </div>
                            <img
                              src={getUserPhoto(user)}
                              alt={`${user.name} ${user.surname}`}
                              className="h-14 w-14 rounded-lg object-cover"
                            />
                            <div className="flex flex-col">
                              <div className="text-lg font-medium">
                                {user.name} {user.surname}
                              </div>
                              <div className="text-sm text-gray-500">{user.login}</div>
                            </div>
                          </div>
                          <div
                            className="flex cursor-pointer items-center justify-center rounded-lg bg-green-500 p-2 text-white"
                            onClick={() => handleAcceptRequest(participant)}
                          >
                            <CheckIcon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 text-sm text-gray-500">
                  Заявок на встречу пока нет
                </div>
              )}
            </>
          )}

          {/* Participants Section */}
          <div className="mx-4 flex items-center justify-start text-xl font-bold">
            Участники
          </div>

          {/* Organizer */}
          {organizer && (
            <div className="px-4">
              <div className="flex items-center gap-3">
                <img
                  src={getUserPhoto(organizer)}
                  alt={`${organizer.name} ${organizer.surname}`}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <div className="text-lg font-bold">
                    {organizer.name} {organizer.surname}
                  </div>
                  <div className="text-sm text-gray-500">Организатор</div>
                </div>
              </div>
            </div>
          )}

          {/* Accepted Participants */}
          {acceptedParticipants.length > 0 && (
            <div className="space-y-4">
              {acceptedParticipants.map((participant) => {
                const user = users?.find((u) => u.id === participant.userId);
                if (!user) return null;

                return (
                  <div key={participant.id} className="px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={getUserPhoto(user)}
                        alt={`${user.name} ${user.surname}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div className="flex flex-col">
                        <div className="text-lg font-bold">
                          {user.name} {user.surname}
                        </div>
                        <div className="text-sm text-gray-500">Участник</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No participants message */}
          {acceptedParticipants.length === 0 && (
            <div className="px-4 text-sm text-gray-500">Пока нет принятых участников</div>
          )}

          {/* Participants count info */}
          <div className="mx-4 rounded-lg bg-purple-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span>Всего участников:</span>
              <span className="font-medium">
                {(organizer ? 1 : 0) + acceptedParticipants.length}
              </span>
            </div>
            {pendingRequests.length > 0 && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>Ожидают подтверждения:</span>
                <span className="font-medium text-orange-600">
                  {pendingRequests.length}
                </span>
              </div>
            )}
          </div>
        </>
      ) : page === "chat" ? (
        <>
          <div data-chat-container="fastmeet">
            <Chat
              meeting={{ id: meet.id, name: meet.name }}
              chatMessages={chatMessages}
              users={users}
              user={currentUser}
              navigate={(options: any) => {
                // For now, we don't navigate to user profiles in fast meets
                console.log("Navigate to user profile:", options);
              }}
              chatBottomRef={chatBottomRef}
              isFastMeet={true}
            />
          </div>
          {selectedCategory && (
            <ChatMessages
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              handleSendChatMessage={handleSendChatMessage}
            />
          )}

          <ChatNav
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </>
      ) : (
        page === "settings" && (
          <FastMeetSettings
            meet={meet}
            currentUser={currentUser}
            onSaved={() => setPage("participants")}
          />
        )
      )}
      {!isOrganizer ? (
        <div className="absolute right-4 bottom-0 left-4 z-10 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-2">
          <button
            onClick={() => {
              handleLeaveFastMeet();
              onOpenChange(false);
              setIsMoreOpen(false);
            }}
            className="flex w-full items-center justify-center rounded-xl bg-red-500 py-3 font-medium text-white"
          >
            Покинуть встречу
          </button>
        </div>
      ) : (
        page !== "settings" && (
          <div className="absolute right-4 bottom-0 left-4 z-10 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-4">
            <button
              onClick={() => {
                handleDeleteFastMeet();
                onOpenChange(false);
                setIsMoreOpen(false);
              }}
              className="flex w-full items-center justify-center rounded-xl bg-red-500 py-3 font-medium text-white"
            >
              Удалить встречу
            </button>
          </div>
        )
      )}
    </div>
  );
};

import { useMutation } from "@tanstack/react-query";
import { shareURL } from "@telegram-apps/sdk";
import { ArrowLeft, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Drawer } from "vaul";
import { useTRPC } from "~/trpc/init/react";
import { ShareIcon } from "./Icons/Share";

export default function InviteDrawer({
  open,
  onOpenChange,
  friends,
  selectedIds,
  setSelectedIds,
  getImageUrl,
  user,
  users,
  participants,
  setParticipants,
  meeting,
  handleBuyEvent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: any[];
  selectedIds: any[];
  setSelectedIds: (friends: any[]) => void;
  getImageUrl: (url: string) => string;
  user: any;
  users: any[];
  participants: any[];
  setParticipants: (participants: any[]) => void;
  meeting?: any;
  handleBuyEvent: () => void;
}) {
  const trpc = useTRPC();
  const logShareMeet = useMutation(trpc.main.logShareMeet.mutationOptions());
  const [friendName, setFriendName] = useState("");

  const link = useMemo((): string => {
    return `https://t.me/pointTMA_bot/meet${meeting?.id}?startapp=ref_${user?.id || ""}`;
  }, [user?.id, meeting?.id]);

  const text = `Приглашаю тебя на встречу ${meeting?.name} в Point!`;
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[10000] mt-24 flex h-[80%] flex-col rounded-t-[16px] bg-white p-4 lg:h-[320px]">
          <header className="flex items-center justify-between pb-4">
            <ArrowLeft className="h-6 w-6 text-transparent" />
            <div className="text-xl font-bold">Приглашения</div>
            <button onClick={() => onOpenChange(false)}>
              <X className="h-6 w-6 text-gray-900" />
            </button>
          </header>
          {meeting && (
            <div className="flex items-center justify-between pb-4">
              <div
                onClick={() => {
                  if (shareURL.isAvailable()) {
                    shareURL(link, text);
                  }
                  try {
                    if (meeting?.id) logShareMeet.mutate({ meetId: Number(meeting.id) });
                  } catch {}
                }}
                className="flex w-full items-center gap-2 rounded-3xl border border-[#DEB8FF] px-4 py-2"
              >
                <ShareIcon />
                Поделиться ссылкой на встречу
              </div>
            </div>
          )}
          <div className="flex w-full flex-col items-start gap-2 overflow-y-auto pb-4">
            <div className="mb-2 flex w-full gap-2 text-xl font-bold">
              Пригласите друга
            </div>
            <div className="mb-4 flex w-full flex-col items-start gap-2">
              <input
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                type="text"
                placeholder="Поиск"
                className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
              />
              <div className="px-4 text-xs">Можете ввести фамилию или ник</div>
            </div>
            {friends && friends?.length > 0 && (
              <div className="flex w-full flex-col gap-2 overflow-y-auto pb-10">
                {friends
                  ?.filter((request) => request.status === "accepted")
                  .map((request) => {
                    const requestUser = users?.find(
                      (u) =>
                        u.id ===
                        (request.fromUserId === user?.id
                          ? request.toUserId
                          : request.fromUserId),
                    );
                    return (
                      <div key={`request-${request.id}`}>
                        <div className="flex items-center justify-between pb-4">
                          <div className="flex items-center justify-start gap-2">
                            <img
                              src={getImageUrl(requestUser?.photo || "")}
                              alt=""
                              className="h-14 w-14 rounded-lg"
                            />
                            <div className="flex flex-col items-start justify-between gap-2">
                              <div className="text-lg">
                                {requestUser?.name} {requestUser?.surname}
                              </div>
                              <div>{requestUser?.birthday}</div>
                            </div>
                          </div>
                          {selectedIds.includes(requestUser?.id || 0) ? (
                            <div
                              className="text-sm text-nowrap text-[#00A349]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIds(
                                  selectedIds.filter((id) => id !== requestUser?.id || 0),
                                );
                              }}
                            >
                              Приглашен(-а)
                            </div>
                          ) : !participants.includes(requestUser?.id || 0) ? (
                            <div
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3E5FF]"
                              onClick={(e) => {
                                e.stopPropagation();

                                setSelectedIds([...selectedIds, requestUser?.id || 0]);
                              }}
                            >
                              <div className="pb-1 text-2xl leading-none font-bold text-[#721DBD]">
                                +
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-nowrap text-[#00A349]">
                              Участник
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {users
                  ?.filter((user) =>
                    friendName
                      ? user.name?.toLowerCase().includes(friendName.toLowerCase())
                      : false,
                  )
                  .filter(
                    (u) =>
                      u !== undefined &&
                      !friends?.some(
                        (friend) =>
                          friend.fromUserId === u.id || friend.toUserId === u.id,
                      ),
                  )
                  .map((user) => {
                    return (
                      <div key={`search-${user.id}`}>
                        <div className="flex items-center justify-between pb-4">
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
                              <div>{user?.birthday}</div>
                            </div>
                          </div>
                          {selectedIds.includes(user?.id || 0) ? (
                            <div
                              className="text-sm text-nowrap text-[#00A349]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIds(
                                  selectedIds.filter((id) => id !== user?.id || 0),
                                );
                              }}
                            >
                              Приглашен(-а)
                            </div>
                          ) : (
                            <div
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3E5FF]"
                              onClick={(e) => {
                                e.stopPropagation();

                                setSelectedIds([...selectedIds, user?.id || 0]);
                              }}
                            >
                              <div className="pb-1 text-2xl leading-none font-bold text-[#721DBD]">
                                +
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
          <div className="max-auto fixed right-0 bottom-4 left-0 px-4">
            <button
              onClick={handleBuyEvent}
              className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
            >
              <div>Создать встречу</div>
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

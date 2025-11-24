import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Minus, Plus, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
import { Invite } from "../Invite";
import { TagsDrawer } from "../TagsDrawer";

export const Step3 = ({
  friendName,
  setFriendName,
  setParticipants,
  participants,
  selectedIds,
  setSelectedIds,
  isInvite,
  setIsInvite,
  isDisabled,
  setIsDisabled,
  important,
  setImportant,
  tags,
  setTags,
  category,
}: {
  friendName: string;
  setFriendName: (friendName: string) => void;
  setParticipants: (participants: number) => void;
  participants: number;
  selectedIds: number[];
  setSelectedIds: (selectedIds: number[]) => void;
  isInvite: boolean;
  setIsInvite: (isInvite: boolean) => void;
  isDisabled: boolean;
  setIsDisabled: (isDisabled: boolean) => void;
  important: string;
  setImportant: (important: string) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  category: string;
}) => {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  const { data: friends } = useQuery(trpc.friends.getFriends.queryOptions());
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  useEffect(() => {
    if (participants > 0 && important.trim()) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [participants, tags, important, setIsDisabled]);

  return (
    <div className="px-4 pb-20">
      {isInvite ? (
        <Invite
          friendName={friendName}
          setFriendName={setFriendName}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          friends={friends || []}
          users={users || []}
          user={user}
          getImageUrl={getImageUrl}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Participants Counter */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-900" />
              <div className="text-lg font-bold text-gray-900">Участники *</div>
            </div>
            
            <div className="flex items-center justify-between rounded-2xl bg-white p-2 shadow-sm ring-1 ring-gray-100">
              <button
                onClick={() => setParticipants(Math.max(0, participants - 1))}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 active:scale-95"
              >
                <Minus className="h-5 w-5" />
              </button>
              
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-gray-900">{participants || 0}</span>
                <span className="text-xs text-gray-500">человек</span>
              </div>

              <button
                onClick={() => setParticipants((participants || 0) + 1)}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 active:scale-95"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">Для свидания нужно минимум двое</p>
          </div>

          {/* Invited Friends List */}
          {selectedIds.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-gray-900">Приглашенные друзья</h3>
              <div className="flex flex-col gap-2">
                {selectedIds.map((id) => {
                  const user = users?.find((user) => user.id === id);
                  if (!user) return null;

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(user?.photo || "")}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm">
                            {user?.name} {user?.surname}
                          </span>
                          <span className="text-xs text-gray-500">{user?.birthday}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedIds(selectedIds.filter((fid) => fid !== user?.id))}
                        className="rounded-full bg-gray-50 p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => setIsInvite(true)}
            className="flex w-full items-center justify-center rounded-2xl bg-violet-50 py-4 font-bold text-violet-600 transition-colors hover:bg-violet-100 active:scale-[0.99]"
          >
            Пригласить друзей
          </button>

          {/* Tags Section */}
          <div className="flex flex-col gap-3">
            <div className="text-lg font-bold text-gray-900">Тэги</div>
            
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-700"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-200 text-violet-700 hover:bg-violet-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-500 hover:border-violet-300 hover:text-violet-600"
              >
                <Plus className="h-3 w-3" />
                Добавить
              </button>
            </div>
          </div>

          {/* Important Info */}
          <div className="flex flex-col gap-3">
            <div className="text-lg font-bold text-gray-900">Важно *</div>
            <textarea
              value={important}
              onChange={(e) => setImportant(e.target.value)}
              placeholder="Укажите важные детали, дресс-код или требования к участникам..."
              className="min-h-[120px] w-full resize-none rounded-2xl border-none bg-white px-4 py-3 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>
        </div>
      )}
      <TagsDrawer
        open={open}
        onOpenChange={setOpen}
        category={category}
        setTags={setTags}
        tags={tags}
      />
    </div>
  );
};

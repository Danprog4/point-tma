import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
import { Thrash } from "../Icons/Thrash";
import { Invite } from "../Invite";

export const Step3 = ({
  name,
  isBasic,
  friendName,
  setFriendName,
  setParticipants,
  participants,
  selectedIds,
  setSelectedIds,
  isInvite,
  setIsInvite,
}: {
  name: string;
  isBasic: boolean;
  friendName: string;
  setFriendName: (friendName: string) => void;
  setParticipants: (participants: number) => void;
  participants: number;
  selectedIds: number[];
  setSelectedIds: (selectedIds: number[]) => void;
  isInvite: boolean;
  setIsInvite: (isInvite: boolean) => void;
}) => {
  const trpc = useTRPC();
  const [important, setImportant] = useState("");
  const navigate = useNavigate();

  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  const { data: requests } = useQuery(trpc.friends.getRequests.queryOptions());
  const activeRequests = requests?.filter((request) => request.status === "pending");
  const predefinedTags = ["Свидание", "Культурный вечер", "Театр", "Вслепую", "Ужин"];
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const { data: friends } = useQuery(trpc.friends.getFriends.queryOptions());
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());

  const filteredSuggestions = predefinedTags.filter(
    (tag) => tag.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(tag),
  );

  const addTag = (tag: string) => {
    if (!tag) return;
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  console.log(selectedIds, "selectedIds");

  return (
    <>
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
        <>
          <div className="mb-2 flex w-full gap-2 text-xl font-bold">
            Количество участников
          </div>
          <div className="mb-4 flex flex-col items-start gap-2">
            <input
              type="text"
              placeholder="Введите количество участников"
              className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
              onChange={(e) => setParticipants(Number(e.target.value))}
            />
            <div className="px-4 text-xs text-gray-500">Для свидания нужно двое</div>
          </div>
          {selectedIds &&
            selectedIds.length > 0 &&
            selectedIds.map((id) => {
              const user = users?.find((user) => user.id === id);
              if (!user) return null;

              return (
                <div key={user.id}>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIds(selectedIds.filter((id) => id !== user?.id));
                        }}
                      >
                        <Thrash />
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
          <div
            className="text-center text-lg text-[#9924FF]"
            onClick={() => setIsInvite(true)}
          >
            Пригласить из списка друзей
          </div>
          <div className="flex flex-col items-start pt-2">
            <div className="text-xl font-bold">Тэги</div>
            <div className="mb-4 w-full">
              <div className="mb-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-[#F1F1F1] px-3 py-1 text-sm text-black"
                  >
                    {tag}
                    <span
                      className="cursor-pointer text-xs text-gray-500"
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  type="text"
                  placeholder="Введите тэг"
                  className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
                />

                {tagInput && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 z-10 mt-1 w-full overflow-hidden rounded-lg border bg-white shadow">
                    {filteredSuggestions.map((suggestion) => (
                      <div
                        key={suggestion}
                        onClick={() => addTag(suggestion)}
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-[#F6F6F6]"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex w-full flex-col items-start pt-2">
                <div className="mb-2 flex w-full gap-2 text-xl font-bold">Важно</div>
                <div className="mb-4 flex w-full flex-col items-start gap-2">
                  <textarea
                    value={important}
                    onChange={(e) => setImportant(e.target.value)}
                    placeholder="Важное уточнение для встречи. Это может быть требование к партнёру(-ам)"
                    className="h-20 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 py-2 text-sm text-black placeholder:text-black/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

//  ) : (
//         <>
//           <div className="mb-2 flex w-full gap-2 text-xl font-bold">Пригласите друга</div>
//           <div className="mb-4 flex flex-col items-start gap-2">
//             <input
//               value={friendName}
//               onChange={(e) => setFriendName(e.target.value)}
//               type="text"
//               placeholder="Поиск"
//               className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
//             />
//             <div className="px-4 text-xs">Можете ввести фамилию или ник</div>
//           </div>
//           {friends && friends?.length > 0 && (
//             <div className="flex flex-col gap-2">
//               {users
//                 ?.filter((user) =>
//                   friendName
//                     ? user.name?.toLowerCase().includes(friendName.toLowerCase())
//                     : false,
//                 )
//                 .filter(
//                   (u) =>
//                     u !== undefined &&
//                     !friends?.some(
//                       (friend) => friend.fromUserId === u.id || friend.toUserId === u.id,
//                     ),
//                 )
//                 .map((user) => {
//                   return (
//                     <div key={user.id}>
//                       <div className="flex items-center justify-between pb-4">
//                         <div className="flex items-center justify-start gap-2">
//                           <img
//                             src={getImageUrl(user?.photo || "")}
//                             alt=""
//                             className="h-14 w-14 rounded-lg"
//                           />
//                           <div className="flex flex-col items-start justify-between gap-2">
//                             <div className="text-lg">
//                               {user?.name} {user?.surname}
//                             </div>
//                             <div>{user?.birthday}</div>
//                           </div>
//                         </div>
//                         {selectedIds.includes(user?.id || 0) ? (
//                           <div
//                             className="text-sm text-nowrap text-[#00A349]"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               setSelectedIds(
//                                 selectedIds.filter((id) => id !== user?.id || 0),
//                               );
//                             }}
//                           >
//                             Приглашен(-а)
//                           </div>
//                         ) : (
//                           <div
//                             className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3E5FF]"
//                             onClick={(e) => {
//                               e.stopPropagation();

//                               setSelectedIds([...selectedIds, user?.id || 0]);
//                             }}
//                           >
//                             <div className="pb-1 text-2xl leading-none font-bold text-[#721DBD]">
//                               +
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}
//               {friends
//                 ?.filter((request) => request.status === "accepted")
//                 .map((request) => {
//                   const requestUser = users?.find(
//                     (u) =>
//                       u.id ===
//                       (request.fromUserId === user?.id
//                         ? request.toUserId
//                         : request.fromUserId),
//                   );
//                   return (
//                     <div key={request.id}>
//                       <div className="flex items-center justify-between pb-4">
//                         <div className="flex items-center justify-start gap-2">
//                           <img
//                             src={getImageUrl(requestUser?.photo || "")}
//                             alt=""
//                             className="h-14 w-14 rounded-lg"
//                           />
//                           <div className="flex flex-col items-start justify-between gap-2">
//                             <div className="text-lg">
//                               {requestUser?.name} {requestUser?.surname}
//                             </div>
//                             <div>{requestUser?.birthday}</div>
//                           </div>
//                         </div>
//                         {selectedIds.includes(requestUser?.id || 0) ? (
//                           <div
//                             className="text-sm text-nowrap text-[#00A349]"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               setSelectedIds(
//                                 selectedIds.filter((id) => id !== requestUser?.id || 0),
//                               );
//                             }}
//                           >
//                             Приглашен(-а)
//                           </div>
//                         ) : (
//                           <div
//                             className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F3E5FF]"
//                             onClick={(e) => {
//                               e.stopPropagation();

//                               setSelectedIds([...selectedIds, requestUser?.id || 0]);
//                             }}
//                           >
//                             <div className="pb-1 text-2xl leading-none font-bold text-[#721DBD]">
//                               +
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}
//             </div>
//           )}
//         </>
//       )}

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";

export const Step3 = ({
  name,
  isBasic,
  friendName,
  setFriendName,
  setParticipants,
  participants,
  selectedIds,
  setSelectedIds,
}: {
  name: string;
  isBasic: boolean;
  friendName: string;
  setFriendName: (friendName: string) => void;
  setParticipants: (participants: number) => void;
  participants: number;
  selectedIds: number[];
  setSelectedIds: (selectedIds: number[]) => void;
}) => {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const { data: friends } = useQuery(trpc.friends.getFriends.queryOptions());
  const { data: requests } = useQuery(trpc.friends.getRequests.queryOptions());
  const activeRequests = requests?.filter((request) => request.status === "pending");

  console.log(selectedIds, "selectedIds");

  return (
    <>
      {isBasic ? (
        <>
          <div className="mb-4 text-xl font-bold">Сколько людей будет на вечеринке?</div>
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
            <div className="px-4 text-xs">
              Допустимое количество людей, не из числа ваших друзей
            </div>
          </div>
          <div className="flex w-full gap-2 text-xl font-bold">Пригласите друзей</div>

          <input
            type="text"
            placeholder="Поиск"
            className="mt-2 h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
          />
        </>
      ) : (
        <>
          <div className="mb-2 flex w-full gap-2 text-xl font-bold">Пригласите друга</div>
          <div className="mb-4 flex flex-col items-start gap-2">
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
            <div className="flex flex-col gap-4">
              <div className="text-lg font-medium">Друзья</div>
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
                    <div key={request.id}>
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
                        ) : (
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
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </>
  );
};

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/init/react";

export const Step3 = ({
  name,
  isBasic,
  friendName,
  setFriendName,
  setParticipants,
  participants,
}: {
  name: string;
  isBasic: boolean;
  friendName: string;
  setFriendName: (friendName: string) => void;
  setParticipants: (participants: number) => void;
  participants: number;
}) => {
  const trpc = useTRPC();
  const { data: friends } = useQuery(trpc.main.getUserFavorites.queryOptions());
  const { data: getUsers } = useQuery(trpc.main.getUsers.queryOptions());

  const filteredUsers = friends
    ?.filter((user) => getUsers?.some((friend) => friend.id === user.id))
    ?.map((user) => {
      const matchingUser = getUsers?.find((friend) => friend.id === user.id);
      return matchingUser?.name;
    });

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
          {filteredUsers
            ?.filter((user) => user?.includes(friendName))
            ?.map((user) => <div key={user}>{user}</div>)}
        </>
      )}
    </>
  );
};

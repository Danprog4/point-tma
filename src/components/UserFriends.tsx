import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
import { useScroll } from "./hooks/useScroll";

export const UserFriends = ({
  viewedUser,
  users,
  setIsFriendsPage,
}: {
  viewedUser: any;
  users: any;
  setIsFriendsPage: (isFriendsPage: boolean) => void;
}) => {
  useScroll();
  const trpc = useTRPC();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: friends } = useQuery(
    trpc.friends.getFriends.queryOptions({ userId: viewedUser?.id }),
  );

  const uniqueFriends = useMemo(() => {
    if (!friends || !viewedUser?.id) return [];
    const seen = new Set<number>();
    return friends
      .filter((r) => r.status === "accepted")
      .filter((r) => {
        const counterpartId = r.fromUserId === viewedUser?.id ? r.toUserId : r.fromUserId;
        if (counterpartId == null) return false;
        if (seen.has(counterpartId)) return false;
        seen.add(counterpartId);
        return true;
      });
  }, [friends, viewedUser?.id]);

  return (
    <div className="px-4 pt-14">
      <div className="fixed top-0 right-0 left-0 z-10 flex items-center bg-white">
        <button
          onClick={() => setIsFriendsPage(false)}
          className="absolute top-4 left-4 flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex w-full items-center justify-center p-4">
          <h1 className="text-center text-base font-bold text-gray-800">
            Друзья {viewedUser?.name} {viewedUser?.surname}
          </h1>
        </div>
      </div>
      <input
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        value={search}
        type="text"
        placeholder="Поиск друзей"
        className="mb-4 h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
      />
      <div className="absolute top-7 right-7">
        <Search className="h-5 w-5 text-gray-400" />
      </div>

      {uniqueFriends && uniqueFriends.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="text-lg font-medium">Друзья</div>
          {uniqueFriends.map((request) => {
            const requestUser = users?.find(
              (u: any) =>
                u.id ===
                (request.fromUserId === viewedUser?.id
                  ? request.toUserId
                  : request.fromUserId),
            );
            return (
              <div
                key={request.id}
                onClick={() => {
                  navigate({
                    to: "/user-profile/$id",
                    params: { id: requestUser?.id.toString() || "" },
                  });
                }}
              >
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
                </div>
              </div>
            );
          })}
        </div>
      )}
      {search && (
        <div className="flex flex-col gap-4">
          <div className="text-lg font-medium">Пользователи</div>
          {users
            ?.filter(
              (user: any) =>
                user?.name?.toLowerCase().includes(search.toLowerCase()) ||
                user?.surname?.toLowerCase().includes(search.toLowerCase()),
            )
            // .filter(
            //   (u: any) =>
            //     !uniqueFriends.some(
            //       (friend: any) => friend.fromUserId === u.id || friend.toUserId === u.id,
            //     ),
            // )
            .map((user: any) => (
              <div
                key={user.id}
                onClick={() => {
                  navigate({
                    to: "/user-profile/$id",
                    params: { id: user.id.toString() },
                  });
                }}
              >
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
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

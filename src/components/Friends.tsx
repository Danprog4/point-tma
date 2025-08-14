import { useNavigate } from "@tanstack/react-router";
import { Check, Search } from "lucide-react";
import { useState } from "react";
import { User } from "~/db/schema";
import { useFriendsData } from "~/hooks/useFriendsData";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useScrollRestoration } from "./hooks/useScrollRes";
import { CloseRed } from "./Icons/CloseRed";

export const Friends = ({
  isDrawer = false,
  setSelectedUser,
}: {
  isDrawer?: boolean;
  setSelectedUser?: (user: User) => void;
}) => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { users, activeRequests, uniqueFriends, user, acceptRequest, declineRequest } =
    useFriendsData();
  useScrollRestoration("friends-list");

  return (
    <div className="relative px-4 py-4">
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

      {search && (
        <div className="flex flex-col gap-4">
          <div className="text-lg font-medium">Пользователи</div>
          {users
            ?.filter(
              (user: any) =>
                user?.name?.toLowerCase().includes(search.toLowerCase()) ||
                user?.surname?.toLowerCase().includes(search.toLowerCase()),
            )
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
                  {isDrawer && (
                    <div
                      className="text-[#9924FF]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser?.(user);
                      }}
                    >
                      Подарить
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
      {!isDrawer && (
        <>
          {activeRequests && activeRequests?.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="text-lg font-medium">Запросы</div>
              {activeRequests.map((request: any) => {
                const requestUser = users?.find((u: any) => u.id === request.fromUserId);
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center justify-start gap-2">
                        <div
                          className="mr-4 p-2"
                          onClick={() => declineRequest(request.fromUserId!)}
                        >
                          <CloseRed />
                        </div>
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
                      <div
                        className="flex items-center justify-center rounded-lg bg-green-500 p-2 text-white"
                        onClick={() => acceptRequest(request.fromUserId!)}
                      >
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {uniqueFriends && uniqueFriends.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="text-lg font-medium">Друзья</div>
          {uniqueFriends.map((request: any) => {
            const requestUser = users?.find(
              (u: any) =>
                u.id ===
                (request.fromUserId === user?.id ? request.toUserId : request.fromUserId),
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
                  {isDrawer && (
                    <div
                      className="text-[#9924FF]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser?.(requestUser as any);
                      }}
                    >
                      Подарить
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

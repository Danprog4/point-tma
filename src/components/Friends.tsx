import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
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
  handleBuyEvent,
  isGift,
}: {
  isDrawer?: boolean;
  setSelectedUser?: (user: User) => void;
  handleBuyEvent?: () => void;
  isGift?: boolean;
}) => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { users, activeRequests, uniqueFriends, user, acceptRequest, declineRequest } =
    useFriendsData();
  useScrollRestoration("friends-list");

  return (
    <div className="relative px-4 pb-4">
      <div className="relative mb-6">
        <input
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          value={search}
          type="text"
          placeholder="Поиск друзей"
          className="h-12 w-full rounded-2xl border-none bg-gray-100 pr-4 pl-11 text-sm font-medium text-gray-900 transition-all placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
        <div className="absolute top-1/2 left-4 -translate-y-1/2">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      <AnimatePresence>
        {search && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 flex flex-col gap-4"
          >
            <div className="text-lg font-bold text-gray-900">Пользователи</div>
            <div className="flex flex-col gap-3">
              {users
                ?.filter(
                  (user: any) =>
                    user?.name?.toLowerCase().includes(search.toLowerCase()) ||
                    user?.surname?.toLowerCase().includes(search.toLowerCase()),
                )
                .map((user: any) => (
                  <motion.div
                    layout
                    key={user.id}
                    onClick={() => {
                      navigate({
                        to: "/user-profile/$id",
                        params: { id: user.id.toString() },
                      });
                    }}
                    className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm transition-transform active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-start gap-3">
                      <img
                        src={getImageUrl(user?.photo || "")}
                        alt=""
                        className="h-12 w-12 rounded-full bg-gray-200 object-cover"
                      />
                      <div className="flex flex-col gap-0.5">
                        <div className="text-base leading-none font-bold text-gray-900">
                          {user?.name} {user?.surname}
                        </div>
                        <div className="text-xs font-medium text-gray-500">
                          {user?.birthday}
                        </div>
                      </div>
                    </div>
                    {isDrawer && (
                      <button
                        className="rounded-xl bg-purple-50 px-4 py-2 text-sm font-bold text-purple-600 transition-colors hover:bg-purple-100"
                        onClick={(e) => {
                          e.stopPropagation();

                          if (isGift) {
                            setSelectedUser?.(user);
                            handleBuyEvent?.();
                            return;
                          }
                          setSelectedUser?.(user);
                        }}
                      >
                        Подарить
                      </button>
                    )}
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isDrawer && (
        <>
          {activeRequests && activeRequests?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex flex-col gap-4"
            >
              <div className="text-lg font-bold text-gray-900">Запросы</div>
              <div className="flex flex-col gap-3">
                {activeRequests.map((request: any) => {
                  const requestUser = users?.find(
                    (u: any) => u.id === request.fromUserId,
                  );
                  return (
                    <motion.div
                      layout
                      key={request.id}
                      onClick={() => {
                        navigate({
                          to: "/user-profile/$id",
                          params: { id: requestUser?.id.toString() || "" },
                        });
                      }}
                      className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm transition-transform active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-start gap-3">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-500 transition-transform active:scale-90"
                          onClick={(e) => {
                            e.stopPropagation();
                            declineRequest(request.fromUserId!);
                          }}
                        >
                          <CloseRed />
                        </div>
                        <img
                          src={getImageUrl(requestUser?.photo || "")}
                          alt=""
                          className="h-12 w-12 rounded-full bg-gray-200 object-cover"
                        />
                        <div className="flex flex-col gap-0.5">
                          <div className="text-base leading-none font-bold text-gray-900">
                            {requestUser?.name} {requestUser?.surname}
                          </div>
                          <div className="text-xs font-medium text-gray-500">
                            {requestUser?.birthday}
                          </div>
                        </div>
                      </div>
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-200 transition-transform active:scale-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          acceptRequest(request.fromUserId!);
                        }}
                      >
                        <Check className="h-5 w-5 stroke-[3px]" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </>
      )}

      {uniqueFriends && uniqueFriends.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          {!search && <div className="text-lg font-bold text-gray-900">Друзья</div>}
          <div className="flex flex-col gap-3">
            {uniqueFriends.map((request: any) => {
              const requestUser = users?.find(
                (u: any) =>
                  u.id ===
                  (request.fromUserId === user?.id
                    ? request.toUserId
                    : request.fromUserId),
              );
              return (
                <motion.div
                  layout
                  key={request.id}
                  onClick={() => {
                    navigate({
                      to: "/user-profile/$id",
                      params: { id: requestUser?.id.toString() || "" },
                    });
                  }}
                  className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm transition-transform active:scale-[0.98]"
                >
                  <div className="flex items-center justify-start gap-3">
                    <img
                      src={getImageUrl(requestUser?.photo || "")}
                      alt=""
                      className="h-12 w-12 rounded-full bg-gray-200 object-cover"
                    />
                    <div className="flex flex-col gap-0.5">
                      <div className="text-base leading-none font-bold text-gray-900">
                        {requestUser?.name} {requestUser?.surname}
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        {requestUser?.birthday}
                      </div>
                    </div>
                  </div>
                  {isDrawer && (
                    <button
                      className="rounded-xl bg-purple-50 px-4 py-2 text-sm font-bold text-purple-600 transition-colors hover:bg-purple-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isGift) {
                          setSelectedUser?.(requestUser as any);
                          handleBuyEvent?.();

                          return;
                        }
                        setSelectedUser?.(requestUser as any);
                      }}
                    >
                      Подарить
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

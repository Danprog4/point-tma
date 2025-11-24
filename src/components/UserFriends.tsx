import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { usePlatform } from "~/hooks/usePlatform";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
import { useScroll } from "./hooks/useScroll";
import { motion, AnimatePresence } from "framer-motion";

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

  const isMobile = usePlatform();

  return (
    <div data-mobile={isMobile} className="px-4 pb-safe pt-24 data-[mobile=true]:pt-32">
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between bg-[#FAFAFA]/80 px-4 py-4 backdrop-blur-xl data-[mobile=true]:pt-14"
      >
        <button
          onClick={() => setIsFriendsPage(false)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-5 w-5 text-gray-900" strokeWidth={2.5} />
        </button>

        <div className="flex flex-col items-center">
           <h1 className="text-base font-extrabold text-gray-900">
             Друзья
           </h1>
           <p className="text-xs font-medium text-gray-500">
             {viewedUser?.name} {viewedUser?.surname}
           </p>
        </div>
        <div className="w-10"></div>
      </div>
      
      <div className="relative mb-6 mt-4">
        <input
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          value={search}
          type="text"
          placeholder="Поиск друзей"
          className="h-12 w-full rounded-2xl border-none bg-white pl-11 pr-4 text-sm font-medium text-gray-900 placeholder:text-gray-500 shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
        />
        <div className="absolute top-1/2 left-4 -translate-y-1/2">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {uniqueFriends && uniqueFriends.length > 0 && !search && (
        <div 
           className="flex flex-col gap-4 mb-8"
        >
          <div className="text-lg font-bold text-gray-900">Друзья</div>
          <div className="flex flex-col gap-3">
          {uniqueFriends.map((request, idx) => {
            const requestUser = users?.find(
              (u: any) =>
                u.id ===
                (request.fromUserId === viewedUser?.id
                  ? request.toUserId
                  : request.fromUserId),
            );
            return (
              <motion.div
                key={request.id}
                onClick={() => {
                  navigate({
                    to: "/user-profile/$id",
                    params: { id: requestUser?.id.toString() || "" },
                  });
                  setIsFriendsPage(false);
                }}
                className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-start gap-3">
                  <img
                    src={getImageUrl(requestUser?.photo || "")}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover bg-gray-200"
                  />
                  <div className="flex flex-col gap-0.5">
                    <div className="text-base font-bold text-gray-900 leading-none">
                      {requestUser?.name} {requestUser?.surname}
                    </div>
                    <div className="text-xs font-medium text-gray-500">{requestUser?.birthday}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          </div>
        </div>
      )}
      
      <AnimatePresence>
      {search && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col gap-4"
        >
          <div className="text-lg font-bold text-gray-900">Пользователи</div>
          <div className="flex flex-col gap-3">
          {users
            ?.filter(
              (user: any) =>
                user?.name?.toLowerCase().includes(search.toLowerCase()) ||
                user?.surname?.toLowerCase().includes(search.toLowerCase()),
            )
            .map((user: any, idx: number) => (
              <motion.div
                key={user.id}
                onClick={() => {
                  navigate({
                    to: "/user-profile/$id",
                    params: { id: user.id.toString() },
                  });
                }}
                className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-start gap-3">
                  <img
                    src={getImageUrl(user?.photo || "")}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover bg-gray-200"
                  />
                  <div className="flex flex-col gap-0.5">
                    <div className="text-base font-bold text-gray-900 leading-none">
                      {user?.name} {user?.surname}
                    </div>
                    <div className="text-xs font-medium text-gray-500">{user?.birthday}</div>
                  </div>
                </div>
              </motion.div>
            ))}
            </div>
        </motion.div>
      )}
      </AnimatePresence>

      {!uniqueFriends?.length && !search && (
         <div className="flex flex-col items-center justify-center py-20">
           <div className="mb-6 rounded-full bg-white p-8 shadow-sm">
             <UserPlus className="h-16 w-16 text-gray-300" />
           </div>
           <div className="text-center text-gray-500">
             <p className="mb-2 text-xl font-bold text-gray-900">Нет друзей</p>
             <p className="text-sm text-gray-500">У этого пользователя пока нет друзей</p>
           </div>
         </div>
      )}
    </div>
  );
};

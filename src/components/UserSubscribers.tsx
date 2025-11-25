import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Users } from "lucide-react";
import { useState } from "react";
import { usePlatform } from "~/hooks/usePlatform";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
import { useScroll } from "./hooks/useScroll";

export const UserSubscribers = ({
  viewedUser,
  setIsSubscribersPage,
}: {
  viewedUser: any;
  setIsSubscribersPage: (isSubscribersPage: boolean) => void;
}) => {
  useScroll();
  const trpc = useTRPC();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: subscribers } = useQuery(
    trpc.main.getSubscribers.queryOptions({ userId: viewedUser?.id }),
  );

  const filteredSubscribers = subscribers?.filter((subscriber) =>
    subscriber.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const isMobile = usePlatform();

  return (
    <div
      data-mobile={isMobile}
      className="pb-safe flex flex-col px-4 data-[mobile=true]:pt-39"
    >
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between bg-[#FAFAFA]/80 px-4 py-4 backdrop-blur-xl data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => setIsSubscribersPage(false)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 text-gray-900" strokeWidth={2.5} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-extrabold text-gray-900">Подписчики</h1>
          <p className="text-xs font-medium text-gray-500">
            {viewedUser?.name} {viewedUser?.surname}
          </p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="relative mt-4 mb-6">
        <input
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          value={search}
          type="text"
          placeholder="Поиск подписчиков"
          className="h-12 w-full rounded-2xl border-none bg-white pr-4 pl-11 text-sm font-medium text-gray-900 shadow-sm transition-all placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
        />
        <div className="absolute top-1/2 left-4 -translate-y-1/2">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {filteredSubscribers && filteredSubscribers.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="text-lg font-bold text-gray-900">Подписчики</div>
          <div className="flex flex-col gap-3">
            {filteredSubscribers.map((subscriber, idx) => {
              return (
                <motion.div
                  key={subscriber.id}
                  onClick={() => {
                    navigate({
                      to: "/user-profile/$id",
                      params: { id: subscriber?.id.toString() || "" },
                    });
                    setIsSubscribersPage(false);
                  }}
                  className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm transition-transform active:scale-[0.98]"
                >
                  <div className="flex items-center justify-start gap-3">
                    <img
                      src={getImageUrl(subscriber?.photo || "")}
                      alt=""
                      className="h-12 w-12 rounded-full bg-gray-200 object-cover"
                    />
                    <div className="flex flex-col gap-0.5">
                      <div className="text-base leading-none font-bold text-gray-900">
                        {subscriber?.name} {subscriber?.surname}
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        {subscriber?.birthday}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-6 rounded-full bg-white p-8 shadow-sm">
            <Users className="h-16 w-16 text-gray-300" />
          </div>
          <div className="text-center text-gray-500">
            <p className="mb-2 text-xl font-bold text-gray-900">Нет подписчиков</p>
            <p className="text-sm text-gray-500">
              У этого пользователя пока нет подписчиков
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

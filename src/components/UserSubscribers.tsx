import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";
import { useState } from "react";
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

  return (
    <div className="flex flex-col px-4">
      <div className="fixed top-0 right-0 left-0 z-10 flex items-center bg-white">
        <button
          onClick={() => setIsSubscribersPage(false)}
          className="absolute top-4 left-4 flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex w-full items-center justify-center p-4">
          <h1 className="text-center text-base font-bold text-gray-800">
            Подписчики {viewedUser?.name} {viewedUser?.surname}
          </h1>
        </div>
      </div>
      <input
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        value={search}
        type="text"
        placeholder="Поиск подписчиков"
        className="mb-4 h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
      />
      <div className="absolute top-7 right-7">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      {filteredSubscribers && filteredSubscribers.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="text-lg font-medium">Подписчики</div>
          {filteredSubscribers.map((subscriber) => {
            return (
              <div
                key={subscriber.id}
                onClick={() => {
                  navigate({
                    to: "/user-profile/$id",
                    params: { id: subscriber?.id.toString() || "" },
                  });
                  setIsSubscribersPage(false);
                }}
              >
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center justify-start gap-2">
                    <img
                      src={getImageUrl(subscriber?.photo || "")}
                      alt=""
                      className="h-14 w-14 rounded-lg"
                    />
                    <div className="flex flex-col items-start justify-between gap-2">
                      <div className="text-lg">
                        {subscriber?.name} {subscriber?.surname}
                      </div>
                      <div>{subscriber?.birthday}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-4 py-16">
          <div className="text-center text-gray-500">
            <p className="mb-2 text-lg font-medium">Нет подписчиков</p>
            <p className="text-sm">У этого пользователя пока нет подписчиков</p>
          </div>
        </div>
      )}
    </div>
  );
};

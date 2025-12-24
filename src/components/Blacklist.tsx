import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, UserX } from "lucide-react";
import { usePlatform } from "~/hooks/usePlatform";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
import { useScroll } from "./hooks/useScroll";

export const Blacklist = ({ onBack }: { onBack: () => void }) => {
  useScroll();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isMobile = usePlatform();

  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const notInterestedIds = user?.notInterestedIds || [];

  const { data: blockedUsers, isLoading } = useQuery({
    ...trpc.main.getUsersByIds.queryOptions({ ids: notInterestedIds }),
    enabled: notInterestedIds.length > 0,
  });

  const toggleHide = useMutation(
    trpc.main.hideUser.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.main.getUser.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.main.getUsersByIds.queryKey() });
      },
    }),
  );

  const handleUnblock = (userId: number) => {
    toggleHide.mutate({ userId });
  };

  return (
    <div data-mobile={isMobile} className="pb-safe px-4 pt-24 data-[mobile=true]:pt-39">
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between bg-[#FAFAFA]/80 px-4 py-4 backdrop-blur-xl data-[mobile=true]:pt-28"
      >
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 text-gray-900" strokeWidth={2.5} />
        </button>

        <div className="flex flex-col items-center">
          <h1 className="text-base font-extrabold text-gray-900">Чёрный список</h1>
          <p className="text-xs font-medium text-gray-500">Скрытые пользователи</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {notInterestedIds.length > 0 ? (
          <>
            {blockedUsers && blockedUsers.length > 0 ? (
              blockedUsers.map((u) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getImageUrl(u.photo || "")}
                      alt=""
                      className="h-12 w-12 rounded-full bg-gray-200 object-cover"
                    />
                    <div className="flex flex-col">
                      <div className="text-base font-bold text-gray-900">
                        {u.name} {u.surname}
                      </div>
                      <div className="text-xs text-gray-500">{u.city}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(u.id)}
                    className="rounded-xl bg-violet-100 px-4 py-2 text-xs font-bold text-violet-600 transition-colors hover:bg-violet-200 active:scale-95"
                  >
                    Вернуть
                  </button>
                </motion.div>
              ))
            ) : isLoading ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 rounded-full bg-white p-8 shadow-sm">
              <UserX className="h-16 w-16 text-gray-300" />
            </div>
            <p className="text-xl font-bold text-gray-900">Список пуст</p>
            <p className="text-sm text-gray-500">Вы ещё никого не добавляли в скрытые</p>
          </div>
        )}
      </div>
    </div>
  );
};


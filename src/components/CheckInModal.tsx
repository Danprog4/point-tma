import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hapticFeedback } from "@telegram-apps/sdk";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { toast } from "sonner";
import { DAILY_REWARDS, getRewardForStreak } from "~/config/checkin";
import { lockBodyScroll, unlockBodyScroll } from "~/lib/utils/drawerScroll";
import { useTRPC } from "~/trpc/init/react";
import { Coin } from "./Icons/Coin";

export function CheckInModal({
  onClose,
  currentStreak,
}: {
  onClose: () => void;
  currentStreak: number;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const claim = useMutation(trpc.main.claimDailyCheckIn.mutationOptions());

  const todayReward = getRewardForStreak(currentStreak || 1);

  // Блокируем скролл при монтировании модалки
  useEffect(() => {
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, []);

  const handleClaim = () => {
    onClose();
    queryClient.setQueryData(trpc.main.getUser.queryKey(), (old: any) => {
      if (!old) return old;
      const reward = getRewardForStreak(currentStreak || 1);
      let updated = { ...old, checkInStreak: currentStreak };
      if (reward.type === "points") {
        updated = { ...updated, balance: (old.balance || 0) + reward.value };
      }
      if (reward.type === "xp") {
        updated = { ...updated, xp: (old.xp || 0) + reward.value };
      }
      updated = { ...updated, lastCheckIn: new Date().toISOString() };
      return updated;
    });
    claim.mutate(undefined, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: trpc.main.getUser.queryKey() });
      },
      onError: (err) => {
        toast.error(err.message || "Ошибка при получении награды");
      },
    });
    toast.success("Награда получена!");
    if (hapticFeedback.isSupported()) {
      hapticFeedback.notificationOccurred("success");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000001] flex items-center justify-center bg-black/50"
      >
        <motion.div
          initial={{ y: 50, scale: 0.95, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 50, scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mx-4 w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl"
        >
          <div className="mb-3 text-center text-xl font-bold text-gray-900">
            Забери награду за ежедневный вход
          </div>
          <div className="mb-1 text-center text-sm text-gray-600">
            Ты на дне {((currentStreak - 1) % 10) + 1} из 10
          </div>
          <div className="mb-4 text-center text-sm text-gray-600">
            Твоя награда:{" "}
            {todayReward.type === "xp"
              ? `${todayReward.value} XP`
              : `${todayReward.value} Поинтов`}
          </div>

          <div className="mb-4 grid grid-cols-5 gap-2">
            {DAILY_REWARDS.map((r, i) => {
              const day = i + 1;
              const currentDay = ((currentStreak - 1) % 10) + 1;
              const isActive = day === currentDay;
              const isCompleted = day < currentDay;
              return (
                <div
                  key={i}
                  className={`flex h-20 w-16 flex-col items-center justify-between rounded-xl border p-2 text-center text-xs ${
                    isActive
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : isCompleted
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-800"
                  }`}
                >
                  <div className="text-xs">День {day}</div>
                  <div className="mt-1 flex items-center font-semibold">
                    {r.type === "xp" ? `${r.value} XP` : `${r.value} `}
                    {r.type === "points" && <Coin width={16} height={16} />}
                  </div>
                  <div></div>
                </div>
              );
            })}
          </div>

          <button
            className="mt-2 w-full rounded-xl bg-purple-600 py-3 text-center text-white"
            onClick={handleClaim}
          >
            Забрать награду
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

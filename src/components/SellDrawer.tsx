import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hapticFeedback } from "@telegram-apps/sdk";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { User } from "~/db/schema";
import { useTRPC } from "~/trpc/init/react";
import { Coin } from "./Icons/Coin";

export default function SellDrawer({
  open,
  onOpenChange,
  item,
  eventTitle,
  children,
  user,
  maxAvailable,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: {
    type: string;
    eventId: number;
    isActive?: boolean;
    name: string;
    id?: number;
  };
  eventTitle?: string;
  children?: React.ReactNode;
  user: User;
  maxAvailable?: number;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(1);
  const [price, setPrice] = useState("");
  const [isSelling, setIsSelling] = useState(false);
  const [isSold, setIsSold] = useState(false);

  const { data: mySellings } = useQuery(trpc.market.getMySellings.queryOptions());

  const availableItems = useMemo(() => {
    if (!user?.inventory) return 0;
    return (
      user?.inventory?.filter(
        (userItem) =>
          userItem.eventId === item?.eventId &&
          userItem.name === item?.name &&
          !userItem.isActive &&
          !userItem.isInSelling,
      ).length || 0
    );
  }, [user?.inventory, item?.eventId, item?.name]);

  const { data: eventData } = useQuery({
    ...trpc.event.getEvent.queryOptions({
      id: (item?.eventId as number) ?? 0,
      category: (item?.name as string) ?? "",
    }),
    enabled: Boolean(item?.eventId && item?.name),
  });

  const event = useMemo(() => {
    if (!item) return null;
    return eventData;
  }, [item, eventData]);

  const sellItem = useMutation(
    trpc.market.sellItem.mutationOptions({
      onSuccess: () => {
        setIsSelling(false);
        setIsSold(true);

        toast.success("Предмет выставлен на продажу");

        if (hapticFeedback.isSupported()) {
          hapticFeedback.notificationOccurred("success");
        }
      },
      onError: () => {
        toast.error("Ошибка при продаже предмета");

        if (hapticFeedback.isSupported()) {
          hapticFeedback.notificationOccurred("error");
        }

        setIsSelling(false);
      },
    }),
  );

  const handleSellItem = () => {
    const priceNum = price === "" ? 0 : parseInt(price) || 0;
    if (amount <= 0 || priceNum <= 0) {
      toast.error("Введите корректное количество и цену");
      return;
    }

    setIsSelling(true);

    sellItem.mutate({
      type: "ticket",
      eventId: item?.eventId as number,
      eventType: item?.name as string,
      amount,
      price: priceNum,
    });

    queryClient.setQueryData(trpc.market.getMySellings.queryKey(), (old: any) => {
      return [
        ...(old || []),
        {
          id: Date.now(),
          type: "ticket",
          eventId: item?.eventId as number,
          eventType: item?.name as string,
          amount,
          price: priceNum,
          status: "selling",
        } as any,
      ];
    });

    queryClient.setQueryData(trpc.main.getUser.queryKey(), (old: any) => {
      if (!old) return old;
      let markedCount = 0;
      return {
        ...old,
        inventory:
          old.inventory?.map((userItem: any) => {
            if (
              markedCount < amount &&
              userItem.eventId === item?.eventId &&
              userItem.name === item?.name &&
              !userItem.isActive &&
              !userItem.isInSelling
            ) {
              markedCount++;
              return { ...userItem, isInSelling: true };
            }
            return userItem;
          }) || [],
      };
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAmount(1);
      setPrice("");
      setIsSelling(false);
      setIsSold(false);
    }
    onOpenChange(nextOpen);
  };

  const priceNum = price === "" ? 0 : parseInt(price) || 0;
  const isFormValid = amount > 0 && priceNum > 0;

  return (
    <Drawer.Root open={open} onOpenChange={handleOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[80vh] flex-col rounded-t-[16px] bg-white py-4">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between border-b px-4 pb-4"
          >
            <ArrowLeft className="h-6 w-6 text-transparent" />
            <div className="text-lg font-bold">Продать предмет</div>
            <motion.button
              className="z-[100]"
              onClick={() => handleOpenChange(false)}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6 text-gray-900" />
            </motion.button>
          </motion.header>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <AnimatePresence mode="wait">
              {!isSold && (
                <motion.div
                  key="sell-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <>
                    {/* Item Info */}
                    <div className="mb-6 flex items-center rounded-lg bg-[#FCF8FE] p-4">
                      <img
                        src={event?.image ?? ""}
                        alt={event?.title ?? ""}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="ml-3 flex flex-col">
                        <div className="text-sm font-semibold text-gray-900">
                          {event?.title || eventTitle || item?.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {item?.name === "Квест" ? "Билет на квест" : "Ваучер"}
                        </div>
                      </div>
                    </div>

                    {/* Amount Selection */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="mb-6"
                    >
                      <label className="mb-2 block text-sm font-semibold text-gray-900">
                        Количество предметов
                      </label>
                      <div className="flex items-center gap-3">
                        <motion.button
                          onClick={() => setAmount(Math.max(1, amount - 1))}
                          disabled={amount <= 1}
                          whileHover={amount > 1 ? { scale: 1.1 } : {}}
                          whileTap={amount > 1 ? { scale: 0.9 } : {}}
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-lg font-bold text-gray-900 hover:bg-gray-300 disabled:opacity-50"
                        >
                          −
                        </motion.button>
                        <motion.input
                          key={amount}
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          type="number"
                          value={amount}
                          onChange={(e) =>
                            setAmount(
                              Math.min(
                                availableItems,
                                Math.max(1, parseInt(e.target.value) || 1),
                              ),
                            )
                          }
                          min="1"
                          max={availableItems}
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-lg font-semibold focus:border-purple-600 focus:outline-none"
                        />
                        <motion.button
                          onClick={() => setAmount(Math.min(availableItems, amount + 1))}
                          disabled={amount >= availableItems}
                          whileHover={amount < availableItems ? { scale: 1.1 } : {}}
                          whileTap={amount < availableItems ? { scale: 0.9 } : {}}
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-lg font-bold text-gray-900 hover:bg-gray-300 disabled:opacity-50"
                        >
                          +
                        </motion.button>
                      </div>
                      <div className="text-sm text-gray-600">
                        Доступно для продажи:{" "}
                        <span className="font-bold text-gray-900">{availableItems}</span>
                      </div>
                    </motion.div>

                    {/* Price Selection */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-6"
                    >
                      <label className="mb-2 block text-sm font-semibold text-gray-900">
                        Цена за единицу (Поинтов)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="Введите цену"
                          min="1"
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-lg font-semibold focus:border-purple-600 focus:outline-none"
                        />
                        <Coin />
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Сумма:{" "}
                        <motion.div
                          key={amount * priceNum}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1 font-bold text-gray-900"
                        >
                          {(amount * priceNum).toLocaleString()}
                          <Coin />
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Info Block */}
                    <div className="mb-6 rounded-lg bg-blue-50 p-4">
                      <div className="text-sm text-gray-700">
                        <p className="mb-2">
                          <span className="font-semibold">Внимание:</span> Ваш предмет
                          будет выставлен на продажу в маркетплейсе.
                        </p>
                        <p>
                          Другие пользователи смогут его приобрести по указанной цене.
                        </p>
                      </div>
                    </div>
                  </>
                </motion.div>
              )}

              {isSold && (
                <motion.div
                  key="sell-success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <>
                    <div className="mb-6 text-center">
                      <div className="mb-2 text-3xl font-bold text-green-500">✓</div>
                      <div className="mb-2 text-2xl font-bold text-gray-900">
                        Успешно!
                      </div>
                      <div className="text-gray-600">
                        Вы выставили на продажу:
                        <div className="mt-2 font-semibold text-gray-900">
                          {amount} {amount === 1 ? "предмет" : "предметов"} по {priceNum}{" "}
                          P
                        </div>
                      </div>
                    </div>

                    <motion.img
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                      src={event?.image ?? ""}
                      alt={event?.title ?? ""}
                      className="mb-6 h-32 w-32 rounded-lg object-cover"
                    />
                  </>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <AnimatePresence mode="wait">
            {!isSold && (
              <motion.div
                key="footer-sell"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="border-t px-4 py-4"
              >
                <motion.button
                  onClick={handleSellItem}
                  disabled={!isFormValid || isSelling}
                  whileHover={isFormValid && !isSelling ? { scale: 1.02 } : {}}
                  whileTap={isFormValid && !isSelling ? { scale: 0.98 } : {}}
                  className={`w-full rounded-2xl px-6 py-3 font-semibold text-white transition-all ${
                    isFormValid && !isSelling
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "cursor-not-allowed bg-gray-400 opacity-60"
                  }`}
                >
                  {isSelling ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-5 w-5 rounded-full border-2 border-white border-t-transparent"
                      />
                      Выставление на продажу...
                    </motion.span>
                  ) : (
                    "Выставить на продажу"
                  )}
                </motion.button>
              </motion.div>
            )}

            {isSold && (
              <motion.div
                key="footer-done"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="border-t px-4 py-4"
              >
                <motion.button
                  onClick={() => handleOpenChange(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-2xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700"
                >
                  Готово
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

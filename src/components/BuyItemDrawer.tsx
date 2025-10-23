import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hapticFeedback } from "@telegram-apps/sdk";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
import { Coin } from "./Icons/Coin";
import { MarketStatsChart } from "./MarketStatsChart";

type SellingItem = {
  id: number;
  userId: number | null;
  type: string | null;
  eventId: number | null;
  eventType: string | null;
  amount: number | null;
  price: number | null;
  status: string | null;
  createdAt: Date | null;
};

type EventData = {
  id: number;
  title: string | null;
  description: string | null;
  image: string | null;
  type: string | null;
  category: string | null;
  location: string | null;
  date: string | null;
};

type UserData = {
  id: number;
  name: string | null;
  surname: string | null;
  photoUrl: string | null;
};

export default function BuyItemDrawer({
  open,
  onOpenChange,
  selling,
  eventData,
  seller,
  isMyItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selling: SellingItem;
  eventData: EventData | null;
  seller: UserData | null;
  isMyItem: boolean;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const maxQuantity = selling.amount || 1;
  const pricePerItem = selling.price || 0;
  const totalPrice = pricePerItem * quantity;

  // Получаем статистику по предмету
  const { data: itemStats } = useQuery(
    trpc.market.getItemStats.queryOptions({
      eventId: selling.eventId!,
      eventType: selling.eventType!,
    }),
  );

  // Debug логирование (можно убрать позже)
  useEffect(() => {
    if (itemStats && process.env.NODE_ENV === "development") {
      console.log("📊 Статистика маркета:", {
        eventId: selling.eventId,
        eventType: selling.eventType,
        totalBuyers: itemStats.totalBuyers,
        priceRange: `${itemStats.minPrice}₽ - ${itemStats.maxPrice}₽`,
        daysWithSales: itemStats.priceRangePerDay.filter((d) => d.soldCount > 0).length,
        last7Days: itemStats.priceRangePerDay,
      });
    }
  }, [itemStats, selling.eventId, selling.eventType]);

  const buyItem = useMutation(
    trpc.market.buyItem.mutationOptions({
      onSuccess: () => {
        setIsPurchasing(false);
        onOpenChange(false);

        toast.success("Вы успешно купили товар");

        if (hapticFeedback.isSupported()) {
          hapticFeedback.notificationOccurred("success");
        }

        queryClient.invalidateQueries(trpc.market.getSellings.queryOptions());
        queryClient.invalidateQueries(trpc.main.getUser.queryOptions());
      },
      onError: (error) => {
        toast.error(error.message || "Something went wrong");

        if (hapticFeedback.isSupported()) {
          hapticFeedback.notificationOccurred("error");
        }
      },
    }),
  );

  const handleBuyItem = (
    sellingId: number,
    sellerId: number,
    eventId: number,
    eventType: string,
    amount: number,
  ) => {
    setIsPurchasing(true);

    buyItem.mutate({
      sellingId,
      sellerId,
      eventId,
      eventType,
      amount,
    });
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[85vh] flex-col rounded-t-[16px] bg-white">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between border-b px-4 py-4"
          >
            <ArrowLeft className="h-6 w-6 text-transparent" />
            <div className="text-lg font-bold">Информация о предмете</div>
            <motion.button
              onClick={() => onOpenChange(false)}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6 text-gray-900" />
            </motion.button>
          </motion.header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Event Image */}
            <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200">
              {eventData?.image ? (
                <motion.img
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  src={
                    eventData.image.startsWith("https://") ||
                    eventData.image.startsWith("/")
                      ? eventData.image
                      : getImageUrl(eventData.image)
                  }
                  alt={eventData?.title || ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="flex h-full w-full items-center justify-center"
                >
                  <ShoppingCart className="h-16 w-16 text-purple-400" />
                </motion.div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute right-4 bottom-4 left-4"
              >
                <h2 className="mb-2 text-2xl font-bold text-white">
                  {eventData?.title || "Предмет"}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm"
                  >
                    {selling.eventType}
                  </motion.span>
                  {eventData?.type && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                      className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm"
                    >
                      {eventData.type}
                    </motion.span>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Details */}
            <div className="p-4">
              {/* Description */}
              {eventData?.description && (
                <div className="mb-6">
                  <h3 className="mb-2 text-lg font-bold text-gray-900">Описание</h3>
                  <p className="text-sm text-gray-700">
                    {eventData.description.slice(0, 200)}
                    {eventData.description.length > 200 ? "..." : ""}
                  </p>
                </div>
              )}

              {/* Event Details */}
              <div className="mb-6 space-y-3">
                {eventData?.location && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-semibold text-gray-900">Место:</span>
                    <span className="text-sm text-gray-700">{eventData.location}</span>
                  </div>
                )}
                {eventData?.date && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-semibold text-gray-900">Дата:</span>
                    <span className="text-sm text-gray-700">{eventData.date}</span>
                  </div>
                )}
              </div>

              {/* Seller Info */}
              <div className="mb-6 rounded-lg bg-gray-50 p-4">
                <h3 className="mb-3 text-sm font-bold text-gray-900">Продавец</h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-200 text-lg font-bold text-purple-700">
                    {seller?.name?.[0] || <User className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {seller?.name} {seller?.surname}
                    </div>
                    <div className="text-xs text-gray-600">
                      {isMyItem ? "Это ваш предмет" : "Пользователь маркетплейса"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Statistics */}
              {itemStats && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6"
                >
                  <MarketStatsChart
                    data={itemStats}
                    title="Статистика за неделю"
                    description={
                      itemStats.totalBuyers > 0
                        ? `За всё время продано ${itemStats.totalBuyers} шт.`
                        : undefined
                    }
                  />
                </motion.div>
              )}

              {/* Quantity Selector */}
              {!isMyItem && maxQuantity > 1 && (
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    Количество
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-lg font-bold text-gray-900 hover:bg-gray-300 disabled:opacity-50"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(
                          Math.min(
                            maxQuantity,
                            Math.max(1, parseInt(e.target.value) || 1),
                          ),
                        )
                      }
                      min="1"
                      max={maxQuantity}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-lg font-semibold focus:border-purple-600 focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      disabled={quantity >= maxQuantity}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-lg font-bold text-gray-900 hover:bg-gray-300 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Доступно:{" "}
                    <span className="font-bold text-gray-900">{maxQuantity}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border-t bg-white p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {quantity > 1 ? `${quantity} × ${pricePerItem.toLocaleString()}` : "Цена"}
              </span>
              <motion.div
                key={totalPrice}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1"
              >
                <span className="text-2xl font-bold text-gray-900">
                  {totalPrice.toLocaleString()}
                </span>
                <Coin />
              </motion.div>
            </div>

            {!isMyItem ? (
              <motion.button
                onClick={() =>
                  handleBuyItem(
                    selling.id,
                    seller?.id!,
                    selling.eventId!,
                    selling.eventType!,
                    quantity,
                  )
                }
                disabled={isPurchasing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-60"
              >
                {isPurchasing ? (
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
                    Покупка...
                  </motion.span>
                ) : (
                  "Купить"
                )}
              </motion.button>
            ) : (
              <button
                disabled
                className="w-full rounded-2xl bg-gray-300 px-6 py-3 font-semibold text-gray-500"
              >
                Это ваш предмет
              </button>
            )}
          </motion.div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

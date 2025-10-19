import { ArrowLeft, ShoppingCart, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { Coin } from "./Icons/Coin";

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
  const [quantity, setQuantity] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const maxQuantity = selling.amount || 1;
  const pricePerItem = selling.price || 0;
  const totalPrice = pricePerItem * quantity;

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [open]);

  const handleBuy = () => {
    setIsPurchasing(true);

    // TODO: Implement backend logic for buying
    // buyItem.mutate({ sellingId: selling.id, quantity })

    setTimeout(() => {
      toast.success(`Предмет куплен! Проверьте ваш инвентарь`);
      setIsPurchasing(false);
      onOpenChange(false);
    }, 500);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[100] flex max-h-[90vh] flex-col rounded-t-[16px] bg-white">
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b px-4 py-4">
            <ArrowLeft className="h-6 w-6 text-transparent" />
            <div className="text-lg font-bold">Информация о предмете</div>
            <button onClick={() => onOpenChange(false)}>
              <X className="h-6 w-6 text-gray-900" />
            </button>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Event Image */}
            <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200">
              {eventData?.image ? (
                <img
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
                <div className="flex h-full w-full items-center justify-center">
                  <ShoppingCart className="h-16 w-16 text-purple-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Badges */}
              <div className="absolute right-4 bottom-4 left-4">
                <h2 className="mb-2 text-2xl font-bold text-white">
                  {eventData?.title || "Предмет"}
                </h2>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
                    {selling.eventType}
                  </span>
                  {eventData?.type && (
                    <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
                      {eventData.type}
                    </span>
                  )}
                </div>
              </div>
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
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(
                          Math.min(
                            maxQuantity,
                            Math.max(1, parseInt(e.target.value) || 1),
                          ),
                        )
                      }
                      onFocus={(e) => {
                        // Select all text for easy editing
                        e.target.select();
                      }}
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
          <div className="shrink-0 border-t bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {quantity > 1 ? `${quantity} × ${pricePerItem.toLocaleString()}` : "Цена"}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-gray-900">
                  {totalPrice.toLocaleString()}
                </span>
                <Coin />
              </div>
            </div>

            {!isMyItem ? (
              <button
                onClick={handleBuy}
                disabled={isPurchasing}
                className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95 disabled:opacity-60"
              >
                {isPurchasing ? "Покупка..." : "Купить"}
              </button>
            ) : (
              <button
                disabled
                className="w-full rounded-2xl bg-gray-300 px-6 py-3 font-semibold text-gray-500"
              >
                Это ваш предмет
              </button>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

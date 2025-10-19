import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import BuyItemDrawer from "~/components/BuyItemDrawer";
import { useScroll } from "~/components/hooks/useScroll";
import { Coin } from "~/components/Icons/Coin";
import { usePlatform } from "~/hooks/usePlatform";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/market")({
  component: RouteComponent,
});

type FilterType = "all" | "ticket";

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

function RouteComponent() {
  useScroll();
  const trpc = useTRPC();
  const isMobile = usePlatform();
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<SellingItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: sellings, isLoading } = useQuery(trpc.market.getSellings.queryOptions());
  const { data: events } = useQuery(trpc.event.getEvents.queryOptions());
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  const filteredSellings = sellings?.filter((selling) => {
    // Filter by type
    if (filter !== "all" && selling.type !== filter) return false;

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      const eventData = getEventData(selling.eventId, selling.eventType);
      const matchesTitle = eventData?.title?.toLowerCase().includes(searchLower);
      const matchesCategory = selling.eventType?.toLowerCase().includes(searchLower);
      const matchesType = eventData?.type?.toLowerCase().includes(searchLower);

      if (!matchesTitle && !matchesCategory && !matchesType) return false;
    }

    return true;
  });

  const getEventData = (eventId: number | null, eventType: string | null) => {
    if (!eventId || !eventType) return null;
    return events?.find((event) => event.id === eventId && event.category === eventType);
  };

  const getUserData = (userId: number | null) => {
    if (!userId) return null;
    return users?.find((u) => u.id === userId);
  };

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen overflow-y-auto bg-gradient-to-b from-purple-50 to-white pb-24 data-[mobile=true]:pt-40"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 bg-white shadow-sm data-[mobile=true]:pt-28"
      >
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Маркетплейс</h1>
              <p className="text-sm text-gray-600">
                {filteredSellings?.length || 0} на продаже
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="mx-auto max-w-7xl">
            <p className="mb-2 text-xs text-gray-600">
              Поиск по названию события, категории или типу
            </p>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={(e) => {
                  // Scroll into view when focused to prevent jumping
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 100);
                }}
                placeholder="Поиск..."
                className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-10 focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none"
                style={{ fontSize: "16px" }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-7xl gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === "all"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter("ticket")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === "ticket"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Билеты
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 pt-54">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
          </div>
        ) : filteredSellings && filteredSellings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSellings.map((selling) => {
              const eventData = getEventData(selling.eventId, selling.eventType);
              const seller = getUserData(selling.userId);
              const isMyItem = selling.userId === user?.id;

              return (
                <div
                  key={selling.id}
                  onClick={() => {
                    setSelectedItem(selling);
                    setIsDrawerOpen(true);
                  }}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:shadow-xl"
                >
                  {/* Image */}
                  <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200">
                    {eventData?.image ? (
                      <img
                        src={
                          eventData.image.startsWith("https://") ||
                          eventData.image.startsWith("/")
                            ? eventData.image
                            : getImageUrl(eventData.image)
                        }
                        alt={eventData?.title || ""}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBag className="h-12 w-12 text-purple-400" />
                      </div>
                    )}
                    {isMyItem && (
                      <div className="absolute top-2 right-2 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                        Ваш
                      </div>
                    )}
                    {selling.amount && selling.amount > 1 && (
                      <div className="absolute top-2 left-2 rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                        ×{selling.amount}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Title */}
                    <h3 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900">
                      {eventData?.title || "Предмет"}
                    </h3>

                    {/* Type badge */}
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                        {selling.eventType}
                      </span>
                    </div>

                    {/* Seller info */}
                    <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold">
                        {seller?.name?.[0] || "?"}
                      </div>
                      <span className="truncate">
                        {seller?.name} {seller?.surname}
                      </span>
                    </div>

                    {/* Price and action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-gray-900">
                          {(selling.price || 0).toLocaleString()}
                        </span>
                        <Coin />
                      </div>
                      {!isMyItem ? (
                        <button className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95">
                          Купить
                        </button>
                      ) : (
                        <button className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-500">
                          На продаже
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <ShoppingBag className="mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Пока ничего не выставлено
            </h3>
            <p className="text-gray-600">
              {filter === "all"
                ? "Маркетплейс пуст. Станьте первым продавцом!"
                : "В этой категории пока нет товаров"}
            </p>
          </div>
        )}
      </div>

      {/* Buy Item Drawer */}
      {selectedItem && (
        <BuyItemDrawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          selling={selectedItem}
          eventData={getEventData(selectedItem.eventId, selectedItem.eventType) || null}
          seller={getUserData(selectedItem.userId) || null}
          isMyItem={selectedItem.userId === user?.id}
        />
      )}
    </div>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  History as HistoryIcon,
  Package,
  Search,
  ShoppingBag,
  Store,
  X,
} from "lucide-react";
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

type TabType = "market" | "selling" | "purchases";
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
  buyersIds?: number[] | null;
};

function RouteComponent() {
  useScroll();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isMobile = usePlatform();
  const [activeTab, setActiveTab] = useState<TabType>("market");
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<SellingItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: sellings, isLoading } = useQuery(trpc.market.getSellings.queryOptions());
  const { data: mySellings, isLoading: isLoadingMySellings } = useQuery(
    trpc.market.getMySellings.queryOptions(),
  );
  const { data: myPurchases, isLoading: isLoadingMyPurchases } = useQuery(
    trpc.market.getMyPurchases.queryOptions(),
  );
  const { data: events, isLoading: isLoadingEvents } = useQuery(
    trpc.event.getEvents.queryOptions(),
  );
  const { data: users, isLoading: isLoadingUsers } = useQuery(
    trpc.main.getUsers.queryOptions(),
  );
  const { data: user, isLoading: isLoadingUser } = useQuery(
    trpc.main.getUser.queryOptions(),
  );

  // Проверка первоначальной загрузки всех данных
  const isInitialLoading =
    isLoading || isLoadingEvents || isLoadingUsers || isLoadingUser;

  const getEventData = (eventId: number | null, eventType: string | null) => {
    if (!eventId || !eventType) return null;
    return events?.find((event) => event.id === eventId && event.category === eventType);
  };

  const getUserData = (userId: number | null) => {
    if (!userId) return null;
    return users?.find((u) => u.id === userId);
  };

  // Apply filters and search to all data sources
  const applyFilters = (
    items: typeof sellings | typeof mySellings | typeof myPurchases,
  ) => {
    return items?.filter((selling) => {
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
  };

  const filteredSellings = applyFilters(sellings);
  const filteredMySellings = applyFilters(mySellings);
  const filteredMyPurchases = applyFilters(myPurchases);

  const currentData =
    activeTab === "market"
      ? filteredSellings
      : activeTab === "selling"
        ? filteredMySellings
        : filteredMyPurchases;

  const currentLoading =
    activeTab === "market"
      ? isLoading
      : activeTab === "selling"
        ? isLoadingMySellings
        : isLoadingMyPurchases;

  const tabs = [
    { id: "market", label: "Маркет", icon: Store, count: filteredSellings?.length || 0 },
    {
      id: "selling",
      label: "Продаю",
      icon: Package,
      count: filteredMySellings?.length || 0,
    },
    {
      id: "purchases",
      label: "Купил",
      icon: HistoryIcon,
      count: filteredMyPurchases?.length || 0,
    },
  ] as const;

  // Показываем глобальный лоадер пока данные загружаются
  if (isInitialLoading) {
    return (
      <div
        data-mobile={isMobile}
        className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-50 to-white"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            className="h-16 w-16 rounded-full border-4 border-purple-600 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-semibold text-gray-700"
          >
            Загрузка маркетплейса...
          </motion.p>
        </motion.div>
      </div>
    );
  }

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
        <div className="mx-auto max-w-7xl px-4 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => window.history.back()}>
                <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
              </button>
            </div>
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingBag className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Маркетплейс</h1>
              <motion.p
                key={`${activeTab}-${filteredSellings?.length}-${filteredMySellings?.length}-${filteredMyPurchases?.length}`}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="text-sm text-gray-600"
              >
                {activeTab === "market" && `${filteredSellings?.length || 0} на продаже`}
                {activeTab === "selling" && `${filteredMySellings?.length || 0} активных`}
                {activeTab === "purchases" &&
                  `${filteredMyPurchases?.length || 0} покупок`}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-7xl gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 shadow-md"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{tab.label}</span>
                  {tab.count > 0 && (
                    <motion.span
                      className={`relative z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                        activeTab === tab.id
                          ? "bg-white/20 text-white"
                          : "bg-purple-100 text-purple-700"
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      {tab.count}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="border-t border-gray-200 bg-white px-4 py-3"
        >
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
                placeholder="Поиск..."
                className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-10 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 focus:outline-none"
              />
              {search && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="border-t border-gray-200 bg-white px-4 py-3"
        >
          <div className="mx-auto flex max-w-7xl gap-2">
            <motion.button
              onClick={() => setFilter("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === "all"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Все
            </motion.button>
            <motion.button
              onClick={() => setFilter("ticket")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                filter === "ticket"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Билеты
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-7xl px-4 pt-62"
        >
          {currentLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-64 items-center justify-center"
            >
              <motion.div
                className="h-8 w-8 rounded-full border-4 border-purple-600 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          ) : currentData && currentData.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
            >
              {currentData.map((selling, index) => {
                const eventData = getEventData(selling.eventId, selling.eventType);
                const seller = getUserData(selling.userId);
                const isMyItem = selling.userId === user?.id;
                const isSold = selling.status === "sold";

                return (
                  <motion.div
                    key={selling.id}
                    layout="position"
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.5,
                          ease: [0.22, 1, 0.36, 1], // easeOutExpo - более плавное завершение
                        },
                      },
                    }}
                    whileHover={{
                      y: -5,
                      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                    }}
                    onClick={() => {
                      if (activeTab === "market" || activeTab === "selling") {
                        setSelectedItem(selling);
                        setIsDrawerOpen(true);
                      }
                    }}
                    className={`group relative overflow-hidden rounded-2xl bg-white shadow-md ${
                      activeTab === "market" || activeTab === "selling"
                        ? "cursor-pointer hover:shadow-xl"
                        : ""
                    } ${isSold ? "opacity-70" : ""}`}
                  >
                    {/* Image */}
                    <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200">
                      {eventData?.image ? (
                        <motion.img
                          src={
                            eventData.image.startsWith("https://") ||
                            eventData.image.startsWith("/")
                              ? eventData.image
                              : getImageUrl(eventData.image)
                          }
                          alt={eventData?.title || ""}
                          className="h-full w-full object-cover"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-purple-400" />
                        </div>
                      )}
                      {isMyItem && activeTab === "market" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-md"
                        >
                          Ваш
                        </motion.div>
                      )}
                      {isSold && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-md"
                        >
                          Продано
                        </motion.div>
                      )}
                      {selling.amount && selling.amount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 }}
                          className="absolute top-2 left-2 rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white shadow-md"
                        >
                          ×{selling.amount}
                        </motion.div>
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
                        {activeTab === "purchases" && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                            Куплено
                          </span>
                        )}
                      </div>

                      {/* Seller info */}
                      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold">
                          {seller?.name?.[0] || "?"}
                        </div>
                        <span className="truncate">
                          {activeTab === "purchases" ? "Купил у: " : ""}
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
                        {activeTab === "market" && !isMyItem ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
                          >
                            Купить
                          </motion.button>
                        ) : activeTab === "market" ? (
                          <button className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-500">
                            На продаже
                          </button>
                        ) : activeTab === "selling" ? (
                          <span
                            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                              isSold
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {isSold ? "Продано" : "Активно"}
                          </span>
                        ) : (
                          <span className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                            Куплено
                          </span>
                        )}
                      </div>

                      {/* Date for history tabs */}
                      {(activeTab === "selling" || activeTab === "purchases") &&
                        selling.createdAt && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500"
                          >
                            {new Date(selling.createdAt).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </motion.div>
                        )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-64 flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeTab === "market" ? (
                  <ShoppingBag className="mb-4 h-16 w-16 text-gray-300" />
                ) : activeTab === "selling" ? (
                  <Package className="mb-4 h-16 w-16 text-gray-300" />
                ) : (
                  <HistoryIcon className="mb-4 h-16 w-16 text-gray-300" />
                )}
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mb-2 text-xl font-bold text-gray-900"
              >
                {activeTab === "market" && "Пока ничего не выставлено"}
                {activeTab === "selling" && "Вы пока ничего не продаёте"}
                {activeTab === "purchases" && "Вы пока ничего не покупали"}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="text-gray-600"
              >
                {activeTab === "market" &&
                  (filter === "all"
                    ? "Маркетплейс пуст. Станьте первым продавцом!"
                    : "В этой категории пока нет товаров")}
                {activeTab === "selling" &&
                  "Перейдите в инвентарь, чтобы выставить предметы"}
                {activeTab === "purchases" && "Купите что-нибудь на маркетплейсе!"}
              </motion.p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

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

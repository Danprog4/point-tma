import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hapticFeedback } from "@telegram-apps/sdk";
import { ArrowLeft, Clock, Repeat2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { usePlatform } from "~/hooks/usePlatform";
import { getImage } from "~/lib/utils/getImage";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";

type Trade = {
  id: number;
  fromUserId: number | null;
  toUserId: number | null;
  typeOfGiving: "case" | "item" | "ticket" | null;
  typeOfReceiving: "case" | "item" | "ticket" | null;
  eventIdOfGiving?: number | null;
  eventTypeOfGiving?: string | null;
  eventIdOfReceiving?: number | null;
  eventTypeOfReceiving?: string | null;
  itemIdOfReceiving?: number | null;
  amountOfReceiving?: number | null;
  status: "pending" | "accepted" | "rejected" | "completed" | null;
  createdAt: Date | null;
};

interface MyTradesProps {
  onBack: () => void;
}

export default function MyTrades({ onBack }: MyTradesProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isMobile = usePlatform();

  const { data: trades, isLoading } = useQuery(trpc.trades.getMyTrades.queryOptions());
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const { data: events } = useQuery(trpc.event.getEvents.queryOptions());
  const { data: cases } = useQuery(trpc.cases.getCases.queryOptions());
  const approveTrade = useMutation(
    trpc.trades.approveTrade.mutationOptions({
      onError: (error) => {
        toast.error("Не удалось принять обмен!");
        queryClient.invalidateQueries({ queryKey: trpc.trades.getMyTrades.queryKey() });
        if (hapticFeedback.isSupported()) {
          hapticFeedback.notificationOccurred("error");
        }
      },
    }),
  );
  const rejectTrade = useMutation(
    trpc.trades.rejectTrade.mutationOptions({
      onError: (error) => {
        toast.error("Не удалось отклонить обмен!");
        queryClient.invalidateQueries({ queryKey: trpc.trades.getMyTrades.queryKey() });
        if (hapticFeedback.isSupported()) {
          hapticFeedback.notificationOccurred("error");
        }
      },
    }),
  );

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case "pending":
        return "Ожидает";
      case "accepted":
        return "Принят";
      case "rejected":
        return "Отклонен";
      case "completed":
        return "Завершен";
      default:
        return status || "Неизвестно";
    }
  };

  const getItemInfo = (trade: Trade, type: "giving" | "receiving") => {
    if (type === "giving") {
      if (trade.typeOfGiving === "ticket" && trade.eventIdOfGiving) {
        const event = events?.find((e) => e.id === trade.eventIdOfGiving);
        return {
          name: event?.title || "Билет",
          image: event?.image || "/fallback.png",
          type: trade.eventTypeOfGiving || "Билет",
        };
      }
    } else {
      if (trade.typeOfReceiving === "ticket" && trade.eventIdOfReceiving) {
        const event = events?.find((e) => e.id === trade.eventIdOfReceiving);
        return {
          name: event?.title || "Билет",
          image: event?.image || "/fallback.png",
          type: trade.eventTypeOfReceiving || "Билет",
        };
      } else if (trade.typeOfReceiving === "case" && trade.itemIdOfReceiving) {
        const caseItem = cases?.find((c) => c.id === trade.itemIdOfReceiving);
        return {
          name: caseItem?.name || "Кейс",
          image: caseItem?.photo || "/fallback.png",
          type: "Кейс",
        };
      } else if (trade.amountOfReceiving) {
        return {
          name: `${trade.amountOfReceiving} поинтов`,
          image: "/coin.png",
          type: "Поинты",
        };
      }
    }
    return {
      name: "Предмет",
      image: "/fallback.png",
      type: "Предмет",
    };
  };

  const getUserById = (userId: number | null) => {
    if (!userId) return null;
    return users?.find((u) => u.id === userId);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Неизвестно";
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsDetailOpen(true);
  };

  const handleApproveTrade = (tradeId: number) => {
    approveTrade.mutate({ tradeId });
    queryClient.setQueryData(trpc.trades.getMyTrades.queryKey(), (old: any) => {
      return old.map((trade: any) => {
        if (trade.id === tradeId) {
          return { ...trade, status: "completed" };
        }
        return trade;
      });
    });
    toast.success("Обмен принят!");
    if (hapticFeedback.isSupported()) {
      hapticFeedback.notificationOccurred("success");
    }
  };

  const handleRejectTrade = (tradeId: number) => {
    rejectTrade.mutate({ tradeId });
    queryClient.setQueryData(trpc.trades.getMyTrades.queryKey(), (old: any) => {
      return old.map((trade: any) => {
        if (trade.id === tradeId) {
          return { ...trade, status: "rejected" };
        }
        return trade;
      });
    });
    toast.success("Обмен отклонен!");
    if (hapticFeedback.isSupported()) {
      hapticFeedback.notificationOccurred("success");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  // Трейды уже отсортированы на сервере по дате создания (новые сверху)
  const sortedTrades = trades || [];

  return (
    <div
      data-mobile={isMobile}
      className="mx-auto min-h-screen w-full max-w-sm bg-white pb-24 data-[mobile=true]:pt-42"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button onClick={onBack} className="flex h-6 w-6 items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex items-center justify-center">
          <div className="flex-1">
            <h1 className="text-center text-base font-bold text-gray-800">Мои обмены</h1>
          </div>
        </div>
        <div className="flex items-center justify-center p-4 pb-2"></div>
      </div>
      {/* Content */}
      <div className="">
        {sortedTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 rounded-full bg-gray-100 p-6">
              <Repeat2 className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Нет обменов</h3>
            <p className="text-center text-gray-500">У вас пока нет активных обменов</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTrades.map((trade: any, index: number) => {
              const fromUser = getUserById(trade.fromUserId);
              const toUser = getUserById(trade.toUserId);
              const givingItem = getItemInfo(trade, "giving");
              const receivingItem = getItemInfo(trade, "receiving");

              return (
                <div
                  key={trade.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                  onClick={() => handleTradeClick(trade)}
                >
                  <div className="p-4">
                    {/* Status and Date */}
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(trade.status)}`}
                      >
                        {getStatusText(trade.status)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatDate(trade.createdAt)}
                      </div>
                    </div>

                    {/* Trade Content */}
                    <div className="flex items-center gap-4">
                      {/* From User */}
                      <div className="flex flex-col items-center">
                        <img
                          src={getImage(
                            (fromUser as any) || {
                              id: 0,
                              name: "",
                              surname: "",
                              login: "",
                            },
                            "",
                          )}
                          alt={fromUser?.name || ""}
                          className="h-12 w-12 rounded-full border-2 border-gray-200 object-cover"
                        />
                        <span className="mt-1 text-xs font-medium text-gray-700">
                          {fromUser?.name || "Неизвестно"}
                        </span>
                      </div>

                      {/* Items Exchange */}
                      <div className="flex flex-1 items-center justify-between">
                        {/* Giving Item */}
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <img
                              src={
                                givingItem.image.startsWith("/")
                                  ? givingItem.image
                                  : getImageUrl(givingItem.image)
                              }
                              alt={givingItem.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                            <div className="absolute -right-1 -bottom-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                              -
                            </div>
                          </div>
                          <span className="mt-1 text-xs text-gray-600">
                            {givingItem.type}
                          </span>
                        </div>

                        {/* Arrow */}
                        <div className="flex items-center">
                          <Repeat2 className="h-6 w-6 text-purple-500" />
                        </div>

                        {/* Receiving Item */}
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <img
                              src={
                                receivingItem.image.startsWith("/")
                                  ? receivingItem.image
                                  : getImageUrl(receivingItem.image)
                              }
                              alt={receivingItem.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                            <div className="absolute -right-1 -bottom-1 rounded-full bg-green-500 px-1.5 py-0.5 text-xs font-bold text-white">
                              +
                            </div>
                          </div>
                          <span className="mt-1 text-xs text-gray-600">
                            {receivingItem.type}
                          </span>
                        </div>
                      </div>

                      {/* To User */}
                      <div className="flex flex-col items-center">
                        <img
                          src={getImage(
                            (toUser as any) || {
                              id: 0,
                              name: "",
                              surname: "",
                              login: "",
                            },
                            "",
                          )}
                          alt={toUser?.name || ""}
                          className="h-12 w-12 rounded-full border-2 border-gray-200 object-cover"
                        />
                        <span className="mt-1 text-xs font-medium text-gray-700">
                          {toUser?.name || "Неизвестно"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Trade Detail Drawer */}
      <Drawer.Root open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-10 flex h-[70vh] flex-col rounded-t-3xl bg-white px-7 py-8 shadow-2xl">
            {selectedTrade && (
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="relative flex items-center justify-between pb-4">
                  <div className="mx-auto flex items-center gap-2 text-xl font-extrabold text-purple-700">
                    <Repeat2 className="h-7 w-7 text-purple-600" />
                    Детали обмена
                  </div>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="absolute top-0 right-0 rounded-full p-1 transition hover:bg-purple-50"
                  >
                    <X className="h-6 w-6 text-purple-900" />
                  </button>
                </div>

                {/* Trade Details */}
                <div className="flex-1 space-y-6">
                  {/* Status */}
                  <div className="text-center">
                    <span
                      className={`rounded-full border px-4 py-2 text-sm font-medium ${getStatusColor(selectedTrade.status)}`}
                    >
                      {getStatusText(selectedTrade.status)}
                    </span>
                    <p className="mt-2 text-sm text-gray-500">
                      Создан {formatDate(selectedTrade.createdAt)}
                    </p>
                  </div>

                  {/* Participants */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Участники</h3>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImage(
                            (getUserById(selectedTrade.fromUserId) as any) || {
                              id: 0,
                              name: "",
                              surname: "",
                              login: "",
                            },
                            "",
                          )}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {getUserById(selectedTrade.fromUserId)?.name || "Неизвестно"}
                          </p>
                          <p className="text-sm text-gray-500">Отдает</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-right font-medium text-gray-900">
                            {getUserById(selectedTrade.toUserId)?.name || "Неизвестно"}
                          </p>
                          <p className="text-right text-sm text-gray-500">Получает</p>
                        </div>
                        <img
                          src={getImage(
                            (getUserById(selectedTrade.toUserId) as any) || {
                              id: 0,
                              name: "",
                              surname: "",
                              login: "",
                            },
                            "",
                          )}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Предметы</h3>
                    <div className="space-y-3">
                      {/* Giving Item */}
                      <div className="flex items-center gap-3 rounded-lg bg-red-50 p-3">
                        <img
                          src={
                            getItemInfo(selectedTrade, "giving").image.startsWith("/")
                              ? getItemInfo(selectedTrade, "giving").image
                              : getImageUrl(getItemInfo(selectedTrade, "giving").image)
                          }
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {getItemInfo(selectedTrade, "giving").name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getItemInfo(selectedTrade, "giving").type}
                          </p>
                        </div>
                        <div className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                          Отдает
                        </div>
                      </div>

                      {/* Receiving Item */}
                      <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
                        <img
                          src={
                            getItemInfo(selectedTrade, "receiving").image.startsWith("/")
                              ? getItemInfo(selectedTrade, "receiving").image
                              : getImageUrl(getItemInfo(selectedTrade, "receiving").image)
                          }
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {getItemInfo(selectedTrade, "receiving").name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getItemInfo(selectedTrade, "receiving").type}
                          </p>
                        </div>
                        <div className="rounded-full bg-green-500 px-2 py-1 text-xs font-bold text-white">
                          Получает
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons for Pending Trades */}
                  {selectedTrade.status === "pending" && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">Действия</h3>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            handleApproveTrade(selectedTrade.id);
                            setIsDetailOpen(false);
                          }}
                          className="flex-1 rounded-xl bg-green-500 px-4 py-3 font-semibold text-white transition hover:bg-green-600"
                        >
                          Принять обмен
                        </button>
                        <button
                          onClick={() => {
                            handleRejectTrade(selectedTrade.id);
                            setIsDetailOpen(false);
                          }}
                          className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
                        >
                          Отклонить обмен
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { openTelegramLink } from "@telegram-apps/sdk";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Info,
  MapPin,
  MessageCircle,
  Plus,
  Share2,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ActiveDrawer from "~/components/ActiveDrawer";
import GiveDrawer from "~/components/GiveDrawer";
import GiveOrTradeDrawer from "~/components/GiveOrTradeDrawer";
import { useScroll } from "~/components/hooks/useScroll";
import { BlueTelegram } from "~/components/Icons/BlueTelegram";
import { Coin } from "~/components/Icons/Coin";
import { Star } from "~/components/Icons/Star";
import InviteDrawer from "~/components/InviteDrawer";
import { More } from "~/components/More";
import QrDrawer from "~/components/QrDrawer";
import { BuyQuest } from "~/components/quest/BuyQuest";
import { QuestCard } from "~/components/QuestCard";
import { ReviewEventDrawer } from "~/components/ReviewEventDrawer";
import SellDrawer from "~/components/SellDrawer";
import TradeDrawer from "~/components/TradeDrawer";
import { User } from "~/db/schema";
import { useEventsCache } from "~/hooks/useEventsCache";
import { usePlatform } from "~/hooks/usePlatform";
import { cn } from "~/lib/utils";
import { lockBodyScroll, unlockBodyScroll } from "~/lib/utils/drawerScroll";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
import { Quest } from "~/types/quest";

export const Route = createFileRoute("/event/$name/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();

  const trpc = useTRPC();
  const { data: users } = useQuery(trpc.main.getUsers.queryOptions());
  const [isCompleted, setIsCompleted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isActiveDrawerOpen, setIsActiveDrawerOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isGiveDrawerOpen, setIsGiveDrawerOpen] = useState(false);
  const [isInviteDrawerOpen, setIsInviteDrawerOpen] = useState(false);
  const [isGiveOrTradeOpen, setIsGiveOrTradeOpen] = useState(false);
  const [isTradeDrawerOpen, setIsTradeDrawerOpen] = useState(false);
  const [isSellDrawerOpen, setIsSellDrawerOpen] = useState(false);
  const [cameFromGiveOrTrade, setCameFromGiveOrTrade] = useState(false);
  const { data: reviews } = useQuery(trpc.main.getReviews.queryOptions());
  const { data: friends } = useQuery(trpc.friends.getFriends.queryOptions());

  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const buyEvent = useMutation(trpc.event.buyEvent.mutationOptions());
  const sendGift = useMutation(trpc.main.sendGift.mutationOptions());
  const [page, setPage] = useState("info");
  const { name, id } = Route.useParams();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isBought, setIsBought] = useState(false);
  const { data: cases } = useQuery(trpc.cases.getCases.queryOptions());
  const { data: keys } = useQuery(trpc.cases.getKeys.queryOptions());
  const [isGift, setIsGift] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Map friendship records to actual User objects
  const friendUsers = useMemo(() => {
    if (!friends || !users || !user) return [];
    return friends
      .map((friendship) => {
        const friendId =
          friendship.fromUserId === user.id ? friendship.toUserId : friendship.fromUserId;
        return users.find((u) => u.id === friendId);
      })
      .filter((u): u is User => u !== undefined);
  }, [friends, users, user]);

  console.log(keys, "keys");

  const [count, setCount] = useState(1);

  const queryClient = useQueryClient();
  const { data: userEvents } = useQuery(trpc.event.getMyEvents.queryOptions());

  const navigate = useNavigate();

  useEffect(() => {
    const relatedEvents = userEvents?.filter(
      (e) => e.eventId === Number(id) && e.type === "Квест" && e.name === name,
    );

    const hasUnfinished = relatedEvents?.some((e) => !e.isCompleted);
    const hasFinished = relatedEvents?.some((e) => e.isCompleted);

    if (hasUnfinished) {
      setIsCompleted(false);
    } else if (hasFinished) {
      setIsCompleted(true);
    } else {
      setIsCompleted(false);
    }
  }, [name, id, userEvents]);

  const { events, isLoading: cacheLoading, getEventById } = useEventsCache();

  // Ищем событие в кэше
  const event = getEventById(Number(id), name ?? "");

  console.log(event, "event image");

  const filteredReviews = reviews?.filter((review) => review.eventId === Number(id));
  console.log(event);

  const ticket = useMemo(() => {
    return user?.inventory?.find(
      (ticket) => ticket.eventId === Number(id) && ticket.name === name,
    );
  }, [user?.inventory, id, name]);

  const ticketsForEvent =
    user?.inventory?.filter(
      (ticket) => ticket.eventId === Number(id) && ticket.name === name,
    ) ?? [];

  const hasActiveTicket = ticketsForEvent.some((t) => t.isActive);
  const hasInactiveTicket = ticketsForEvent.some((t) => !t.isActive);

  const isTicketAvailable = ticketsForEvent.length > 0;

  const showActivatedLabel = hasActiveTicket && !hasInactiveTicket;

  const isDisabled = (user?.balance ?? 0) < (event?.price ?? 0) * count;

  console.log(selectedUser, "selectedUser");
  console.log(ticket, "ticket");

  const handleBuyEvent = () => {
    if (isDisabled) {
      return;
    }

    buyEvent.mutate(
      {
        id: Number(id),
        name,
        count,
      },
      {
        onSuccess: (createdTickets: any[]) => {
          queryClient.invalidateQueries({ queryKey: trpc.main.getUser.queryKey() });

          queryClient.setQueryData(trpc.tasks.getTasksProgress.queryKey(), (old: any) => {
            if (!old) return old;
            return old.map((task: any) => {
              if (task.taskId === "buy-event" && !task.isCompleted) {
                return { ...task, progress: (task.progress || 0) + 1 };
              }
              return task;
            });
          });

          if (isGift) {
            const justCreated = createdTickets?.[createdTickets.length - 1];
            if (selectedUser && justCreated?.id) {
              sendGift.mutate(
                { userId: selectedUser.id, item: justCreated },
                {
                  onSuccess: () => {
                    queryClient.invalidateQueries({
                      queryKey: trpc.main.getUser.queryKey(),
                    });
                    setSelectedUser(null);
                    setIsOpen(false);
                    setIsGift(false);
                    toast.success("Билет успешно подарен");
                  },
                },
              );
            }
            return;
          }

          setIsBought(true);
        },
      },
    );
  };

  const saveEventOrMeet = useMutation(trpc.main.saveEventOrMeet.mutationOptions());

  const isSaved = user?.savedEvents?.some(
    (saved: any) =>
      saved.eventId === Number(id) && saved.type === (event?.category ?? ""),
  );

  const handleSaveEventOrMeet = () => {
    saveEventOrMeet.mutate({
      eventId: Number(id),
      type: event?.category ?? "",
    });
    queryClient.setQueryData(trpc.main.getUser.queryKey(), (old: any) => {
      if (!old) return old;
      if (isSaved) {
        return {
          ...old,
          savedEvents: old.savedEvents.filter(
            (saved: any) =>
              !(saved.eventId === Number(id) && saved.type === (event?.category ?? "")),
          ),
        };
      } else {
        return {
          ...old,
          savedEvents: [
            ...(old.savedEvents || []),
            { type: event?.category ?? "", eventId: Number(id) },
          ],
        };
      }
    });
  };

  console.log(event?.category === "Квест", "event cat2");

  const endQuest = useMutation(trpc.event.endQuest.mutationOptions());
  console.log(event?.category, "event cat");
  const handleEndQuest = () => {
    if (isCompleted) {
      navigate({ to: "/" });
      return;
    }

    setIsReviewOpen(true);

    setIsCompleted(true);
  };

  const itemData = useMemo(() => {
    return user?.inventory?.find(
      (item) => item.eventId === Number(id) && item.name === name && !item.isActive,
    );
  }, [user?.inventory, id, name]);

  const isMobile = usePlatform();

  console.log(event?.rewards, "events");

  const pointRewards = event?.rewards?.filter((reward: any) => reward.type === "point");
  const caseRewards = event?.rewards?.filter((reward: any) => reward.type === "case");
  const keyRewards = event?.rewards?.filter((reward: any) => reward.type === "key");

  console.log(caseRewards, "caseRewards");
  console.log(keyRewards, "keyRewards");

  return (
    <div
      data-mobile={isMobile}
      className="min-h-screen bg-[#FAFAFA] pb-8 data-[mobile=true]:pt-0"
    >
      {isOpen ? (
        <>
          <>
            <BuyQuest
              isBought={isBought}
              quest={event as Quest}
              setIsOpen={setIsOpen}
              count={count}
              setCount={setCount}
            />
            <div className="pb-safe fixed right-0 bottom-0 left-0 flex items-center gap-2 border-t border-gray-100 bg-white/80 backdrop-blur-md">
              {!isBought ? (
                <div className="mx-auto flex w-full items-center gap-2 px-4 py-4">
                  <button
                    onClick={handleBuyEvent}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-4 font-bold text-white shadow-lg shadow-purple-200 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    disabled={isDisabled}
                  >
                    <span>
                      {isDisabled
                        ? "Недостаточно средств"
                        : buyEvent.isPending
                          ? "Покупка..."
                          : `Купить за ${event?.price! * count}`}
                    </span>
                    <Coin />
                  </button>
                </div>
              ) : (
                <div className="mx-auto flex w-full flex-col items-center gap-2 px-4 py-4"></div>
              )}
            </div>
          </>
          <div className="pb-safe fixed right-0 bottom-0 left-0 flex items-center gap-2 border-t border-gray-100 bg-white/80 backdrop-blur-md">
            {!isBought ? (
              <div className="mx-auto flex w-full items-center gap-2 px-4 py-4">
                <button
                  onClick={handleBuyEvent}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-4 font-bold text-white shadow-lg shadow-purple-200 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  disabled={isDisabled}
                >
                  <span>
                    {isDisabled
                      ? "Недостаточно средств"
                      : buyEvent.isPending
                        ? "Покупка..."
                        : `Купить за ${event?.price! * count}`}
                  </span>
                  <Coin />
                </button>
              </div>
            ) : (
              <div className="mx-auto flex w-full flex-col items-center gap-3 px-4 py-4">
                <button
                  onClick={() => {
                    navigate({ to: "/" });
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-4 font-bold text-gray-900 shadow-sm transition-transform active:scale-95"
                >
                  Вернуться на главную
                </button>
                <button
                  onClick={() => {
                    navigate({ to: "/inventory" });
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-4 font-bold text-gray-900 shadow-sm transition-transform active:scale-95"
                >
                  В инвентарь
                </button>
                <ActiveDrawer
                  id={Number(id)}
                  open={isActiveDrawerOpen}
                  onOpenChange={setIsActiveDrawerOpen}
                  name={name}
                >
                  {event?.category === "Квест" ? (
                    <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-4 font-bold text-white shadow-lg shadow-purple-200 transition-transform active:scale-95">
                      {showActivatedLabel ? "Билет активирован" : "Активировать билет"}
                    </button>
                  ) : (
                    <div></div>
                  )}
                </ActiveDrawer>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="pb-24">
          {/* Modern Header with Back Button */}
          <div className="pt-safe pointer-events-none fixed top-0 left-0 z-20 flex w-full items-center justify-between px-4 py-4 pt-28">
            <button
              onClick={() => window.history.back()}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/20 shadow-sm backdrop-blur-md transition-all active:scale-95"
            >
              <ArrowLeft className="h-5 w-5 text-white" strokeWidth={2.5} />
            </button>

            <div className="pointer-events-auto flex gap-2">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/20 shadow-sm backdrop-blur-md transition-all active:scale-95"
                onClick={() => {
                  // Share logic
                }}
              >
                <Share2 className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          <div className="relative h-[45vh] w-full overflow-hidden">
            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8 }}
              src={
                event?.image?.startsWith("https://") || event?.image?.startsWith("/")
                  ? event?.image
                  : getImageUrl(event?.image || "")
              }
              alt={event?.title ?? ""}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            <div className="absolute bottom-0 left-0 w-full p-6 pb-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-3 flex items-center gap-2"
              >
                <span className="rounded-full border border-white/10 bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                  {event?.category}
                </span>
                {event?.type && (
                  <span className="rounded-full border border-white/10 bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                    {event?.type}
                  </span>
                )}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-2 text-3xl leading-tight font-extrabold text-white drop-shadow-lg"
              >
                {event?.title}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4 text-sm font-medium text-white/90"
              >
                {event?.date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {event.date}
                  </div>
                )}
                {event?.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Content Container with Overlap */}
          <div className="relative z-10 -mt-6 min-h-[50vh] rounded-t-[32px] bg-[#FAFAFA] px-5 pt-8">
            {/* Tabs */}
            <div className="mb-6 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-gray-100">
              <div className="relative flex h-10 items-center">
                <div
                  className={cn(
                    "absolute h-full w-1/2 rounded-xl bg-gray-900 transition-all duration-300 ease-in-out",
                    page === "reviews" ? "translate-x-[100%]" : "translate-x-0",
                  )}
                />
                <button
                  onClick={() => setPage("info")}
                  className={cn(
                    "relative z-10 flex flex-1 items-center justify-center gap-2 text-sm font-bold transition-colors duration-200",
                    page === "info" ? "text-white" : "text-gray-500",
                  )}
                >
                  <Info className="h-4 w-4" />
                  Информация
                </button>
                <button
                  onClick={() => setPage("reviews")}
                  className={cn(
                    "relative z-10 flex flex-1 items-center justify-center gap-2 text-sm font-bold transition-colors duration-200",
                    page === "reviews" ? "text-white" : "text-gray-500",
                  )}
                >
                  <MessageCircle className="h-4 w-4" />
                  Отзывы
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {page === "info" ? (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-4"
                >
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                    <h3 className="mb-3 text-lg font-bold text-gray-900">Описание</h3>
                    <div className="space-y-3 text-sm leading-relaxed text-gray-600">
                      {event?.description
                        ?.split(/\n{2,}/)
                        .map((paragraph, idx) => <p key={idx}>{paragraph}</p>)}
                    </div>
                  </div>

                  {(event?.location || event?.organizer) && (
                    <div className="grid grid-cols-2 gap-4">
                      {event?.location && (
                        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div className="text-xs font-medium text-gray-500">Локация</div>
                          <div className="text-sm font-bold text-gray-900">
                            {event.location}
                          </div>
                        </div>
                      )}
                      {event?.organizer && (
                        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
                          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <Info className="h-5 w-5" />
                          </div>
                          <div className="text-xs font-medium text-gray-500">
                            Организатор
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            {event.organizer}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {event?.stages && event?.stages?.length > 0 ? (
                    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                      <h3 className="mb-4 text-lg font-bold text-gray-900">
                        Этапы квеста
                      </h3>
                      <div className="relative pl-2">
                        <div className="absolute top-2 bottom-6 left-[15px] w-0.5 bg-gray-100" />
                        {event?.stages?.map((stage, idx) => (
                          <div
                            key={idx}
                            className="relative flex items-start gap-4 pb-6 last:pb-0"
                          >
                            <div className="relative z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white ring-4 ring-white">
                              {idx + 1}
                            </div>
                            <div className="pt-1">
                              <div className="font-bold text-gray-900">{stage.title}</div>
                              <div className="mt-1 text-sm text-gray-500">
                                {stage.desc}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Sub-quests logic
                    <div className="flex flex-col gap-3">
                      {event?.quests?.map((quest) => (
                        <div
                          key={quest.id}
                          className="rounded-3xl bg-white p-2 shadow-sm ring-1 ring-gray-100"
                        >
                          <QuestCard quest={quest as any} isNavigable={true} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rewards Section */}
                  <div className="rounded-3xl bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] p-6 text-white shadow-lg">
                    <div className="mb-6 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-400" />
                      <h3 className="text-lg font-bold">Награды</h3>
                    </div>

                    <div className="mb-6">
                      <div className="mb-1 text-xs font-medium text-white/60">
                        Основная награда
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-white">
                          +{pointRewards?.[0]?.value?.toLocaleString() || 0}
                        </span>
                        <Coin />
                      </div>
                    </div>

                    {((caseRewards && caseRewards.length > 0) ||
                      (keyRewards && keyRewards.length > 0)) && (
                      <div className="grid grid-cols-2 gap-3">
                        {caseRewards?.map((reward: any, index: number) => (
                          <div
                            key={`case-${index}`}
                            className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/10 p-4 backdrop-blur-sm"
                          >
                            <img
                              src={
                                cases?.find((c) => c.id === reward.eventId)?.photo || ""
                              }
                              alt="case"
                              className="mb-2 h-12 w-12 object-contain"
                            />
                            <span className="text-center text-xs font-medium text-white/80">
                              {cases?.find((c) => c.id === reward.eventId)?.name}
                            </span>
                          </div>
                        ))}
                        {keyRewards?.map((reward: any, index: number) => (
                          <div
                            key={`key-${index}`}
                            className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/10 p-4 backdrop-blur-sm"
                          >
                            <img
                              src={
                                cases?.find((c) => c.id === reward.caseId)?.photo || ""
                              }
                              alt="key"
                              className="mb-2 h-12 w-12 object-contain"
                            />
                            <span className="text-center text-xs font-medium text-white/80">
                              Ключ от {cases?.find((c) => c.id === reward.caseId)?.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-3"
                >
                  {filteredReviews && filteredReviews.length > 0 ? (
                    filteredReviews.map((review) => {
                      const user = users?.find((user) => user.id === review.userId);
                      return (
                        <div
                          key={review.id}
                          className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg">
                                {user?.name?.[0] || "?"}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">
                                  {user?.name} {user?.surname}
                                </div>
                                <div className="text-xs text-gray-500">Участник</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1">
                              <span className="font-bold text-yellow-600">
                                {review.rating}
                              </span>
                              <Star />
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed text-gray-600">
                            {review.review}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                      <MessageCircle className="mb-2 h-12 w-12 opacity-20" />
                      <p>Нет отзывов</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Sticky Bar */}
          {!isTicketAvailable ||
          (hasActiveTicket && !hasInactiveTicket && isCompleted) ? (
            <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-100 bg-white/80 px-5 py-4 pb-8 backdrop-blur-xl">
              <div className="mx-auto flex w-full max-w-md items-center gap-3">
                <button
                  onClick={() => setIsOpen(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-4 font-bold text-white shadow-lg shadow-purple-200 transition-transform active:scale-95"
                >
                  <span>Купить за {event?.price}</span>
                  <Coin />
                </button>
                <button
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm transition-transform active:scale-95"
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                >
                  <Plus className="h-6 w-6 text-gray-900" />
                </button>
              </div>
            </div>
          ) : hasInactiveTicket ? (
            <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-100 bg-white/80 px-5 py-4 pb-4 backdrop-blur-xl">
              {event?.category === "Квест" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    {!itemData?.isInTrade ? (
                      <button
                        onClick={() => setIsGiveOrTradeOpen(true)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-100 px-4 py-3.5 text-sm font-bold text-orange-600 transition-transform active:scale-95"
                      >
                        Подарить/Обменять
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          toast.error(
                            "Вы уже обмениваетесь этим предметом. Сначала завершите обмен",
                          )
                        }
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gray-100 px-4 py-3.5 text-sm font-bold text-gray-400"
                      >
                        Подарить/Обменять
                      </button>
                    )}

                    <button
                      onClick={() => setIsSellDrawerOpen(true)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-purple-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition-transform active:scale-95"
                    >
                      Продать
                    </button>
                  </div>

                  <ActiveDrawer
                    id={Number(id)}
                    name={name}
                    open={isActiveDrawerOpen}
                    onOpenChange={(open) => {
                      if (open) {
                        lockBodyScroll();
                      } else {
                        unlockBodyScroll();
                      }
                      setIsActiveDrawerOpen(open);
                    }}
                  >
                    <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-emerald-200 transition-transform active:scale-95">
                      Активировать
                    </button>
                  </ActiveDrawer>
                </div>
              ) : (
                <div className="flex w-full items-center gap-3">
                  <button
                    onClick={() => setIsGiveDrawerOpen(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#DEB8FF] px-6 py-4 font-bold text-white shadow-lg transition-transform active:scale-95"
                  >
                    Подарить
                  </button>
                  <QrDrawer open={isQrOpen} onOpenChange={setIsQrOpen}>
                    <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-4 font-bold text-white shadow-lg shadow-purple-200 transition-transform active:scale-95">
                      QR CODE
                    </button>
                  </QrDrawer>
                </div>
              )}
            </div>
          ) : (
            <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-100 bg-white/80 px-5 py-4 pb-8 backdrop-blur-xl">
              <div className="mx-auto flex w-full items-center gap-3">
                <button
                  onClick={handleEndQuest}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-4 font-bold text-white shadow-lg shadow-purple-200 transition-transform active:scale-95"
                >
                  {isCompleted ? "Вернуться на главную" : "Завершить этап"}
                </button>
                <button
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform active:scale-95"
                  onClick={() => {
                    openTelegramLink("https://t.me/joinchat/uyQGDiDmRsc0YTcy");
                  }}
                >
                  <BlueTelegram />
                </button>
              </div>
            </div>
          )}

          {/* More Menu Drawer needs to be triggered manually or via its own logic. 
              The previous implementation had it conditionally rendered. 
              We'll keep it conditional but ensure the button toggles it. 
          */}
          {isMoreOpen && (
            <More
              setIsMoreOpen={setIsMoreOpen}
              handleSaveEventOrMeet={handleSaveEventOrMeet}
              handleGiveTicket={() => {
                setIsGiveDrawerOpen(true);
                setIsGift(true);
                setIsMoreOpen(false);
              }}
              handleInvite={() => {
                setIsInviteDrawerOpen(true);
                setIsMoreOpen(false);
              }}
              event={event}
              isSaved={isSaved}
            />
          )}
        </div>
      )}

      {isReviewOpen && (
        <ReviewEventDrawer
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          id={Number(id)}
          name={name}
        />
      )}

      {isGiveDrawerOpen && (
        <GiveDrawer
          item={ticket as any}
          open={isGiveDrawerOpen}
          onOpenChange={setIsGiveDrawerOpen}
          users={users as User[]}
          isGift={isGift}
          handleBuyEvent={() => {
            setIsOpen(true);
            setIsGiveDrawerOpen(false);
          }}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          isGiveOrTradeOpen={isGiveOrTradeOpen}
          setIsGiveOrTradeOpen={setIsGiveOrTradeOpen}
          cameFromGiveOrTrade={cameFromGiveOrTrade}
          setCameFromGiveOrTrade={setCameFromGiveOrTrade}
        />
      )}

      {isInviteDrawerOpen && (
        <InviteDrawer
          open={isInviteDrawerOpen}
          onOpenChange={setIsInviteDrawerOpen}
          users={users as User[]}
          friends={friends as any[]}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          getImageUrl={getImageUrl}
          handleBuyEvent={() => {
            navigate({
              to: "/createMeet",
              search: {
                step: 0,
                isExtra: true,
                isBasic: false,
                typeOfEvent: event?.category,
                idOfEvent: event?.id,
                event: event,
                selectedIds: selectedIds,
              },
            });
            setIsInviteDrawerOpen(false);
          }}
          user={user}
          participants={[]}
          setParticipants={() => {}}
        />
      )}

      {isGiveOrTradeOpen && (
        <GiveOrTradeDrawer
          open={isGiveOrTradeOpen}
          onOpenChange={setIsGiveOrTradeOpen}
          setIsGiveOrTradeOpen={setIsGiveOrTradeOpen}
          setIsGiveDrawerOpen={setIsGiveDrawerOpen}
          setCameFromGiveOrTrade={setCameFromGiveOrTrade}
          setIsTradeDrawerOpen={setIsTradeDrawerOpen}
        />
      )}

      {isTradeDrawerOpen && (
        <TradeDrawer
          open={isTradeDrawerOpen}
          onOpenChange={setIsTradeDrawerOpen}
          users={users as User[]}
          friends={friendUsers}
          cameFromGiveOrTrade={cameFromGiveOrTrade}
          setIsGiveOrTradeOpen={setIsGiveOrTradeOpen}
          setCameFromGiveOrTrade={setCameFromGiveOrTrade}
          event={{
            type: "event",
            eventId: Number(id),
            name: name,
            id: itemData?.id ?? 0,
          }}
        />
      )}
      {isSellDrawerOpen && user && (
        <SellDrawer
          open={isSellDrawerOpen}
          onOpenChange={setIsSellDrawerOpen}
          item={{
            type: "ticket",
            eventId: Number(id),
            name: name ?? "",
          }}
          eventTitle={name ?? ""}
          user={user}
        />
      )}
    </div>
  );
}

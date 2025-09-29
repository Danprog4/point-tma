import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { openTelegramLink } from "@telegram-apps/sdk";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import ActiveDrawer from "~/components/ActiveDrawer";
import GiveDrawer from "~/components/GiveDrawer";
import { useScroll } from "~/components/hooks/useScroll";
import { BlueTelegram } from "~/components/Icons/BlueTelegram";
import { Coin } from "~/components/Icons/Coin";
import { Star } from "~/components/Icons/Star";
import { WhitePlusIcon } from "~/components/Icons/WhitePlus";
import { More } from "~/components/More";
import QrDrawer from "~/components/QrDrawer";
import { BuyQuest } from "~/components/quest/BuyQuest";
import { QuestCard } from "~/components/QuestCard";
import { ReviewEventDrawer } from "~/components/ReviewEventDrawer";
import { User } from "~/db/schema";
import { useEventsCache } from "~/hooks/useEventsCache";
import { usePlatform } from "~/hooks/usePlatform";
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
  const { data: reviews } = useQuery(trpc.main.getReviews.queryOptions());
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const buyEvent = useMutation(trpc.event.buyEvent.mutationOptions());
  const [page, setPage] = useState("info");
  const { name, id } = Route.useParams();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isBought, setIsBought] = useState(false);
  const { data: cases } = useQuery(trpc.cases.getCases.queryOptions());
  const { data: keys } = useQuery(trpc.cases.getKeys.queryOptions());
  const [isGift, setIsGift] = useState(false);

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

  const ticket = user?.inventory?.find(
    (ticket) => ticket.eventId === Number(id) && ticket.name === name,
  );
  const ticketsForEvent =
    user?.inventory?.filter(
      (ticket) => ticket.eventId === Number(id) && ticket.name === name,
    ) ?? [];

  const hasActiveTicket = ticketsForEvent.some((t) => t.isActive);
  const hasInactiveTicket = ticketsForEvent.some((t) => !t.isActive);

  const isTicketAvailable = ticketsForEvent.length > 0;

  const showActivatedLabel = hasActiveTicket && !hasInactiveTicket;

  const isDisabled = (user?.balance ?? 0) < (event?.price ?? 0) * count;

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
        onSuccess: () => {
          queryClient.setQueryData(trpc.main.getUser.queryKey(), (old: any) => {
            if (!old) return old;
            return {
              ...old,
              inventory: [
                ...(old.inventory ?? []),
                {
                  type: "ticket",
                  eventId: Number(id),
                  name,
                  isActive: false,
                  id: Date.now(),
                },
              ],
            };
          });

          queryClient.invalidateQueries({ queryKey: trpc.main.getUser.queryKey() });

          setIsBought(true);
          if (isGift) {
            setIsGiveDrawerOpen(true);
            setIsOpen(false);
            return;
          }
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
      className="min-h-screen overflow-y-auto data-[mobile=true]:pt-39"
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
            <div className="fixed right-0 bottom-0 left-0 flex items-center gap-2 bg-white">
              {!isBought ? (
                <div className="mx-auto flex w-full items-center gap-2 px-4 py-4">
                  <button
                    onClick={handleBuyEvent}
                    className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
                    disabled={isDisabled}
                  >
                    <div>
                      {isDisabled
                        ? "Недостаточно средств"
                        : buyEvent.isPending
                          ? "Покупка..."
                          : `Купить за ${event?.price! * count}`}
                    </div>
                    <Coin />
                  </button>
                </div>
              ) : (
                <div className="mx-auto flex w-full flex-col items-center gap-2 px-4 py-4"></div>
              )}
            </div>
          </>
          <div className="fixed right-0 bottom-0 left-0 flex items-center gap-2 bg-white">
            {!isBought ? (
              <div className="mx-auto flex w-full items-center gap-2 px-4 py-4">
                <button
                  onClick={handleBuyEvent}
                  className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
                  disabled={isDisabled}
                >
                  <div>
                    {isDisabled
                      ? "Недостаточно средств"
                      : buyEvent.isPending
                        ? "Покупка..."
                        : `Купить за ${event?.price! * count}`}
                  </div>
                  <Coin />
                </button>
              </div>
            ) : (
              <div className="mx-auto flex w-full flex-col items-center gap-2 px-4 py-4">
                <button
                  onClick={() => {
                    navigate({ to: "/" });
                  }}
                  className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md px-6 py-3 font-medium text-black"
                >
                  <div>Вернуться на главную</div>
                </button>
                <button
                  onClick={() => {
                    navigate({ to: "/inventory" });
                  }}
                  className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md px-6 py-3 font-medium text-black"
                >
                  <div>В инвентарь</div>
                </button>
                <ActiveDrawer
                  id={Number(id)}
                  open={isActiveDrawerOpen}
                  onOpenChange={setIsActiveDrawerOpen}
                  name={name}
                >
                  {event?.category === "Квест" ? (
                    <button className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg">
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
        <div data-mobile={isMobile} className="pb-24">
          <div
            data-mobile={isMobile}
            className="fixed top-0 left-0 z-10 flex w-full items-center justify-center bg-white p-4 data-[mobile=true]:pt-28"
          >
            <div className="relative flex w-full max-w-md items-center justify-between">
              <button
                onClick={() => window.history.back()}
                className="flex h-6 w-6 items-center justify-center"
              >
                <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
              </button>
              <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-800">
                {event?.category}
              </h1>
              <div className="flex h-6 w-6" />
            </div>
          </div>
          <div className="relative">
            <img
              src={
                event?.image?.startsWith("https://") || event?.image?.startsWith("/")
                  ? event?.image
                  : getImageUrl(event?.image || "")
              }
              alt={event?.title ?? ""}
              className="h-[30vh] w-full rounded-t-xl object-cover"
            />
            <div className="absolute bottom-4 left-4 flex flex-col gap-2 text-white">
              <div className="text-2xl font-bold">{event?.title}</div>
              <div className="flex items-center justify-start gap-2">
                <div className="flex items-center justify-center rounded-full bg-black/25 px-2">
                  {event?.type}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-4 px-4 pt-4">
            <button
              className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
                page === "info" ? "bg-black text-white" : "bg-white text-black"
              }`}
              onClick={() => setPage("info")}
            >
              Информация
            </button>
            <button
              className={`flex-1 rounded-3xl px-4 py-2.5 text-sm font-medium ${
                page === "reviews" ? "bg-black text-white" : "bg-white text-black"
              }`}
              onClick={() => setPage("reviews")}
            >
              Отзывы
            </button>
          </div>
          {page === "info" ? (
            <>
              <div className="flex flex-col gap-2 px-4 py-4">
                <div className="text-2xl font-bold">Описание</div>
                <div>
                  {event?.description?.split(/\n{2,}/).map((paragraph, idx) => (
                    <p key={idx} className="mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 px-4 py-4">
                <div className="text-2xl font-bold">Локация</div>
                <div>{event?.location}</div>
              </div>
              <div className="flex flex-col gap-2 px-4 py-4">
                <div className="text-2xl font-bold">Организатор</div>
                <div className="text-l font-bold">{event?.organizer}</div>
              </div>
              {event?.stages && event?.stages?.length > 0 ? (
                <div className="flex flex-col gap-4 px-4 py-4">
                  <div className="text-2xl font-bold">Этапы квеста</div>
                  <div className="relative">
                    {event?.stages?.map((stage, idx) => (
                      <div key={idx} className="flex items-start gap-4 pb-4 last:pb-0">
                        <div className="relative flex w-8 flex-none items-start justify-center">
                          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 font-bold text-black">
                            {idx + 1}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-black">{stage.title}</div>
                          <div className="text-sm text-black/80">{stage.desc}</div>
                        </div>
                      </div>
                    ))}
                    <div className="absolute top-8 bottom-4 left-4 w-px -translate-x-1/2 bg-gray-300" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-4 py-4">
                  {event?.quests?.map((quest) => (
                    <>
                      <QuestCard key={quest.id} quest={quest as any} isNavigable={true} />
                      {event?.description?.slice(0, 100)}
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center justify-center rounded-full bg-[#DEB8FF] px-3 text-black">
                          + Достижение
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-base font-medium text-black">
                            +{pointRewards?.[0]?.value?.toLocaleString() || 0}
                          </span>
                          <span className="text-base font-medium text-black">points</span>
                          <Coin />
                        </div>
                      </div>
                    </>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2 px-4 py-4">
                <div className="text-2xl font-bold">Расписание</div>
                <div className="text-l font-bold">{event?.date}</div>
              </div>
              <div className="flex flex-col justify-center gap-2 px-4 py-4">
                <div className="flex flex-col items-start justify-start text-2xl font-bold">
                  <div className="flex items-center">
                    <div className="text-2xl font-bold">Награда </div>
                    <div className="text-l pl-2 font-bold">
                      +{pointRewards?.[0]?.value?.toLocaleString() || 0}
                    </div>
                    <Coin />
                  </div>
                </div>

                <div>За успешное выполнение квеста</div>

                {/* Case rewards */}
                {caseRewards && caseRewards.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {caseRewards.map((reward: any, index: number) => (
                      <div
                        key={index}
                        className="flex h-28 w-28 flex-col items-center justify-center rounded-lg bg-blue-200 px-4"
                      >
                        <img
                          src={cases?.find((c) => c.id === reward.eventId)?.photo || ""}
                          alt="case"
                          className="h-10 w-10"
                        />
                        <span className="mt-1 text-center text-sm">
                          {cases?.find((c) => c.id === reward.eventId)?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Key rewards */}
                {keyRewards && keyRewards.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {keyRewards.map((reward: any, index: number) => (
                      <div
                        key={index}
                        className="flex h-28 w-28 flex-col items-center justify-center rounded-lg bg-yellow-200 px-4"
                      >
                        <img
                          src={cases?.find((c) => c.id === reward.caseId)?.photo || ""}
                          alt="key"
                          className="h-10 w-10"
                        />
                        <span className="mt-1 text-center text-sm">
                          Ключ от {cases?.find((c) => c.id === reward.caseId)?.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-lg bg-blue-200 px-4">
                    <img src="/shit.png" alt="coin" className="h-10 w-10" />
                    <span className="mt-1 text-center text-sm">Кепка BUCS</span>
                  </div>
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-lg bg-red-200 px-4">
                    <img src="/cap.png" alt="coin" className="h-10 w-10" />
                    <span className="mt-1 text-center text-sm">Любитель к...</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 px-4 py-4">
                <div className="text-2xl font-bold">Достижение</div>
                <div>+1 Активный участник</div>
              </div>
            </>
          ) : (
            <div className="flex flex-col">
              {filteredReviews?.map((review) => {
                const user = users?.find((user) => user.id === review.userId);
                return (
                  <div key={review.id} className="flex flex-col gap-2 px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                        <div className="flex flex-col">
                          <div className="text-lg font-bold">
                            {user?.name} {user?.surname}
                          </div>
                          <div className="text-sm text-gray-500">участник</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-lg font-bold">{review.rating}</div>
                        <Star />
                      </div>
                    </div>
                    <div>{review.review}</div>
                    <div className="h-0.5 w-full bg-gray-200"></div>
                  </div>
                );
              })}
            </div>
          )}

          {!isTicketAvailable ||
          (hasActiveTicket && !hasInactiveTicket && isCompleted) ? (
            <div className="fixed right-0 bottom-0 left-0 flex items-center gap-2 bg-white">
              <div className="mx-auto flex w-full items-center gap-2 px-4 py-4">
                <button
                  onClick={() => setIsOpen(true)}
                  className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
                >
                  <div>Купить за {event?.price}</div>
                  <Coin />
                </button>
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600"
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                  >
                    <WhitePlusIcon />
                  </div>
                  <span className="text-xs">Ещё</span>
                </div>
              </div>
            </div>
          ) : hasInactiveTicket ? (
            <div className="fixed right-0 bottom-0 left-0 flex items-center gap-2 bg-white">
              {event?.category === "Квест" ? (
                <div className="mx-auto flex w-full items-center gap-2 px-4 py-4">
                  <button
                    onClick={() => setIsGiveDrawerOpen(true)}
                    className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-red-300 px-6 py-3 font-medium text-white shadow-lg"
                  >
                    <div>Подарить</div>
                  </button>

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
                    <button className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg">
                      <div>Активировать</div>
                    </button>
                  </ActiveDrawer>
                </div>
              ) : (
                <div className="flex w-full items-center gap-2 px-4 py-4">
                  <button
                    onClick={() => setIsGiveDrawerOpen(true)}
                    className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-[#DEB8FF] px-6 py-3 font-medium text-white shadow-lg"
                  >
                    <div>Подарить</div>
                  </button>
                  <QrDrawer open={isQrOpen} onOpenChange={setIsQrOpen}>
                    <button className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg">
                      <div>QR CODE</div>
                    </button>
                  </QrDrawer>
                </div>
              )}
            </div>
          ) : (
            <div className="fixed right-0 bottom-0 left-0 flex items-center gap-2 bg-white">
              <div className="mx-auto flex w-full items-center gap-2 px-4 py-4">
                <button
                  onClick={handleEndQuest}
                  className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
                >
                  <div>{isCompleted ? "Вернуться на главную" : "Завершить этап"}</div>
                </button>
                <div
                  className="flex flex-col items-center justify-center"
                  onClick={() => {
                    openTelegramLink("https://t.me/joinchat/uyQGDiDmRsc0YTcy");
                  }}
                >
                  <BlueTelegram />
                  <div className="text-[#2462FF]">Чат</div>
                </div>
              </div>
            </div>
          )}
          {isMoreOpen && (
            <More
              setIsMoreOpen={setIsMoreOpen}
              handleSaveEventOrMeet={handleSaveEventOrMeet}
              handleGiveTicket={() => {
                setIsGift(true);
                setIsOpen(true);
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
        />
      )}
    </div>
  );
}

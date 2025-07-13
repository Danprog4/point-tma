import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { openTelegramLink } from "@telegram-apps/sdk";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import ActiveDrawer from "~/components/ActiveDrawer";
import { useScroll } from "~/components/hooks/useScroll";
import { BlueTelegram } from "~/components/Icons/BlueTelegram";
import { Coin } from "~/components/Icons/Coin";
import { Star } from "~/components/Icons/Star";
import { WhitePlusIcon } from "~/components/Icons/WhitePlus";
import { More } from "~/components/More";
import { BuyQuest } from "~/components/quest/BuyQuest";
import { QuestCard } from "~/components/QuestCard";
import { useActivate } from "~/hooks/useActivate";
import { getEventData } from "~/lib/utils/getEventData";
import { useTRPC } from "~/trpc/init/react";
import { Quest } from "~/types/quest";

export const Route = createFileRoute("/event/$name/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  useScroll();
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isActiveDrawerOpen, setIsActiveDrawerOpen] = useState(false);
  // const [isActivated, setIsActivated] = useState(false); // Not used, remove
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const buyEvent = useMutation(trpc.event.buyEvent.mutationOptions());
  const [page, setPage] = useState("info");
  const { name, id } = Route.useParams();
  const [isBought, setIsBought] = useState(false);
  const [count, setCount] = useState(1);
  const { useActivateEvent } = useActivate();
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const event = getEventData(name, Number(id));

  console.log(event);

  const ticket = user?.inventory?.find(
    (ticket) => ticket.eventId === Number(id) && ticket.name === name,
  );
  const isActive = queryClient
    .getQueryData(trpc.main.getUser.queryKey())
    ?.inventory?.find(
      (ticket) => ticket.eventId === Number(id) && ticket.name === name,
    )?.isActive;
  const isTicketAvailable = !!ticket;

  if (!event) {
    return <div>Событие не найдено</div>;
  }

  // Remove console logs for production
  // console.log(questsData);
  // console.log(Number(id));
  // console.log(questData);

  const isDisabled = (user?.balance ?? 0) < event.price * count;

  const handleBuyEvent = () => {
    if (isDisabled) {
      return;
    }

    buyEvent.mutate(
      {
        id: Number(id),
        name,
      },
      {
        onSuccess: () => {
          setIsBought(true);
        },
      },
    );
  };

  // Not used, but if needed, can be uncommented and fixed
  // const handleActivateQuest = () => {
  //   if (!isActivated) {
  //     useActivateQuest(Number(id));
  //   } else {
  //     navigate({ to: "/quests" });
  //   }
  // };

  return (
    <>
      {isOpen ? (
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
                        : `Купить за ${event.price * count}`}
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
                  <button className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg">
                    {isActive ? "Билет активирован" : "Активировать билет"}
                  </button>
                </ActiveDrawer>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="overflow-y-auto pt-18 pb-24">
          <div className="fixed top-0 left-0 z-10 flex w-full items-center justify-center bg-white">
            <div className="relative flex w-full max-w-md items-center justify-between px-4 py-3">
              <button
                onClick={() => window.history.back()}
                className="flex h-6 w-6 items-center justify-center"
              >
                <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
              </button>
              <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-800">
                {event.category}
              </h1>
              <div className="flex h-6 w-6" />
            </div>
          </div>
          <div className="relative">
            <img
              src={event.image}
              alt={event.title}
              className="h-[30vh] w-full rounded-t-xl object-cover"
            />
            <div className="absolute bottom-4 left-4 flex flex-col gap-2 text-white">
              <div className="text-2xl font-bold">{event.title}</div>
              <div className="flex items-center justify-start gap-2">
                <div className="flex items-center justify-center rounded-full bg-black/25 px-2">
                  {event.type}
                </div>
                <div className="flex items-center justify-center rounded-full bg-[#2462FF] px-2">
                  {event.category}
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
                  {event.description.split(/\n{2,}/).map((paragraph, idx) => (
                    <p key={idx} className="mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2 px-4 py-4">
                <div className="text-2xl font-bold">Локация</div>
                <div>{event.location}</div>
              </div>
              <div className="flex flex-col gap-2 px-4 py-4">
                <div className="text-2xl font-bold">Организатор</div>
                <div className="text-l font-bold">{event.organizer}</div>
              </div>
              {event.stages && event.stages.length > 0 ? (
                <div className="flex flex-col gap-4 px-4 py-4">
                  <div className="text-2xl font-bold">Этапы квеста</div>
                  <div className="relative">
                    {event.stages.map((stage, idx) => (
                      <div key={idx} className="flex items-start gap-4 pb-4 last:pb-0">
                        <div className="relative flex w-8 flex-none items-start justify-center">
                          <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 font-bold text-black">
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
                  {event.quests?.map((quest) => (
                    <>
                      <QuestCard key={quest.id} quest={quest as any} isNavigable={true} />
                      {event?.description.slice(0, 100)}
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center justify-center rounded-full bg-[#DEB8FF] px-3 text-black">
                          + Достижение
                        </div>
                        <div className="flex items-center gap-1">
                          + {event?.reward} points <Coin />
                        </div>
                      </div>
                    </>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2 px-4 py-4">
                <div className="text-2xl font-bold">Расписание</div>
                <div className="text-l font-bold">{event.date}</div>
              </div>
              <div className="flex flex-col justify-center gap-2 px-4 py-4">
                <div className="flex items-center justify-start text-2xl font-bold">
                  <div className="text-2xl font-bold">Награда </div>
                  <div className="text-l pl-2 font-bold">+ {event.reward}</div>
                  <Coin />
                </div>

                <div>За успешное выполнение квеста</div>
                <div className="flex gap-2">
                  <div className="flex h-25 w-25 flex-col items-center justify-center rounded-lg bg-blue-200">
                    <img src="/shit.png" alt="coin" className="h-10 w-10" />
                    <span className="mt-1 text-sm">Кепка BUCS</span>
                  </div>
                  <div className="flex h-25 w-25 flex-col items-center justify-center rounded-lg bg-red-200">
                    <img src="/cap.png" alt="coin" className="h-10 w-10" />
                    <span className="mt-1 text-sm">Любитель к...</span>
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
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                      <div className="flex flex-col">
                        <div className="text-lg font-bold">Сергей</div>
                        <div className="text-sm text-gray-500">участник</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="text-lg font-bold">5</div>
                      <Star />
                    </div>
                  </div>
                  <div>Отличный квест, мне всё понравилось. Было интересно</div>
                  <div className="h-0.5 w-full bg-gray-200"></div>
                </div>
              ))}
            </div>
          )}

          {!isTicketAvailable ? (
            <div className="fixed right-0 bottom-0 left-0 flex items-center gap-2 bg-white">
              <div className="mx-auto flex w-full items-center gap-2 px-4 py-4">
                <button
                  onClick={() => setIsOpen(true)}
                  className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
                >
                  <div>Купить за {event.price}</div>
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
          ) : isActive === false ? (
            <div className="fixed right-0 bottom-0 left-0 flex items-center gap-2 bg-white">
              <div className="mx-auto flex w-full items-center gap-2 px-4 py-4">
                <ActiveDrawer
                  id={Number(id)}
                  name={name}
                  open={isActiveDrawerOpen}
                  onOpenChange={setIsActiveDrawerOpen}
                >
                  <button className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg">
                    <div>Активировать</div>
                  </button>
                </ActiveDrawer>
              </div>
            </div>
          ) : (
            <div className="fixed right-0 bottom-0 left-0 flex items-center gap-2 bg-white">
              <div className="mx-auto flex w-full items-center gap-2 px-4 py-4">
                <button
                  onClick={() => {
                    navigate({ to: "/" });
                  }}
                  className="flex w-full items-center justify-center gap-1 rounded-tl-2xl rounded-tr-md rounded-br-2xl rounded-bl-md bg-purple-600 px-6 py-3 font-medium text-white shadow-lg"
                >
                  <div>Завершить этап</div>
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
          {isMoreOpen && <More setIsMoreOpen={setIsMoreOpen} />}
        </div>
      )}
    </>
  );
}

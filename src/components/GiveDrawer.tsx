import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Drawer } from "vaul";
import { User } from "~/db/schema";
import { getImage } from "~/lib/utils/getImage";
import { useTRPC } from "~/trpc/init/react";
import { Friends } from "./Friends";

export default function GiveDrawer({
  open,
  onOpenChange,
  item,
  users,
  isGift,
  handleBuyEvent,
  setSelectedUser,
  selectedUser,
  isGiveOrTradeOpen,
  setIsGiveOrTradeOpen,
  cameFromGiveOrTrade,
  setCameFromGiveOrTrade,
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

  users: User[];
  isGift: boolean;
  handleBuyEvent: () => void;
  setSelectedUser: (user: User) => void;
  selectedUser: User | null;
  isGiveOrTradeOpen?: boolean;
  setIsGiveOrTradeOpen?: (open: boolean) => void;
  cameFromGiveOrTrade?: boolean;
  setCameFromGiveOrTrade?: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isSent, setIsSent] = useState(false);
  const trpc = useTRPC();
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

  const sendGift = useMutation(
    trpc.main.sendGift.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.main.getUser.queryKey() });
        setIsSent(true);
      },
      onError: () => {
        queryClient.invalidateQueries({ queryKey: trpc.main.getUser.queryKey() });
      },
    }),
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsSent(false);
      if (cameFromGiveOrTrade) {
        setIsGiveOrTradeOpen?.(true);
        setCameFromGiveOrTrade?.(false);
      }
    }
    onOpenChange(nextOpen);
  };

  const handleSendGift = () => {
    if (selectedUser && item) {
      // Оптимистично обновляем кэш - удаляем только конкретный билет
      // queryClient.setQueryData<User>(trpc.main.getUser.queryKey(), (old) => {
      //   if (!old) return old;
      //   return {
      //     ...old,
      //     inventory:
      //       old.inventory?.filter(Boolean).filter((i) => i.id !== item?.id) ?? [],
      //   };
      // });

      sendGift.mutate({ userId: selectedUser.id, item: item as any });
      setIsSent(true);
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={handleOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[80%] flex-col rounded-t-[16px] bg-white py-4">
          <header className="flex items-center justify-between px-4 pb-4">
            <ArrowLeft className="h-6 w-6 text-transparent" />
            <div className="font-bold">Сделать подарок</div>
            <button className="z-[100]" onClick={() => handleOpenChange(false)}>
              <X className="h-6 w-6 text-gray-900" />
            </button>
          </header>
          {!selectedUser && (
            <>
              {!isGift && (
                <div className="mx-4 flex items-center rounded-lg bg-[#FCF8FE] px-4 py-2">
                  <div className="flex items-center justify-center gap-2">
                    <img
                      src={event?.image ?? ""}
                      alt={event?.title ?? ""}
                      className="h-10 w-10 rounded-lg"
                    />
                    <div>{item?.name === "Квест" ? "Билет на квест" : "Ваучер"}</div>
                  </div>
                </div>
              )}
              <div className="px-4 pt-4 pb-4 text-xl font-bold text-nowrap">
                Выберите кому подарить подарок
              </div>
              <Friends
                isDrawer={true}
                setSelectedUser={setSelectedUser}
                handleBuyEvent={handleBuyEvent}
                isGift={isGift}
              />
            </>
          )}
          {selectedUser && !isSent && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="pb-10 text-2xl font-bold">Подтвердите вручение подарка</div>
              <div className="flex items-center justify-center gap-8">
                <div className="flex -rotate-4 transform flex-col items-center justify-center">
                  <img
                    src={event?.image ?? ""}
                    alt=""
                    className="h-[132px] w-[132px] rounded-lg"
                  />
                  <div>{item?.name === "Квест" ? "Билет на квест" : "Ваучер"}</div>
                </div>
                <div className="flex rotate-4 transform flex-col items-center justify-center">
                  <img
                    src={getImage(selectedUser!, "")}
                    alt=""
                    className="h-[132px] w-[132px] rounded-lg"
                  />
                  <div>
                    {selectedUser?.name} {selectedUser?.surname}
                  </div>
                </div>
              </div>
              <div
                onClick={handleSendGift}
                className="mt-10 rounded-tl-2xl rounded-tr-lg rounded-br-2xl rounded-bl-lg bg-[#9924FF] px-4 py-3 text-white"
              >
                Подарить подарок
              </div>
            </div>
          )}
          {isSent && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="pb-10 text-2xl font-bold text-[#00A349]">
                Подарок вручен
              </div>

              <div className="flex flex-col items-center justify-center">
                <img
                  src={getImage(selectedUser!, "")}
                  alt=""
                  className="h-[132px] w-[132px] rounded-lg"
                />
                <div>
                  {selectedUser?.name} {selectedUser?.surname}
                </div>
              </div>

              <div
                onClick={() => navigate({ to: "/inventory" })}
                className="mt-10 text-lg font-bold text-black"
              >
                Вернуться в инвентарь
              </div>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

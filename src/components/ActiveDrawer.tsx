import { useMutation } from "@tanstack/react-query";
import { openTelegramLink } from "@telegram-apps/sdk";
import { X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
import { useTRPC } from "~/trpc/init/react";
import { Telegram } from "./Icons/Telegram";
export default function ActiveDrawer({
  open,
  onOpenChange,
  children,
  id,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  id: number;
}) {
  const [isActive, setIsActive] = useState(false);
  const trpc = useTRPC();
  const activateQuest = useMutation(trpc.quest.activateQuest.mutationOptions());

  const handleActivateTicket = () => {
    console.log("activateQuest", id);
    activateQuest.mutate({
      questId: id,
    });
    setIsActive(true);
  };

  const handleOpenLink = () => {
    openTelegramLink("https://t.me/joinchat/uyQGDiDmRsc0YTcy");
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[fit] flex-col rounded-t-[16px] bg-white px-4 py-4 pb-20">
          {!isActive ? (
            <>
              <header className="flex items-center justify-end pb-4">
                <button onClick={() => onOpenChange(false)}>
                  <X className="h-6 w-6 text-gray-900" />
                </button>
              </header>
              <div className="flex h-full flex-col items-center justify-center pb-12 text-center">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-xl font-bold">Активировать билет?</div>
                  <div className="text-lg">
                    Активируя билет, вы подтверждаете своё участие
                  </div>
                </div>
              </div>
              <div className="absolute right-4 bottom-4 left-4 mx-auto mt-4 flex w-auto items-center justify-center rounded-lg px-4 py-3 text-center font-semibold text-white">
                <div
                  onClick={() => handleActivateTicket()}
                  className="z-[1000] flex-1 rounded-tl-2xl rounded-br-2xl bg-[#9924FF] px-4 py-3 text-white"
                >
                  Да, активировать
                </div>
                <div
                  onClick={() => onOpenChange(false)}
                  className="z-[1000] flex-1 px-4 py-4 text-black"
                >
                  Отменить
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <div className="text-xl font-bold text-[#00A349]">Билет активирован!</div>
              <div className="text-center text-lg">
                Вам предоставлена ссылка на телеграмм-чат квеста и там будет вся
                информация по квесту
              </div>
              <div
                className="absolute right-4 bottom-4 left-4 mx-auto mt-4 flex w-auto items-center justify-center gap-2 rounded-lg px-4 py-3 text-center font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(211.74deg, #34B0DF -4.14%, #1E88D3 90.25%)",
                }}
                onClick={handleOpenLink}
              >
                <div> Перейти в чат</div>
                <Telegram />
              </div>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

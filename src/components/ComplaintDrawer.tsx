import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
import { useTRPC } from "~/trpc/init/react";
interface ComplaintDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  meetId?: number;
}

export function ComplaintDrawer({
  open,
  onOpenChange,

  meetId,
}: ComplaintDrawerProps) {
  const trpc = useTRPC();
  const sendComplaint = useMutation(trpc.main.sendComplaint.mutationOptions());
  const [complaint, setComplaint] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSendComplaint = () => {
    sendComplaint.mutate({
      complaint,
      meetId: meetId ? Number(meetId) : undefined,
    });
    setIsSubmitted(true);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-fit min-h-[50vh] flex-col rounded-t-[16px] bg-white">
          <div className="flex items-center justify-center p-4">
            <button onClick={() => onOpenChange(false)}>
              <X className="absolute inset-0 m-4 mt-4.5 flex h-6 w-6 items-center text-gray-900" />
            </button>
            <div className="text-xl font-bold">Пожаловаться на ивент</div>
          </div>

          {isSubmitted ? (
            <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center p-4">
              <div className="text-center text-2xl">Спасибо за ваш отклик</div>
              <div className="px-4 py-2 text-center text-sm text-gray-500">
                Мы обязательно разберёмся в проблеме и не будем показывать вам эту встречу
              </div>
              <div className="absolute right-0 bottom-2 left-0 mx-auto mt-4 flex w-full items-center justify-center rounded-lg px-4 py-3 text-center font-semibold text-white">
                <button
                  onClick={() => onOpenChange(false)}
                  disabled={complaint.length === 0}
                  className="z-[1000] w-full rounded-tl-2xl rounded-br-2xl px-4 py-3 text-[#9924FF] disabled:opacity-50"
                >
                  Закрыть
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex h-full w-full flex-col items-start justify-center p-4 pt-10">
                <div className="text-start font-bold">
                  Опишите что не так с этой встречей
                </div>
                <div className="w-full">
                  <textarea
                    onChange={(e) => setComplaint(e.target.value)}
                    className="my-2 w-full rounded-lg border-2 border-gray-300 p-2 pt-4 pb-10"
                    placeholder="Оставьте свой отзыв"
                  />
                </div>
                <div className="absolute right-0 bottom-2 left-0 mx-auto mt-4 flex w-full items-center justify-center rounded-lg px-4 py-3 text-center font-semibold text-white">
                  <button
                    onClick={handleSendComplaint}
                    disabled={complaint.length === 0}
                    className="z-[1000] w-full rounded-tl-2xl rounded-br-2xl bg-[#9924FF] px-4 py-3 text-white disabled:opacity-50"
                  >
                    Пожаловаться
                  </button>
                </div>
              </div>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

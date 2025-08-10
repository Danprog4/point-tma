import { X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
interface ComplaintDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetId?: number;
  userId?: number;
  complaint: string;
  setComplaint: (complaint: string) => void;
  handleSendComplaint: () => void;
  type: "event" | "user";
  isComplained?: boolean;
}

export function ComplaintDrawer({
  open,
  onOpenChange,
  meetId,
  userId,
  complaint,
  setComplaint,
  handleSendComplaint,
  type,
  isComplained,
}: ComplaintDrawerProps) {
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-fit min-h-[50vh] flex-col rounded-t-[16px] bg-white">
          <div className="relative flex items-center justify-center p-4">
            <div className="text-center text-sm font-bold">
              {isComplained
                ? "Вы уже жаловались на этого пользователя"
                : type === "event"
                  ? "Пожаловаться на ивент"
                  : "Пожаловаться на пользователя"}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 flex h-6 w-6 items-center justify-center"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {isSubmitted ? (
            <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center p-4">
              <div className="text-center text-2xl">Спасибо за ваш отклик</div>
              <div className="px-4 py-2 text-center text-sm text-gray-500">
                Мы обязательно разберёмся в проблеме и не будем показывать вам{" "}
                {type === "event" ? "эту встречу" : "этого пользователя"}
              </div>
              <div className="absolute right-0 bottom-2 left-0 mx-auto mt-4 flex w-full items-center justify-center rounded-lg px-4 py-3 text-center font-semibold text-white">
                <button
                  onClick={() => onOpenChange(false)}
                  className="z-[10000] w-full rounded-tl-2xl rounded-br-2xl px-4 py-3 text-[#9924FF] disabled:opacity-50"
                >
                  Закрыть
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex h-full w-full flex-col items-start justify-center p-4 pt-10">
                <div className="text-start font-bold">
                  {type === "event"
                    ? "Опишите что не так с этой встречей"
                    : "Опишите что не так с этим пользователем"}
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
                    onClick={() => {
                      handleSendComplaint();
                      setIsSubmitted(true);
                      setComplaint("");
                    }}
                    disabled={complaint.length === 0 || isComplained || isSubmitted}
                    className="z-[10000] w-full rounded-tl-2xl rounded-br-2xl bg-[#9924FF] px-4 py-3 text-white disabled:opacity-50"
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

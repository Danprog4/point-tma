import { ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";

export default function EndMeetDrawer({
  open,
  onOpenChange,
  meetId,
  handleEndMeeting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetId: number;
  handleEndMeeting: () => void;
}) {
  const [isMeetEnded, setIsMeetEnded] = useState(false);
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[35vh] flex-col rounded-t-[16px] bg-white px-4 py-4">
          <header className="flex items-center justify-between pb-4">
            <ArrowLeft className="h-6 w-6 text-transparent" />
            <div className="text-xl font-bold">Приглашения</div>
            <button onClick={() => onOpenChange(false)}>
              <X className="h-6 w-6 text-gray-900" />
            </button>
          </header>
          {isMeetEnded ? (
            <div>
              <div className="pt-8 text-center text-2xl">Встреча завершена!</div>
              <div className="px-4 text-center text-neutral-500">
                Не забудьте попросить друзей оставить отзыв ее.
              </div>
              <button
                className="absolute right-0 bottom-0 left-0 flex flex-1 items-center justify-center bg-white px-4 py-4 font-semibold text-[#9924FF]"
                onClick={() => onOpenChange(false)}
              >
                Закрыть
              </button>
            </div>
          ) : (
            <div className="">
              <div className="flex items-center justify-center px-4 py-8 text-center text-neutral-500">
                После завершения встречи участники получат уведомление с просьбой оценить
                ее.
              </div>
              <div className="absolute right-0 bottom-0 left-0 flex items-center bg-white px-4 py-4">
                <button
                  className="flex-1 rounded-tl-2xl rounded-br-2xl bg-[#9924FF] px-8 py-3 font-semibold text-white"
                  onClick={() => {
                    handleEndMeeting();
                    setIsMeetEnded(true);
                  }}
                >
                  Завершить
                </button>
                <button
                  className="flex-1 px-8 py-3 font-semibold text-[#9924FF]"
                  onClick={() => onOpenChange(false)}
                >
                  Отменить
                </button>
              </div>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

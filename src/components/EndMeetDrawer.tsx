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
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[30vh] flex-col rounded-t-[16px] bg-white px-4 py-4">
          <header className="flex items-center justify-between pb-4">
            <ArrowLeft className="h-6 w-6 text-transparent" />
            <div className="text-xl font-bold">Завершить встречу?</div>
            <button
              onClick={() => {
                onOpenChange(false);
              }}
            >
              <X className="z-[10000] h-6 w-6 text-gray-900" />
            </button>
          </header>
          {isMeetEnded ? (
            <div>
              <div>Встреча завершена</div>
              <div>
                После завершения встречи участники получат уведомление с просьбой оценить
                ее.
              </div>
            </div>
          ) : (
            <div>
              <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center px-4 text-start text-neutral-500">
                После завершения встречи участники получат уведомление с просьбой оценить
                ее.
              </div>
              <div
                className="fixed right-4 bottom-0 left-4 mx-auto mt-4 flex w-auto items-center justify-center bg-white py-4 text-center font-semibold text-white"
                onClick={() => {
                  handleEndMeeting();
                  setIsMeetEnded(true);
                }}
              >
                <div className="z-[1000] rounded-tl-2xl rounded-br-2xl bg-[#9924FF] px-8 py-3 text-white">
                  Завершить
                </div>
                <div
                  className="z-[1000] flex-1 px-8 py-3 text-[#9924FF]"
                  onClick={() => onOpenChange(false)}
                >
                  Отменить
                </div>
              </div>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

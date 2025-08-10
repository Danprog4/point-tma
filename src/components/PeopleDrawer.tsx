import { Bookmark, EyeOff, X } from "lucide-react";
import { Drawer } from "vaul";
import { ComplaintIcon } from "~/components/Icons/Complaint";
import { ShareIcon } from "~/components/Icons/Share";

export default function PeopleDrawer({
  open,
  onOpenChange,
  userId,
  onHide,
  onComplain,
  onSave,

  onShare,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  onHide: (userId: number) => void;
  onComplain: (userId: number) => void;
  onSave: (userId: number) => void;
  onShare: (userId: number) => void;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-fit flex-col rounded-t-[16px] bg-white px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="h-1 w-20 rounded bg-[#D9D9D9]" />
          </div>
          <button
            className="absolute top-4 right-4 z-[100]"
            onClick={() => onOpenChange(false)}
            aria-label="Закрыть"
          >
            <X className="h-6 w-6 text-gray-900" />
          </button>
          <div className="relative mt-1">
            <div className="flex flex-col">
              <button
                className="flex w-full items-center gap-3 px-4 py-5"
                onClick={() => onHide(userId)}
              >
                <EyeOff className="h-6 w-6 text-[#721DBD]" />
                <span className="text-base font-medium">Не интересует</span>
              </button>

              <button
                className="flex w-full items-center gap-3 px-4 py-5"
                onClick={() => onComplain(userId)}
              >
                <ComplaintIcon />
                <span className="text-base font-medium">Пожаловаться</span>
              </button>

              <button
                className="flex w-full items-center gap-3 px-4 py-5"
                onClick={() => onSave(userId)}
              >
                <Bookmark className="h-6 w-6 text-[#721DBD]" />
                <span className="text-base font-medium">Сохранить</span>
              </button>

              <button
                className="flex w-full items-center gap-3 px-4 py-5"
                onClick={() => onShare(userId)}
              >
                <ShareIcon />
                <span className="text-base font-medium">Поделиться</span>
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

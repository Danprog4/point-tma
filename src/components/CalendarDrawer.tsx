import { ArrowLeft, X } from "lucide-react";
import { Drawer } from "vaul";

export default function CalendarDrawer({
  open,
  onOpenChange,
  children,
  date,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  date: string;
}) {
  const formatedDate = new Date(date);
  const day = formatedDate.getDate();
  const month = formatedDate.getMonth() + 1;
  const year = formatedDate.getFullYear();

  const formattedDate = `${day}.${month}.${year}`;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[80%] flex-col rounded-t-[16px] bg-white px-4 py-4">
          <header className="flex items-center justify-between pb-4">
            <ArrowLeft className="h-6 w-6 text-transparent" />
            <div className="text-xl font-bold">События на {formattedDate}</div>
            <button onClick={() => onOpenChange(false)}>
              <X className="h-6 w-6 text-gray-900" />
            </button>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="text-center text-gray-500">
              У вас нет событий на это число
            </div>
            <div className="flex gap-4">
              <button className="font-medium text-purple-600">Найти события</button>
              <button className="rounded-lg bg-purple-600 px-6 py-2 font-medium text-white">
                Создать встречу
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

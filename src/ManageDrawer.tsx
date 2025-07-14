import { ArrowLeft, X } from "lucide-react";
import { Drawer } from "vaul";

export default function ManageDrawer({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-fit flex-col rounded-t-[16px] bg-white px-4 py-4">
          <header className="flex items-center justify-between pb-4">
            <ArrowLeft className="h-6 w-6 text-transparent" />
            <div className="text-xl font-bold">Управление</div>
            <button onClick={() => onOpenChange(false)}>
              <X className="h-6 w-6 text-gray-900" />
            </button>
          </header>
          <div className="flex flex-col items-start justify-center gap-4">
            <div className="flex items-center justify-between">Редактировать встречу</div>
            <div className="flex items-center justify-between">Удалить встречу</div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

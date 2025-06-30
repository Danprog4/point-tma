import { X } from "lucide-react";
import { Drawer } from "vaul";
export default function FilterDrawer({
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
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[576px] flex-col rounded-t-[16px] bg-white px-4 py-4">
          <header>
            <div className="flex justify-center text-xl font-bold">Фильтр</div>
            <div className="absolute top-4 right-4">
              <button onClick={() => onOpenChange(false)}>
                <X className="h-6 w-6 text-gray-900" />
              </button>
            </div>
          </header>
          {/* add  nested drawer*/}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

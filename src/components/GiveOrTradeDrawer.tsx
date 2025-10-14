import { Gift, Repeat2, X } from "lucide-react";
import { Drawer } from "vaul";

export default function GiveOrTradeDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1.5px]" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-16 flex h-fit flex-col rounded-t-3xl bg-gradient-to-t from-white to-[#f3e9fc] px-6 py-7 shadow-2xl">
          <header className="flex items-center justify-between pb-4">
            <div className="mx-auto text-lg font-extrabold text-purple-700">
              Подарить / Обменять
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-6 right-6 rounded-full p-1 transition hover:bg-gray-100"
              aria-label="Закрыть"
            >
              <X className="h-7 w-7 text-gray-900" />
            </button>
          </header>
          <div className="mt-2 mb-2 text-center text-base">
            Приятно делиться хорошим настроением! <br />
            Выберите, что хотите сделать со своим билетом на событие:
          </div>
          <div className="mt-4 flex flex-col gap-5">
            <button
              className="flex w-full items-center gap-3 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-100/60 to-transparent px-6 py-4 shadow transition hover:scale-[1.01] active:bg-purple-50"
              disabled
            >
              <Gift className="h-6 w-6 text-purple-500" />
              <div className="flex flex-col items-start">
                <span className="text-base font-semibold text-purple-700">
                  Подарить другу
                </span>
                <span className="mt-1 text-left text-xs text-gray-500">
                  Передайте билет другому участнику и сделайте его день ярче!
                </span>
              </div>
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-2xl border border-yellow-200 bg-gradient-to-r from-yellow-100/30 to-transparent px-6 py-4 shadow transition hover:scale-[1.01] active:bg-yellow-50"
              disabled
            >
              <Repeat2 className="h-6 w-6 text-yellow-600" />
              <div className="flex flex-col items-start">
                <span className="text-base font-semibold text-yellow-700">
                  Обменять билет
                </span>
                <span className="mt-1 text-left text-xs text-gray-500">
                  Обменяйтесь билетом с другим участником, чтобы получить новые
                  впечатления!
                </span>
              </div>
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

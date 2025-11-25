import { ArrowLeft, Gift, Key, ShoppingBag, X } from "lucide-react";
import { Drawer } from "vaul";

type KeyData = {
  id: number;
  type: string;
  caseId?: number;
  eventId?: number;
  name?: string;
  isActive: boolean;
};

type CaseData = {
  id: number;
  name: string | null;
  photo?: string | null;
  description?: string | null;
};

export default function KeyDrawer({
  open,
  onOpenChange,
  children,
  keyData,
  caseData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  keyData: KeyData;
  caseData?: CaseData;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-fit flex-col rounded-t-[16px] bg-white px-4 py-6">
          <header className="flex items-center justify-between pb-6">
            <ArrowLeft className="h-6 w-6 text-transparent" />
            <div className="text-xl font-bold">Ключ получен!</div>
            <button onClick={() => onOpenChange(false)}>
              <X className="h-6 w-6 text-gray-900" />
            </button>
          </header>

          <div className="flex flex-col items-center space-y-6 text-center">
            {/* Фото кейса с иконкой ключа */}
            <div className="relative">
              <div className="h-24 w-24 overflow-hidden rounded-2xl bg-gray-100">
                {caseData?.photo ? (
                  <img
                    src={caseData.photo}
                    alt={caseData.name || "Кейс"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600">
                    <Key className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>
              <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                <Gift className="h-3 w-3 text-white" />
              </div>
            </div>

            {/* Текст */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Ключ для кейса</h2>
              <p className="text-lg font-semibold text-[#9924FF]">
                "{caseData?.name || "Неизвестный кейс"}"
              </p>
              <p className="text-sm text-gray-600">
                Воспользуйтесь им, чтобы открыть кейс и получить награды
              </p>
            </div>

            {/* Кнопка в магазин */}
            <button
              onClick={() => {
                // TODO: Переход в магазин
              }}
              className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-[#9924FF] to-[#7C1ED9] px-6 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:from-[#7C1ED9] hover:to-[#5A1A9E] hover:shadow-xl"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Перейти в магазин</span>
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

import { ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
import { Check } from "./Icons/Check";
export default function FilterDrawer({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [isNested, setIsNested] = useState(false);
  const [isNested2, setIsNested2] = useState(false);
  const [isNested3, setIsNested3] = useState(false);
  const [type, setType] = useState("Все");
  const [theme, setTheme] = useState("Все");
  const [city, setCity] = useState("Все");

  console.log(type);
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[576px] flex-col rounded-t-[16px] bg-white px-4 py-3">
          <header>
            <div className="flex justify-center pb-2 text-xl font-bold">Фильтр</div>
            <div className="absolute top-4 right-4">
              <button onClick={() => onOpenChange(false)}>
                <X className="h-6 w-6 text-gray-900" />
              </button>
            </div>
          </header>
          <div className="flex flex-col gap-4">
            <Drawer.NestedRoot open={isNested} onOpenChange={setIsNested}>
              <Drawer.Trigger className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
                <div className="flex flex-col items-start text-sm">
                  <div className="text-[#ABABAB]">Тип</div>
                  <div>{type}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-900" />
              </Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Overlay
                  className="fixed inset-0 z-[200] bg-black/40"
                  onClick={(e) => e.preventDefault()}
                />
                <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[300] mt-24 flex h-[300px] max-h-[94%] flex-col rounded-t-[10px] bg-gray-100 lg:h-[327px]">
                  <div className="flex flex-col px-4">
                    <header className="flex items-center justify-center py-3">
                      <div className="flex justify-center text-xl font-bold">Тип</div>
                    </header>
                    <div className="flex flex-col gap-6">
                      <div className="flex cursor-pointer items-center justify-between">
                        <div>Все</div>
                        <div
                          onClick={() => setType("Все")}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-[#ABABAB] bg-[#DBDBDB]"
                        >
                          {type === "Все" && <Check />}
                        </div>
                      </div>
                      <div className="flex cursor-pointer items-center justify-between">
                        <div>Глобальный</div>
                        <div
                          onClick={() => setType("Глобальный")}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-[#ABABAB] bg-[#DBDBDB]"
                        >
                          {type === "Глобальный" && <Check />}
                        </div>
                      </div>
                      <div className="flex cursor-pointer items-center justify-between">
                        <div>Локальный</div>
                        <div
                          onClick={() => setType("Локальный")}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-[#ABABAB] bg-[#DBDBDB]"
                        >
                          {type === "Локальный" && <Check />}
                        </div>
                      </div>
                    </div>
                  </div>
                </Drawer.Content>
              </Drawer.Portal>
            </Drawer.NestedRoot>
            <Drawer.NestedRoot open={isNested2} onOpenChange={setIsNested2}>
              <Drawer.Trigger className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
                <div className="flex flex-col items-start text-sm">
                  <div className="text-[#ABABAB]">Тема</div>
                  <div>{theme}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-900" />
              </Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-[200] bg-black/40" />
                <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[300] mt-24 flex h-[300px] max-h-[94%] flex-col rounded-t-[10px] bg-gray-100 lg:h-[327px]">
                  <div className="flex flex-col px-4">
                    <header className="flex items-center justify-center py-3">
                      <div className="flex justify-center text-xl font-bold">Тема</div>
                    </header>
                    <div className="flex flex-col gap-6">
                      <div className="flex cursor-pointer items-center justify-between">
                        <div>Все</div>
                        <div
                          onClick={() => setTheme("Все")}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-[#ABABAB] bg-[#DBDBDB]"
                        >
                          {theme === "Все" && <Check />}
                        </div>
                      </div>
                      <div className="flex cursor-pointer items-center justify-between">
                        <div>События</div>
                        <div
                          onClick={() => setTheme("События")}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-[#ABABAB] bg-[#DBDBDB]"
                        >
                          {theme === "События" && <Check />}
                        </div>
                      </div>
                      <div className="flex cursor-pointer items-center justify-between">
                        <div>Статьи</div>
                        <div
                          onClick={() => setTheme("Статьи")}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-[#ABABAB] bg-[#DBDBDB]"
                        >
                          {theme === "Статьи" && <Check />}
                        </div>
                      </div>
                    </div>
                  </div>
                </Drawer.Content>
              </Drawer.Portal>
            </Drawer.NestedRoot>
            <Drawer.NestedRoot open={isNested3} onOpenChange={setIsNested3}>
              <Drawer.Trigger className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
                <div className="flex flex-col items-start text-sm">
                  <div className="text-[#ABABAB]">Город</div>
                  <div>{city}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-900" />
              </Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-[200] bg-black/40" />
                <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[300] mt-24 flex h-[300px] max-h-[94%] flex-col rounded-t-[10px] bg-gray-100 lg:h-[327px]">
                  <div className="flex flex-col px-4">
                    <header className="flex items-center justify-center py-3">
                      <div className="flex justify-center text-xl font-bold">Город</div>
                    </header>
                    <div className="flex flex-col gap-6">
                      <div className="flex cursor-pointer items-center justify-between">
                        <div>Все</div>
                        <div
                          onClick={() => setCity("Все")}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-[#ABABAB] bg-[#DBDBDB]"
                        >
                          {city === "Все" && <Check />}
                        </div>
                      </div>
                      <div className="flex cursor-pointer items-center justify-between">
                        <div>Алматы</div>
                        <div
                          onClick={() => setCity("Алматы")}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-[#ABABAB] bg-[#DBDBDB]"
                        >
                          {city === "Алматы" && <Check />}
                        </div>
                      </div>
                      <div className="flex cursor-pointer items-center justify-between">
                        <div>Нур-Султан</div>
                        <div
                          onClick={() => setCity("Нур-Султан")}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-[#ABABAB] bg-[#DBDBDB]"
                        >
                          {city === "Нур-Султан" && <Check />}
                        </div>
                      </div>
                    </div>
                  </div>
                </Drawer.Content>
              </Drawer.Portal>
            </Drawer.NestedRoot>
          </div>
          {/* add  nested drawer*/}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

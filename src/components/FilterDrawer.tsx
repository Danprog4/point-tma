import { ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
import { Check } from "./Icons/Check";

interface FilterOption {
  key: string;
  label: string;
  type: string;
  options?: string[];
  min?: number;
  max?: number;
  disabled?: boolean;
}

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  config: FilterOption[];
  children: React.ReactNode;
  onReset?: () => void;
}

function SelectFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterOption;
  value: any;
  onChange: (val: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentValue = value || "Все";

  if (filter.disabled) {
    return (
      <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] bg-gray-50 px-4 py-2 opacity-50">
        <div className="flex flex-col items-start text-sm">
          <div className="text-[#ABABAB]">{filter.label}</div>
          <div>{currentValue}</div>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-900" />
      </div>
    );
  }

  return (
    <Drawer.NestedRoot open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
        <div className="flex flex-col items-start text-sm">
          <div className="text-[#ABABAB]">{filter.label}</div>
          <div>{currentValue}</div>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-900" />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-[1000001] bg-black/40"
          onClick={(e) => e.preventDefault()}
        />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[1000002] mt-24 flex h-[300px] max-h-[94%] flex-col rounded-t-[10px] bg-gray-100 lg:h-[327px]">
          <div className="flex flex-col px-4">
            <header className="relative flex items-center justify-center py-3">
              <div className="flex justify-center text-xl font-bold">{filter.label}</div>
              <div className="absolute top-3 right-0">
                {/* <button onClick={() => setIsOpen(false)}>
                  <X className="h-6 w-6 text-gray-900" />
                </button> */}
              </div>
            </header>
            <div className="scrollbar-hidden flex max-h-[240px] flex-col gap-6 overflow-y-auto">
              {(filter.options || []).map((option) => (
                <div
                  key={option}
                  className="flex cursor-pointer items-center justify-between"
                >
                  <div
                    onClick={() => {
                      onChange(option);
                    }}
                    className="w-full"
                  >
                    {option}
                  </div>
                  <div
                    onClick={() => {
                      onChange(option);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-[#ABABAB] bg-[#DBDBDB]"
                  >
                    {currentValue === option && <Check />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.NestedRoot>
  );
}

export default function FilterDrawer({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  onReset,
  config,
  children,
}: FilterDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-50 bg-black/40"
          onClick={(e) => {
            e.preventDefault();
          }}
        />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[1000001] mt-24 flex h-[85vh] flex-col rounded-t-[16px] bg-white px-4 py-3">
          <header>
            <div className="flex justify-center pb-2 text-xl font-bold">Фильтр</div>
            <div className="absolute top-4 right-4">
              <button onClick={() => onOpenChange(false)}>
                <X className="h-6 w-6 text-gray-900" />
              </button>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pt-4">
            {config?.map((filter) => {
              if (filter.type === "select") {
                return (
                  <SelectFilter
                    key={filter.key}
                    filter={filter}
                    value={filters[filter.key]}
                    onChange={(val) => onFilterChange(filter.key, val)}
                  />
                );
              }

              if (filter.type === "checkbox") {
                const isChecked = filters[filter.key] === true;
                return (
                  <div
                    key={filter.key}
                    className="flex cursor-pointer items-center justify-between"
                  >
                    <div>{filter.label}</div>
                    <div
                      onClick={() => onFilterChange(filter.key, !isChecked)}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-[#ABABAB] bg-[#DBDBDB]"
                    >
                      {isChecked && <Check />}
                    </div>
                  </div>
                );
              }

              if (filter.type === "range") {
                const min = filters[filter.key]?.min ?? filter.min ?? 0;
                const max = filters[filter.key]?.max ?? filter.max ?? 1000000;

                return (
                  <div key={filter.key} className="flex flex-col gap-2">
                    <div className="text-lg">{filter.label}</div>
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
                        <div className="flex flex-col items-start text-sm">
                          <div className="text-[#ABABAB]">От</div>
                          <input
                            type="number"
                            value={min || ""}
                            onChange={(e) =>
                              onFilterChange(filter.key, {
                                min: e.target.value === "" ? 0 : Number(e.target.value),
                                max,
                              })
                            }
                            className="w-full bg-transparent outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
                        <div className="flex flex-col items-start text-sm">
                          <div className="text-[#ABABAB]">До</div>
                          <input
                            type="number"
                            value={max || ""}
                            onChange={(e) =>
                              onFilterChange(filter.key, {
                                min,
                                max: e.target.value === "" ? 0 : Number(e.target.value),
                              })
                            }
                            className="w-full bg-transparent outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
          <div className="mt-4 flex gap-3 border-t pt-4">
            {onReset && (
              <button
                onClick={onReset}
                className="flex-1 rounded-2xl bg-gray-100 py-3 font-bold text-gray-900 transition-colors hover:bg-gray-200"
              >
                Сбросить
              </button>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-2xl bg-purple-600 py-3 font-bold text-white transition-colors hover:bg-purple-700"
            >
              Применить
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
import { cn } from "~/lib/utils";

export interface FilterOption {
  key: string;
  label: string;
  type: string;
  options?: string[] | Record<string, string[]>;
  min?: number;
  max?: number;
  disabled?: boolean;
}

interface MultiSelectFilterProps {
  filter: FilterOption;
  value: string[];
  onChange: (val: string[]) => void;
}

export function MultiSelectFilter({ filter, value, onChange }: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedValues = value || [];

  const isGrouped = !Array.isArray(filter.options);
  const options = filter.options || [];

  const toggleValue = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const CheckIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  return (
    <Drawer.NestedRoot open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger className="flex w-full items-center justify-between rounded-3xl border border-[#ABABAB] px-4 py-2">
        <div className="flex w-full flex-col items-start overflow-hidden pr-2 text-sm">
          <div className="text-[#ABABAB]">{filter.label}</div>
          <div className="w-full truncate text-left">
            {selectedValues.length > 0 ? selectedValues.join(", ") : "Все"}
          </div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-900" />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-[1000001] bg-black/40"
          onClick={(e) => e.preventDefault()}
        />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[1000002] mt-24 flex h-[80vh] flex-col rounded-t-[10px] bg-gray-100">
          <div className="relative flex h-full flex-col px-4">
            <header className="relative flex shrink-0 items-center justify-center border-b border-gray-200 py-3">
              <div className="flex justify-center text-xl font-bold">{filter.label}</div>
            </header>

            <div className="scrollbar-hidden flex-1 overflow-y-auto pb-4">
              {isGrouped ? (
                Object.entries(options as Record<string, string[]>).map(
                  ([category, tags]) => (
                    <div key={category} className="mb-6 last:mb-0">
                      <div className="sticky top-0 z-10 mb-3 bg-gray-100 py-2 font-semibold text-gray-500">
                        {category}
                      </div>
                      <div className="flex flex-col gap-2">
                        {tags.map((tag) => {
                          const isSelected = selectedValues.includes(tag);
                          return (
                            <div
                              key={tag}
                              onClick={() => toggleValue(tag)}
                              className="flex cursor-pointer items-center justify-between rounded-2xl bg-white p-4 transition-transform active:scale-[0.99]"
                            >
                              <span className="font-medium text-gray-900">{tag}</span>
                              <div
                                className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                                  isSelected
                                    ? "border-violet-600 bg-violet-600"
                                    : "border-gray-300 bg-transparent",
                                )}
                              >
                                {isSelected && (
                                  <CheckIcon className="h-4 w-4 text-white" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ),
                )
              ) : (
                <div className="flex flex-col gap-2">
                  {(options as string[]).map((option) => {
                    const isSelected = selectedValues.includes(option);
                    return (
                      <div
                        key={option}
                        onClick={() => toggleValue(option)}
                        className="flex cursor-pointer items-center justify-between rounded-2xl bg-white p-4 transition-transform active:scale-[0.99]"
                      >
                        <span className="font-medium text-gray-900">{option}</span>
                        <div
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                            isSelected
                              ? "border-violet-600 bg-violet-600"
                              : "border-gray-300 bg-transparent",
                          )}
                        >
                          {isSelected && <CheckIcon className="h-4 w-4 text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-auto shrink-0 border-t border-gray-200 bg-gray-100 py-4">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full rounded-2xl bg-violet-600 py-4 font-bold text-white transition-colors hover:bg-violet-700 active:scale-[0.99]"
              >
                Применить {selectedValues.length > 0 ? `(${selectedValues.length})` : ""}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.NestedRoot>
  );
}

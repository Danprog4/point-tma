import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";

interface EventsDrawerProps {
  open: boolean;
  index: number;
  onOpenChange: (open: boolean) => void;
  setSelectedItems: (items: { id: number; type: string; index: number }[]) => void;
  selectedItems: { id: number; type: string; index: number }[];
  data: any[];
  setActiveFilter: (filter: string) => void;
  activeFilter: string;
  setLocations: (
    locations: {
      location: string;
      address: string;
      starttime?: string;
      endtime?: string;
      index?: number;
      isCustom?: boolean;
    }[],
  ) => void;
  locations: {
    location: string;
    address: string;
    starttime?: string;
    endtime?: string;
    index?: number;
    isCustom?: boolean;
  }[];
}

export function EventsDrawer({
  open,
  index: locationIndex,
  onOpenChange,
  setSelectedItems,
  selectedItems,
  data,
  setActiveFilter,
  activeFilter,
  setLocations,
  locations,
}: EventsDrawerProps) {
  const [search, setSearch] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const filters = ["Все", "Кино", "Вечеринки", "Конференции", "Нетворкинг", "Квесты"];

  const handleEventTypeSelect = (eventType: string) => {
    console.log("Selected event type:", eventType);
    // Here you would navigate to the specific quest creation form
    onOpenChange(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[80%] flex-col rounded-t-[16px] bg-white px-4 py-4">
          <div className="overflow-y-auto">
            <div className="fixed top-0 right-0 left-0 z-[100] flex items-center bg-white px-4 py-4">
              <X
                className="absolute h-6 w-6 cursor-pointer"
                onClick={() => onOpenChange(false)}
              />
              <div className="mx-auto text-lg font-bold">Выбор из афишы</div>
            </div>
            <div className="scrollbar-hidden mb-4 flex w-full items-center gap-6 overflow-x-auto pt-12">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeFilter === filter
                      ? "bg-black text-white"
                      : "border-gray-200 bg-white text-black"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {data.map((item, dataIdx) => (
                <div
                  key={`${item.id}-${dataIdx}`}
                  onClick={() => {
                    setSelectedItems([
                      ...selectedItems,
                      { id: item.id, type: item.type, index: locationIndex },
                    ]);
                    setLocations([
                      ...locations,
                      {
                        location: item.title,
                        address: item.location,
                        starttime: item.date,
                        isCustom: false,
                        index: locationIndex,
                      },
                    ]);
                    onOpenChange(false);
                  }}
                >
                  <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl border bg-red-500">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 flex gap-1 text-black">
                      <div className="rounded-full bg-white p-1 text-sm">{item.date}</div>
                      <div className="rounded-full bg-white p-1 text-sm">
                        {item.price}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col p-2">
                    <div className="flex text-start">{item.title}</div>
                    <div className="text-sm text-gray-500">
                      {item.description?.slice(0, 10) +
                        (item.description?.length > 10 ? "..." : "")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

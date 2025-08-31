import { Search, X } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";

interface EventsDrawerProps {
  open: boolean;
  index?: number;
  onOpenChange: (open: boolean) => void;
  setSelectedItems?: (items: { id: number; type: string; index: number }[]) => void;
  selectedItems?: { id: number; type: string; index: number }[];
  data: any[];
  setActiveFilter: (filter: string) => void;
  activeFilter: string;
  setLocations?: (
    locations: {
      location: string;
      address: string;
      starttime?: string;
      endtime?: string;
      index?: number;
      isCustom?: boolean;
    }[],
  ) => void;
  locations?: {
    location: string;
    address: string;
    starttime?: string;
    endtime?: string;
    index?: number;
    isCustom?: boolean;
  }[];
  handleAddToCalendar?: (event: any) => void;
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
  handleAddToCalendar,
}: EventsDrawerProps) {
  const filters = ["Все", "Кино", "Вечеринки", "Конференции", "Нетворкинг", "Квесты"];
  const filtersMap = {
    Все: "Все",
    Кино: "Кино",
    Вечеринки: "Вечеринка",
    Конференции: "Конференция",
    Нетворкинг: "Нетворкинг",
    Квесты: "Квест",
  };
  const [search, setSearch] = useState<string>("");
  const clickHandler = (item: any) => {
    if (handleAddToCalendar) {
      handleAddToCalendar(item);
      return; // Don't close drawer here, handleAddToCalendar will handle it
    }
    if (setSelectedItems && locationIndex !== undefined) {
      // Remove any existing selected item for this index first
      const filteredItems = (selectedItems || []).filter(
        (si) => si.index !== locationIndex,
      );
      setSelectedItems([
        ...filteredItems,
        { id: item.id, type: item.type, index: locationIndex },
      ]);
    }
    if (setLocations && locationIndex !== undefined && locations) {
      // Update the specific location at locationIndex
      const newLocations = [...locations];
      // Ensure the array is large enough
      while (newLocations.length <= locationIndex) {
        newLocations.push({ location: "", address: "" });
      }
      // Replace the location at the specific index
      newLocations[locationIndex] = {
        location: item.title,
        address: item.location,
        starttime: "", // Don't set starttime from date field - user should set it manually
        endtime: "", // Don't set endtime from date field - user should set it manually
        isCustom: false,
        index: locationIndex,
      };
      setLocations(newLocations);
    }
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
            <input
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              value={search}
              type="text"
              placeholder="Поиск событий"
              className="mb-4 h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black placeholder:text-black/50"
            />
            <div className="absolute top-33 right-7">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {data
                .filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
                .map((item, dataIdx) => (
                  <div
                    key={`${item.id}-${dataIdx}`}
                    onClick={() => {
                      clickHandler(item);
                    }}
                  >
                    <div className="relative aspect-square w-full flex-shrink-0 overflow-hidden rounded-2xl border bg-red-500">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 flex gap-1 text-black">
                        <div className="rounded-full bg-white p-1 text-sm">
                          {item.date}
                        </div>
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

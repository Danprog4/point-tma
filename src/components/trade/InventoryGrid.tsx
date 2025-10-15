import { getImageUrl } from "~/lib/utils/getImageURL";

type InventoryItem = {
  type: string;
  caseId?: number;
  eventId?: number;
  eventType?: string;
  isActive?: boolean;
  isInTrade?: boolean;
  name?: string;
  id?: number;
};

type GroupedItem = {
  eventId?: number;
  name?: string;
  caseId?: number;
  type: string;
  count: number;
  items: InventoryItem[];
};

interface InventoryGridProps {
  groupedInventory: GroupedItem[];
  selectedItems: InventoryItem[];
  onItemToggle: (item: InventoryItem, groupedItem: GroupedItem) => void;
  getItemData: (item: GroupedItem) => any;
}

export default function InventoryGrid({
  groupedInventory,
  selectedItems,
  onItemToggle,
  getItemData,
}: InventoryGridProps) {
  const getSelectedCount = (groupedItem: GroupedItem) => {
    return groupedItem.items.filter((gItem) =>
      selectedItems.some((sItem) => sItem.id === gItem.id),
    ).length;
  };

  if (groupedInventory.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400">
        У пользователя пустой инвентарь
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 p-2">
      {groupedInventory.map((item, index) => {
        const itemData = getItemData(item);
        const isCase = item.type === "case";
        const isKey = item.type === "key";
        const selectedCount = getSelectedCount(item);
        const isSelected = selectedCount > 0;
        const isInTrade = item.items.some((item) => item.isInTrade);

        return (
          <button
            key={`${item.type}-${item.eventId}-${item.name}-${item.caseId}-${index}`}
            className={`relative flex aspect-square flex-col items-center justify-center rounded-xl p-3 transition ${
              isInTrade
                ? "cursor-not-allowed bg-gray-300 opacity-50"
                : isSelected
                  ? "bg-purple-500 ring-2 ring-purple-600"
                  : "bg-purple-100 hover:bg-purple-200"
            }`}
            onClick={() => !isInTrade && onItemToggle(item.items[0], item)}
            disabled={isInTrade}
          >
            {/* Count badge */}
            {item.count > 1 && (
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {item.count}
              </div>
            )}

            {/* Selected count badge */}
            {selectedCount > 0 && (
              <div className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                ✓{selectedCount > 1 ? selectedCount : ""}
              </div>
            )}

            {/* In trade badge */}
            {isInTrade && (
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                T
              </div>
            )}

            <img
              src={
                isCase || isKey
                  ? (itemData as any)?.photo?.startsWith("/")
                    ? (itemData as any).photo
                    : getImageUrl((itemData as any)?.photo || "")
                  : (itemData as any)?.image || "/fallback.png"
              }
              alt={
                isCase || isKey
                  ? ((itemData as any)?.name ?? "Item")
                  : ((itemData as any)?.title ?? "Item")
              }
              className="h-12 w-12 rounded-lg object-cover"
            />

            <div
              className={`mt-1 text-center text-xs font-bold ${
                isSelected ? "text-white" : "text-purple-900"
              }`}
            >
              {item.type === "ticket" && (itemData as any)?.category === "Квест"
                ? "Квест"
                : isCase
                  ? "Кейс"
                  : isKey
                    ? "Ключ"
                    : "Ваучер"}
            </div>
          </button>
        );
      })}
    </div>
  );
}

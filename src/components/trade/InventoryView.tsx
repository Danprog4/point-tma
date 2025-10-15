import { User } from "~/db/schema";
import InventoryGrid from "./InventoryGrid";
import PointsRequest from "./PointsRequest";

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

interface InventoryViewProps {
  selectedUser: User;
  groupedInventory: GroupedItem[];
  selectedItems: InventoryItem[];
  requestedPoints: number;
  onPointsChange: (points: number) => void;
  onItemToggle: (item: InventoryItem, groupedItem: GroupedItem) => void;
  onContinue: () => void;
  getItemData: (item: GroupedItem) => any;
}

export default function InventoryView({
  selectedUser,
  groupedInventory,
  selectedItems,
  requestedPoints,
  onPointsChange,
  onItemToggle,
  onContinue,
  getItemData,
}: InventoryViewProps) {
  // Check if any selected items are in trade
  const hasItemsInTrade = selectedItems.some((item) => item.isInTrade);
  return (
    <>
      <div className="mt-2 mb-4 text-center text-base text-purple-700">
        <span className="font-semibold">
          Выберите что вы хотите получить от {selectedUser.name}
        </span>
        <br />
        <span className="text-sm">Выберите предметы или укажите количество поинтов</span>
      </div>

      <PointsRequest
        requestedPoints={requestedPoints}
        onPointsChange={onPointsChange}
        userBalance={selectedUser.balance || 0}
      />

      <div className="mb-4 flex-1 overflow-y-auto" style={{ maxHeight: "35vh" }}>
        <InventoryGrid
          groupedInventory={groupedInventory}
          selectedItems={selectedItems}
          onItemToggle={onItemToggle}
          getItemData={getItemData}
        />
      </div>

      <div className="fixed right-0 bottom-4 left-0 mx-auto px-4">
        <button
          onClick={onContinue}
          disabled={
            (selectedItems.length === 0 && requestedPoints === 0) || hasItemsInTrade
          }
          className="w-full rounded-2xl bg-purple-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {hasItemsInTrade ? "Предметы в обмене" : "Продолжить"}
        </button>
      </div>
    </>
  );
}

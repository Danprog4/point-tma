import { Coins } from "lucide-react";
import { User } from "~/db/schema";
import { getImage } from "~/lib/utils/getImage";
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

interface TradeConfirmationProps {
  selectedUser: User;
  selectedItems: InventoryItem[];
  requestedPoints: number;
  onConfirm: () => void;
  getItemData: (item: GroupedItem) => any;
  isConfirming?: boolean;
}

export default function TradeConfirmation({
  selectedUser,
  selectedItems,
  requestedPoints,
  onConfirm,
  getItemData,
  isConfirming = false,
}: TradeConfirmationProps) {
  return (
    <div className="flex flex-col items-center py-4">
      <div className="mb-2 text-2xl font-bold text-purple-700">Подтверждение обмена</div>
      <div className="mb-4 text-center text-base text-gray-600">
        Вы хотите предложить обмен билетом с:
      </div>
      <div className="mb-4 flex flex-col items-center gap-2">
        <img
          src={getImage(selectedUser, "")}
          alt={selectedUser.name ?? ""}
          className="h-20 w-20 rounded-lg border-2 border-purple-300 object-cover"
        />
        <div className="text-lg font-semibold text-purple-900">
          {selectedUser.name} {selectedUser.surname}
        </div>
        <div className="text-xs text-gray-500">
          {selectedUser.login ? `${selectedUser.login}` : ""}
        </div>
      </div>

      {/* Trade Summary */}
      <div className="mb-4 w-full rounded-xl border border-purple-200 bg-purple-50 p-4">
        <div className="mb-2 text-center text-sm font-bold text-purple-700">
          Вы получите:
        </div>

        {selectedItems.length > 0 && (
          <div className="mb-2">
            <div className="mb-1 text-xs text-purple-600">Предметы:</div>
            <div className="flex flex-wrap gap-2">
              {selectedItems.slice(0, 5).map((item, idx) => {
                const mockGrouped: GroupedItem = {
                  eventId: item.eventId,
                  name: item.name,
                  caseId: item.caseId || item.id,
                  type: item.type,
                  count: 1,
                  items: [item],
                };
                const itemData = getItemData(mockGrouped);
                const isCase = item.type === "case";
                const isKey = item.type === "key";

                return (
                  <div
                    key={`preview-${idx}`}
                    className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-200"
                  >
                    <img
                      src={
                        isCase || isKey
                          ? (itemData as any)?.photo?.startsWith("/")
                            ? (itemData as any).photo
                            : getImageUrl((itemData as any)?.photo || "")
                          : (itemData as any)?.image || "/fallback.png"
                      }
                      alt="item"
                      className="h-10 w-10 rounded object-cover"
                    />
                  </div>
                );
              })}
              {selectedItems.length > 5 && (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-300 text-xs font-bold text-purple-900">
                  +{selectedItems.length - 5}
                </div>
              )}
            </div>
          </div>
        )}

        {requestedPoints > 0 && (
          <div className="flex items-center justify-center gap-2 text-purple-900">
            <Coins className="h-5 w-5" />
            <span className="font-bold">{requestedPoints} поинтов</span>
          </div>
        )}
      </div>

      <div className="fixed right-0 bottom-4 left-0 mx-auto px-4">
        <button
          className="mt-2 w-full rounded-2xl bg-purple-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          onClick={onConfirm}
          disabled={isConfirming || (selectedItems.length === 0 && requestedPoints === 0)}
        >
          {isConfirming ? "Отправка..." : "Отправить запрос на обмен"}
        </button>
      </div>
    </div>
  );
}

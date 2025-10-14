import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Coins, Repeat2, User as UserIcon, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { User } from "~/db/schema";
import { getImage } from "~/lib/utils/getImage";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";

// Utility to filter lists based on search
function filterUsers(users: User[], search: string) {
  if (!search.trim()) return [];
  return users.filter((u) =>
    `${u.name ?? ""} ${u.surname ?? ""} ${u.login ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
}

type InventoryItem = {
  type: string;
  caseId?: number;
  eventId?: number;
  eventType?: string;
  isActive?: boolean;
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

export default function TradeDrawer({
  open,
  onOpenChange,
  users,
  friends = [],
  cameFromGiveOrTrade,
  setIsGiveOrTradeOpen,
  setCameFromGiveOrTrade,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  friends?: User[];
  cameFromGiveOrTrade: boolean;
  setIsGiveOrTradeOpen: (value: boolean) => void;
  setCameFromGiveOrTrade: (value: boolean) => void;
}) {
  const trpc = useTRPC();
  const { data: events } = useQuery(trpc.event.getEvents.queryOptions());
  const { data: cases } = useQuery(trpc.cases.getCases.queryOptions());

  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewInventory, setViewInventory] = useState(false);
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [requestedPoints, setRequestedPoints] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isTradeSent, setIsTradeSent] = useState(false);

  // When searching, show from all users except current friends
  const filteredGlobalUsers =
    search.length > 0
      ? filterUsers(
          users.filter((u) => !friends.find((f) => f.id === u.id)),
          search,
        )
      : [];

  // If not searching, show only friends
  const filteredFriends = search.length === 0 ? friends : filterUsers(friends, search);

  // Group inventory items
  const groupedInventory = useMemo(() => {
    if (!selectedUser?.inventory) return [];

    const inactiveItems = selectedUser.inventory.filter((item) => !item.isActive);
    const groupedMap = new Map<string, GroupedItem>();

    inactiveItems.forEach((item) => {
      let key: string;

      if (item.type === "case") {
        const caseId = item.caseId || item.id;
        key = `${item.type}-${caseId || "no-case"}`;
      } else if (item.type === "key") {
        key = `${item.type}-${item.caseId || "no-case"}`;
      } else {
        key = `${item.type}-${item.eventId || "no-event"}-${item.name || "no-name"}`;
      }

      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.count += 1;
        existing.items.push(item);
      } else {
        groupedMap.set(key, {
          eventId: item.eventId,
          name: item.name,
          caseId: item.caseId || item.id,
          type: item.type,
          count: 1,
          items: [item],
        });
      }
    });

    return Array.from(groupedMap.values());
  }, [selectedUser?.inventory]);

  const getItemData = (item: GroupedItem) => {
    if (item.type === "case") {
      return cases?.find((c) => c.id === item.caseId);
    }
    if (item.type === "key" && item.caseId) {
      return cases?.find((c) => c.id === item.caseId);
    }
    if (item.eventId && item.name) {
      return events?.find(
        (event) => event.id === item.eventId && event.category === item.name,
      );
    }
    return null;
  };

  const handleReset = () => {
    setSelectedUser(null);
    setViewInventory(false);
    setSelectedItems([]);
    setRequestedPoints(0);
    setShowConfirmation(false);
    setIsTradeSent(false);
    setSearch("");
  };

  const handleDrawerClose = (open: boolean, skipReopenGiveOrTrade = false) => {
    if (!open) handleReset();
    if (cameFromGiveOrTrade && !skipReopenGiveOrTrade) {
      setIsGiveOrTradeOpen(true);
      setCameFromGiveOrTrade(false);
    } else if (cameFromGiveOrTrade && skipReopenGiveOrTrade) {
      setCameFromGiveOrTrade(false);
      toast.success("Обмен на билет успешно отправлен!");
    }
    onOpenChange(open);
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setViewInventory(true);
  };

  const toggleItemSelection = (item: InventoryItem, groupedItem: GroupedItem) => {
    // Toggle all items in the group
    const allSelected = groupedItem.items.every((gItem) =>
      selectedItems.some((sItem) => sItem.id === gItem.id),
    );

    if (allSelected) {
      // Remove all items from this group
      setSelectedItems((prev) =>
        prev.filter((sItem) => !groupedItem.items.some((gItem) => gItem.id === sItem.id)),
      );
    } else {
      // Add all items from this group
      setSelectedItems((prev) => {
        const newItems = [...prev];
        groupedItem.items.forEach((gItem) => {
          if (!newItems.some((sItem) => sItem.id === gItem.id)) {
            newItems.push(gItem);
          }
        });
        return newItems;
      });
    }
  };

  const handleContinueToConfirm = () => {
    if (selectedItems.length === 0 && requestedPoints === 0) {
      return; // Need to select at least something
    }
    setViewInventory(false);
    setShowConfirmation(true);
  };

  const getSelectedCount = (groupedItem: GroupedItem) => {
    return groupedItem.items.filter((gItem) =>
      selectedItems.some((sItem) => sItem.id === gItem.id),
    ).length;
  };

  console.log(cameFromGiveOrTrade, "cameFromGiveOrTrade");

  return (
    <Drawer.Root open={open} onOpenChange={handleDrawerClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-10 flex h-[70vh] flex-col rounded-t-3xl bg-white px-7 py-8 shadow-2xl">
          <header className="relative flex items-center justify-between pb-3">
            <ArrowLeft
              className="absolute top-1/2 left-0 h-6 w-6 -translate-y-1/2 cursor-pointer text-purple-500 transition hover:text-purple-700"
              onClick={() => {
                if (showConfirmation) {
                  // From confirmation back to inventory
                  setShowConfirmation(false);
                  setViewInventory(true);
                } else if (viewInventory) {
                  // From inventory back to user selection
                  setViewInventory(false);
                  setSelectedUser(null);
                  setSelectedItems([]);
                  setRequestedPoints(0);
                } else if (selectedUser && !isTradeSent) {
                  // From user selection back to friends list
                  setSelectedUser(null);
                }
              }}
              style={{
                visibility:
                  (selectedUser && !isTradeSent) || viewInventory || showConfirmation
                    ? "visible"
                    : "hidden",
              }}
            />
            <div className="mx-auto flex items-center gap-2 text-xl font-extrabold text-purple-700">
              <Repeat2 className="h-7 w-7 text-purple-600" />
              Обмен билетом
            </div>
            <button
              onClick={() => handleDrawerClose(false)}
              className="absolute top-0 right-0 rounded-full p-1 transition hover:bg-purple-50"
              aria-label="Закрыть"
            >
              <X className="h-8 w-8 text-purple-900" />
            </button>
          </header>

          {!selectedUser && !isTradeSent && (
            <>
              <div className="mt-2 mb-5 text-center text-base text-purple-700">
                <span className="font-semibold">
                  Обменяйтесь билетом с одним из друзей!
                </span>
                <br />
                Получите новые впечатления или помогите другу попасть на событие.
              </div>

              {/* SEARCH BAR */}
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2">
                <UserIcon className="h-5 w-5 text-purple-400" />
                <input
                  className="flex-1 bg-transparent text-purple-800 placeholder-purple-400 outline-none"
                  placeholder="Поиск по имени или логину..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* FRIENDS LIST (default) or Search results */}
              <div
                className="flex flex-col gap-5 overflow-y-auto pt-1"
                style={{ maxHeight: "55vh" }}
              >
                {search === "" ? (
                  filteredFriends.length > 0 ? (
                    <div>
                      <div className="mb-2 px-2 text-sm font-bold text-purple-500 uppercase">
                        Друзья
                      </div>
                      <div className="flex flex-col gap-2">
                        {filteredFriends.map((user) => (
                          <button
                            key={user.id}
                            className="flex items-center gap-4 rounded-xl border border-purple-100 bg-white px-5 py-3 shadow transition hover:border-purple-300"
                            onClick={() => handleUserSelect(user)}
                          >
                            <img
                              src={getImage(user, "")}
                              alt={user.name ?? ""}
                              className="h-10 w-10 rounded-full border border-purple-200 object-cover"
                            />
                            <div className="flex flex-col items-start text-left">
                              <span className="font-semibold text-purple-900">
                                {user.name} {user.surname}
                              </span>
                              <span className="text-xs text-purple-400">
                                {user.login ? `${user.login}` : ""}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-400">
                      У вас нет друзей для обмена
                    </div>
                  )
                ) : filteredGlobalUsers.length > 0 ? (
                  <div>
                    <div className="mb-2 px-2 text-sm font-bold text-yellow-600 uppercase">
                      Пользователи
                    </div>
                    <div className="flex flex-col gap-2">
                      {filteredGlobalUsers.map((user) => (
                        <button
                          key={user.id}
                          className="flex items-center gap-4 rounded-xl border border-yellow-100 bg-white px-5 py-3 shadow transition hover:border-yellow-300"
                          onClick={() => handleUserSelect(user)}
                        >
                          <img
                            src={getImage(user, "")}
                            alt={user.name ?? ""}
                            className="h-10 w-10 rounded-full border border-yellow-200 object-cover"
                          />
                          <div className="flex flex-col items-start text-left">
                            <span className="font-semibold text-yellow-900">
                              {user.name} {user.surname}
                            </span>
                            <span className="text-xs text-yellow-400">
                              {user.login ? `${user.login}` : ""}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-300">
                    Не найдено пользователей по запросу
                  </div>
                )}
              </div>
            </>
          )}

          {/* Inventory View */}
          {viewInventory && selectedUser && (
            <>
              <div className="mt-2 mb-4 text-center text-base text-purple-700">
                <span className="font-semibold">
                  Выберите что вы хотите получить от {selectedUser.name}
                </span>
                <br />
                <span className="text-sm">
                  Выберите предметы или укажите количество поинтов
                </span>
              </div>

              {/* Points Request Section */}
              <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-purple-700">
                  <Coins className="h-5 w-5" />
                  Поинты
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={requestedPoints || ""}
                    onChange={(e) => setRequestedPoints(Number(e.target.value))}
                    placeholder="Количество поинтов"
                    className="flex-1 rounded-lg border border-purple-200 bg-white px-3 py-2 text-purple-900 outline-none focus:border-purple-400"
                  />
                  <div className="text-sm text-purple-600">
                    Баланс: {selectedUser.balance || 0}
                  </div>
                </div>
              </div>

              {/* Inventory Items Grid */}
              <div className="mb-4 flex-1 overflow-y-auto" style={{ maxHeight: "35vh" }}>
                {groupedInventory.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3 p-2">
                    {groupedInventory.map((item, index) => {
                      const itemData = getItemData(item);
                      const isCase = item.type === "case";
                      const isKey = item.type === "key";
                      const selectedCount = getSelectedCount(item);
                      const isSelected = selectedCount > 0;

                      return (
                        <button
                          key={`${item.type}-${item.eventId}-${item.name}-${item.caseId}-${index}`}
                          className={`relative flex aspect-square flex-col items-center justify-center rounded-xl p-3 transition ${
                            isSelected
                              ? "bg-purple-500 ring-2 ring-purple-600"
                              : "bg-purple-100 hover:bg-purple-200"
                          }`}
                          onClick={() => toggleItemSelection(item.items[0], item)}
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
                            {item.type === "ticket" &&
                            (itemData as any)?.category === "Квест"
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
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    У пользователя пустой инвентарь
                  </div>
                )}
              </div>

              {/* Continue Button */}
              <div className="fixed right-0 bottom-4 left-0 mx-auto px-4">
                <button
                  onClick={handleContinueToConfirm}
                  disabled={selectedItems.length === 0 && requestedPoints === 0}
                  className="w-full rounded-2xl bg-purple-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Продолжить
                </button>
              </div>
            </>
          )}

          {/* Trade confirmation */}
          {showConfirmation && selectedUser && !isTradeSent && (
            <div className="flex flex-col items-center py-4">
              <div className="mb-2 text-2xl font-bold text-purple-700">
                Подтверждение обмена
              </div>
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
                  className="mt-2 w-full rounded-2xl bg-purple-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-purple-700"
                  onClick={() => setIsTradeSent(true)}
                >
                  Отправить запрос на обмен
                </button>
              </div>
            </div>
          )}

          {/* Trade success state */}
          {isTradeSent && (
            <div className="flex flex-col items-center justify-center pt-14 pb-10">
              <div className="mb-6 flex flex-col items-center gap-3">
                <div className="rounded-full bg-purple-100 p-4">
                  <Repeat2 className="h-10 w-10 text-purple-700 drop-shadow" />
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  Запрос отправлен!
                </div>
              </div>
              <div className="mb-4 max-w-xs text-center text-base text-gray-700">
                Запрос на обмен билетом отправлен пользователю{" "}
                <span className="font-semibold text-purple-900">
                  {selectedUser?.name} {selectedUser?.surname}
                </span>
                . Ожидайте ответа.
              </div>
              <button
                className="mt-2 rounded-lg bg-purple-200 px-6 py-2 font-bold text-purple-900 transition hover:bg-purple-300"
                onClick={() => {
                  handleDrawerClose(false, true);
                }}
              >
                Закрыть
              </button>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

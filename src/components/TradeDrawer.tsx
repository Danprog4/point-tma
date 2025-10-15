import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { User } from "~/db/schema";
import { useTRPC } from "~/trpc/init/react";
import {
  InventoryView,
  TradeConfirmation,
  TradeHeader,
  TradeSuccess,
  UserList,
  UserSearch,
} from "./trade";

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

export default function TradeDrawer({
  open,
  onOpenChange,
  users,
  friends = [],
  cameFromGiveOrTrade,
  setIsGiveOrTradeOpen,
  setCameFromGiveOrTrade,
  event,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  friends?: User[];
  cameFromGiveOrTrade: boolean;
  setIsGiveOrTradeOpen: (value: boolean) => void;
  setCameFromGiveOrTrade: (value: boolean) => void;
  event: { type: string; eventId: number; name: string; id: number };
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: events } = useQuery(trpc.event.getEvents.queryOptions());
  const { data: cases } = useQuery(trpc.cases.getCases.queryOptions());
  const sendTrade = useMutation(trpc.trades.sendTrade.mutationOptions());

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

  const handleBackClick = () => {
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
  };

  const showBackButton =
    (selectedUser && !isTradeSent) || viewInventory || showConfirmation;

  const handleConfirmTrade = async () => {
    if (!selectedUser || (selectedItems.length === 0 && requestedPoints === 0)) {
      toast.error("Выберите пользователя и предметы или поинты для обмена");
      return;
    }

    try {
      let tradeData: any = {
        toUserId: selectedUser.id,
        typeOfGiving: "ticket",
        eventIdOfGiving: event.eventId,
        eventTypeOfGiving: event.name, // Добавляем тип билета, который мы отдаем
      };

      if (selectedItems.length > 0 && requestedPoints === 0) {
        // Trade for items
        const firstSelectedItem = selectedItems[0];
        tradeData = {
          ...tradeData,
          typeOfReceiving: firstSelectedItem.type as "case" | "item" | "ticket",
          eventIdOfReceiving: firstSelectedItem.eventId,

          eventTypeOfReceiving: firstSelectedItem.name, // Используем name (категорию билета)
          caseIdOfReceiving: firstSelectedItem.caseId,
          itemIdOfReceiving: firstSelectedItem.id,
        };
      } else if (requestedPoints > 0 && selectedItems.length === 0) {
        // Trade for points
        tradeData = {
          ...tradeData,
          typeOfReceiving: "item", // Points are treated as items
          amountOfReceiving: requestedPoints,
        };
      }

      await sendTrade.mutateAsync(tradeData);

      // Update local cache - mark the ticket being given as in trade
      queryClient.setQueryData(trpc.main.getUser.queryKey(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          inventory: old.inventory?.map((item: any) =>
            item.eventId === event.eventId &&
            item.type === "ticket" &&
            item.name === event.name
              ? { ...item, isInTrade: true }
              : item,
          ),
        };
      });

      setIsTradeSent(true);
      toast.success("Запрос на обмен успешно отправлен!");
    } catch (error) {
      console.error("Error sending trade:", error);
      toast.error("Ошибка при отправке запроса на обмен");
    }
  };

  console.log(selectedItems, "selectedItems");

  return (
    <Drawer.Root open={open} onOpenChange={handleDrawerClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-10 flex h-[70vh] flex-col rounded-t-3xl bg-white px-7 py-8 shadow-2xl">
          <TradeHeader
            showBackButton={showBackButton}
            onBackClick={handleBackClick}
            onClose={() => handleDrawerClose(false)}
          />

          {!selectedUser && !isTradeSent && (
            <>
              <div className="mt-2 mb-5 text-center text-base text-purple-700">
                <span className="font-semibold">
                  Обменяйтесь предметами с одним из друзей!
                </span>
                <br />
                Получите новые впечатления или помогите другу попасть на событие.
              </div>

              <UserSearch search={search} onSearchChange={setSearch} />

              <div
                className="flex flex-col gap-5 overflow-y-auto pt-1"
                style={{ maxHeight: "55vh" }}
              >
                {search === "" ? (
                  <UserList
                    users={filteredFriends}
                    title="Друзья"
                    titleColor="text-purple-500"
                    borderColor="border-purple-100 hover:border-purple-300"
                    bgColor="bg-white"
                    textColor="text-purple-900"
                    onUserSelect={handleUserSelect}
                  />
                ) : (
                  <UserList
                    users={filteredGlobalUsers}
                    title="Пользователи"
                    titleColor="text-yellow-600"
                    borderColor="border-yellow-100 hover:border-yellow-300"
                    bgColor="bg-white"
                    textColor="text-yellow-900"
                    onUserSelect={handleUserSelect}
                  />
                )}
              </div>
            </>
          )}

          {/* Inventory View */}
          {viewInventory && selectedUser && (
            <InventoryView
              selectedUser={selectedUser}
              groupedInventory={groupedInventory}
              selectedItems={selectedItems}
              requestedPoints={requestedPoints}
              onPointsChange={setRequestedPoints}
              onItemToggle={toggleItemSelection}
              onContinue={handleContinueToConfirm}
              getItemData={getItemData}
            />
          )}

          {/* Trade confirmation */}
          {showConfirmation && selectedUser && !isTradeSent && (
            <TradeConfirmation
              selectedUser={selectedUser}
              selectedItems={selectedItems}
              requestedPoints={requestedPoints}
              onConfirm={handleConfirmTrade}
              getItemData={getItemData}
              isConfirming={sendTrade.isPending}
            />
          )}

          {/* Trade success state */}
          {isTradeSent && selectedUser && (
            <TradeSuccess
              selectedUserName={selectedUser.name || ""}
              selectedUserSurname={selectedUser.surname || ""}
              onClose={() => handleDrawerClose(false, true)}
            />
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

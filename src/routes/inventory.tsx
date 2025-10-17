import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import React, { useState } from "react";
import { InventoryItemPreview } from "~/components/InventoryItemPreview";
import KeyDrawer from "~/components/KeyDrawer";
import { SortableInventoryItem } from "~/components/SortableInventoryItem";
import { useDragScrollLock } from "~/hooks/useDragScrollLock";
import { usePlatform } from "~/hooks/usePlatform";
import { useTRPC } from "~/trpc/init/react";
import type { GroupedTicket } from "~/types/inventory";

export const Route = createFileRoute("/inventory")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const navigate = useNavigate();
  const { data: events } = useQuery(trpc.event.getEvents.queryOptions());
  const [selectedKey, setSelectedKey] = useState<any>(null);
  const [isKeyDrawerOpen, setIsKeyDrawerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Preview state
  const [previewTicket, setPreviewTicket] = useState<GroupedTicket | null>(null);
  const [previewEventData, setPreviewEventData] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: cases } = useQuery(trpc.cases.getCases.queryOptions());

  // Lock page scroll during drag
  useDragScrollLock(isDragging);

  // Sensors for drag and drop with activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag (работает и для touch)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const getCase = (caseId: number) => {
    return cases?.find((c) => c.id === caseId);
  };

  const updateInventoryOrderMutation = useMutation(
    trpc.main.updateInventoryOrder.mutationOptions({
      onSuccess: () => {
        // Обновляем кеш пользователя
        queryClient.invalidateQueries({ queryKey: trpc.main.getUser.queryKey() });
      },
    }),
  );

  const inactiveTickets = user?.inventory?.filter((ticket) => !ticket.isActive);

  // Функция для группировки билетов с учетом index
  const groupTickets = (tickets: typeof inactiveTickets): GroupedTicket[] => {
    // Сначала сортируем по index, если он есть
    const sortedByIndex = [...(tickets || [])].sort((a, b) => {
      const indexA = a.index ?? Infinity;
      const indexB = b.index ?? Infinity;
      return indexA - indexB;
    });

    const groupedMap = new Map<string, GroupedTicket>();

    sortedByIndex.forEach((ticket) => {
      // Создаем уникальный ключ для группировки
      let key: string;

      if (ticket.type === "case") {
        const caseId = ticket.caseId || ticket.id;
        key = `${ticket.type}-${caseId || "no-case"}`;
      } else if (ticket.type === "key") {
        key = `${ticket.type}-${ticket.caseId || "no-case"}`;
      } else {
        key = `${ticket.type}-${ticket.eventId || "no-event"}-${ticket.name || "no-name"}`;
      }

      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.count += 1;
      } else {
        groupedMap.set(key, {
          eventId: ticket.eventId,
          name: ticket.name,
          caseId: ticket.caseId || ticket.id,
          type: ticket.type,
          count: 1,
          isActive: ticket.isActive || false,
        });
      }
    });

    return Array.from(groupedMap.values());
  };

  const [sortedTickets, setSortedTickets] = useState<GroupedTicket[]>([]);

  // Initialize and update sorted tickets
  React.useEffect(() => {
    if (inactiveTickets) {
      const tickets = groupTickets(inactiveTickets);
      setSortedTickets(tickets);
    }
  }, [user?.inventory]);

  const groupedTickets = sortedTickets;

  // Drag start handler
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);

    const { active, over } = event;

    if (active.id !== over?.id && over) {
      setSortedTickets((items) => {
        const oldIndex = parseInt(active.id as string);
        const newIndex = parseInt(over.id as string);

        if (!isNaN(oldIndex) && !isNaN(newIndex)) {
          const newOrder = arrayMove(items, oldIndex, newIndex);

          // Синхронизируем с backend
          // Обновляем индексы в inventory
          if (user?.inventory) {
            const updatedInventory = user.inventory.map((item, idx) => ({
              ...item,
              index: idx,
            }));

            // Находим группы в новом порядке и обновляем их индексы
            const groupToNewIndex = new Map<string, number>();
            newOrder.forEach((group, groupIndex) => {
              let key: string;
              if (group.type === "case") {
                const caseId = group.caseId;
                key = `${group.type}-${caseId || "no-case"}`;
              } else if (group.type === "key") {
                key = `${group.type}-${group.caseId || "no-case"}`;
              } else {
                key = `${group.type}-${group.eventId || "no-event"}-${group.name || "no-name"}`;
              }
              groupToNewIndex.set(key, groupIndex);
            });

            // Обновляем индексы элементов согласно новому порядку групп
            const reindexedInventory = updatedInventory.map((item) => {
              let key: string;
              if (item.type === "case") {
                const caseId = item.caseId || item.id;
                key = `${item.type}-${caseId || "no-case"}`;
              } else if (item.type === "key") {
                key = `${item.type}-${item.caseId || "no-case"}`;
              } else {
                key = `${item.type}-${item.eventId || "no-event"}-${item.name || "no-name"}`;
              }
              const groupIndex = groupToNewIndex.get(key) ?? item.index ?? 0;
              return { ...item, index: groupIndex * 1000 + (item.index ?? 0) };
            });

            // Сортируем и перенумеруем
            const sortedInventory = reindexedInventory
              .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
              .map((item, idx) => ({
                type: item.type,
                caseId: item.caseId,
                eventId: item.eventId,
                eventType: item.eventType,
                isActive: item.isActive,
                name: item.name,
                id: item.id,
                isInTrade: item.isInTrade,
                index: idx,
              }));

            // Асинхронно синхронизируем с бэком
            updateInventoryOrderMutation.mutate({
              inventory: sortedInventory,
            });
          }

          return newOrder;
        }
        return items;
      });
    }
  };

  const getEvent = (eventId?: number, name?: string, type?: string, caseId?: number) => {
    if (type === "case") {
      // For cases, we need to find by the actual case ID, not eventId
      const actualCaseId = caseId || eventId;
      const caseData = cases?.find((c) => c.id === actualCaseId);
      return caseData;
    }
    if (type === "key" && caseId) {
      const caseData = cases?.find((c) => c.id === caseId);
      return caseData;
    }
    if (eventId && name) {
      return events?.find((event) => event.id === eventId && event.category === name);
    }
    return null;
  };

  // Handle long press
  const handleLongPress = (ticket: GroupedTicket, eventData: any) => {
    setPreviewTicket(ticket);
    setPreviewEventData(eventData);
    setIsPreviewOpen(true);
  };

  const isMobile = usePlatform();

  return (
    <div
      data-mobile={isMobile}
      className="mx-auto min-h-screen w-full overflow-y-auto bg-white pb-24 data-[mobile=true]:pt-40"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-center text-base font-bold text-gray-800">Инвентарь</h1>

        <button className="flex h-6 w-6 items-center justify-center"></button>
      </div>

      <div
        style={{
          height: "calc(100vh - 120px)", // Space for fixed header
          margin: "0 auto",
          overflow: "auto",
          paddingTop: "0px",
        }}
        className="scrollbar-hidden min-h-screen overflow-y-auto"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToParentElement]}
        >
          <SortableContext
            items={groupedTickets.map((_, index) => index.toString())}
            strategy={rectSortingStrategy}
          >
            {groupedTickets.length > 0 ? (
              <div className="grid grid-cols-3 gap-4 p-4">
                {groupedTickets.map((ticket, index) => {
                  const eventData = getEvent(
                    ticket.eventId,
                    ticket.name,
                    ticket.type,
                    ticket.caseId,
                  );

                  return (
                    <SortableInventoryItem
                      key={`${ticket.type}-${ticket.eventId || "no-event"}-${ticket.name || "no-name"}-${ticket.caseId || "no-case"}-${index}`}
                      id={index.toString()}
                      ticket={ticket}
                      index={index}
                      eventData={eventData}
                      getCase={getCase}
                      onKeyClick={(ticket) => {
                        setSelectedKey(ticket);
                        setIsKeyDrawerOpen(true);
                      }}
                      onLongPress={handleLongPress}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-start text-gray-500">Ваш инвентарь пока пуст</div>
            )}
          </SortableContext>
        </DndContext>
      </div>

      {/* KeyDrawer для ключей */}
      {selectedKey && (
        <KeyDrawer
          open={isKeyDrawerOpen}
          onOpenChange={setIsKeyDrawerOpen}
          keyData={selectedKey}
          caseData={selectedKey.caseId ? getCase(selectedKey.caseId) : undefined}
        >
          <div />
        </KeyDrawer>
      )}

      {/* Preview модальное окно */}
      <InventoryItemPreview
        isOpen={isPreviewOpen}
        ticket={previewTicket}
        eventData={previewEventData}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}

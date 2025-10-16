import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import React, { useState } from "react";
import KeyDrawer from "~/components/KeyDrawer";
import { SortableInventoryItem } from "~/components/SortableInventoryItem";
import { useDragScrollLock } from "~/hooks/useDragScrollLock";
import { usePlatform } from "~/hooks/usePlatform";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/inventory")({
  component: RouteComponent,
});

// Тип для сгруппированного билета
type GroupedTicket = {
  eventId?: number;
  name?: string;
  caseId?: number;
  type: string;
  count: number;
  isActive: boolean;
};

function RouteComponent() {
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const navigate = useNavigate();
  const { data: events } = useQuery(trpc.event.getEvents.queryOptions());
  const [selectedKey, setSelectedKey] = useState<any>(null);
  const [isKeyDrawerOpen, setIsKeyDrawerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { data: cases } = useQuery(trpc.cases.getCases.queryOptions());

  // Lock page scroll during drag
  useDragScrollLock(isDragging);

  // Sensors for drag and drop with activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Require 10px of movement before starting drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay before drag starts on touch
        tolerance: 5, // 5px tolerance for movement
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const getCase = (caseId: number) => {
    return cases?.find((c) => c.id === caseId);
  };

  const inactiveTickets = user?.inventory?.filter((ticket) => !ticket.isActive);

  // Функция для группировки билетов
  const groupTickets = (tickets: typeof inactiveTickets): GroupedTicket[] => {
    const groupedMap = new Map<string, GroupedTicket>();

    tickets?.forEach((ticket) => {
      // Создаем уникальный ключ для группировки
      let key: string;

      if (ticket.type === "case") {
        // Для кейсов группируем по типу и ID кейса
        const caseId = ticket.caseId || ticket.id;
        key = `${ticket.type}-${caseId || "no-case"}`;
      } else if (ticket.type === "key") {
        // Для ключей группируем по типу и ID кейса
        key = `${ticket.type}-${ticket.caseId || "no-case"}`;
      } else {
        // Для остальных типов используем старую логику
        key = `${ticket.type}-${ticket.eventId || "no-event"}-${ticket.name || "no-name"}`;
      }

      console.log(ticket, "ticket", "key:", key);

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

  // Initialize sorted tickets only once
  React.useEffect(() => {
    if (sortedTickets.length === 0 && inactiveTickets) {
      const tickets = groupTickets(inactiveTickets);
      setSortedTickets(tickets);
    }
  }, [inactiveTickets, sortedTickets.length]);

  const groupedTickets =
    sortedTickets.length > 0 ? sortedTickets : groupTickets(inactiveTickets);

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
          return arrayMove(items, oldIndex, newIndex);
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
      console.log(caseData, "caseData", "actualCaseId:", actualCaseId);
      return caseData;
    }
    if (type === "key" && caseId) {
      const caseData = cases?.find((c) => c.id === caseId);
      console.log(caseData, "caseData for key");
      return caseData;
    }
    if (eventId && name) {
      return events?.find((event) => event.id === eventId && event.category === name);
    }
    return null;
  };

  console.log(groupedTickets, "groupedTickets");
  console.log(user?.inventory, "user inventory");
  console.log(cases, "cases data");

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
    </div>
  );
}

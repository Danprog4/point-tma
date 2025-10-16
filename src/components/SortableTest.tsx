import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

// Test data
const initialItems = [
  { id: "1", name: "🎟️", type: "ticket" },
  { id: "2", name: "🔑", type: "key" },
  { id: "3", name: "💎", type: "case" },
  { id: "4", name: "🧤", type: "ticket" },
  { id: "5", name: "⚔️", type: "case" },
  { id: "6", name: "🍀", type: "key" },
];

function TestSortableItem({ item }: { item: (typeof initialItems)[0] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex aspect-square cursor-grab flex-col items-center justify-center rounded-2xl bg-[#DEB8FF] p-4 select-none active:cursor-grabbing ${
        isDragging ? "scale-105 shadow-2xl" : "shadow-md"
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="pointer-events-none mb-2 text-3xl">{item.name}</div>
      <div className="pointer-events-none text-center text-xs font-bold text-[#A35700]">
        {item.type}
      </div>
    </div>
  );
}

export function SortableTest() {
  const [items, setItems] = useState(initialItems);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="p-8">
      <h2 className="mb-4 text-2xl font-bold">Тест сортировки</h2>
      <div
        style={{
          height: "50vh",
          margin: "0 auto",
          overflow: "auto",
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToParentElement]}
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 gap-4 p-4">
              {items.map((item) => (
                <TestSortableItem key={item.id} item={item} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

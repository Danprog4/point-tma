import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "@tanstack/react-router";
import React, { useRef } from "react";
import { getImageUrl } from "~/lib/utils/getImageURL";
import type { GroupedTicket } from "~/types/inventory";

type SortableInventoryItemProps = {
  id: string;
  ticket: GroupedTicket;
  index: number;
  eventData: any;
  getCase: (caseId: number) => any;
  onKeyClick: (ticket: GroupedTicket) => void;
  onLongPress: (ticket: GroupedTicket, eventData: any) => void;
};

export function SortableInventoryItem({
  id,
  ticket,
  index,
  eventData,
  getCase,
  onKeyClick,
  onLongPress,
}: SortableInventoryItemProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: id,
      // Отключаем drag на время long press
      disabled: false,
    });

  const isCase = ticket.type === "case";
  const isKey = ticket.type === "key";

  // Long press logic
  const isLongPress = useRef(false);
  const longPressTimer = useRef<number | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  // Отменяем long press таймер
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Запускаем long press при pointerdown
  const handlePointerDown = (e: React.PointerEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    isLongPress.current = false;

    // Запускаем таймер на 500ms
    longPressTimer.current = window.setTimeout(() => {
      // Проверяем что не двигались
      if (startPos.current && !isDragging) {
        isLongPress.current = true;
        onLongPress(ticket, eventData);

        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, 500);
  };

  // Отслеживаем движение - если двигаем, отменяем long press
  const handlePointerMove = (e: React.PointerEvent) => {
    if (startPos.current && longPressTimer.current) {
      const deltaX = Math.abs(e.clientX - startPos.current.x);
      const deltaY = Math.abs(e.clientY - startPos.current.y);

      // Если сдвинули больше 8px - это drag, отменяем long press
      if (deltaX > 8 || deltaY > 8) {
        cancelLongPress();
        startPos.current = null;
      }
    }
  };

  // При отпускании - отменяем таймер
  const handlePointerUp = () => {
    cancelLongPress();

    // Сбрасываем флаг long press через небольшую задержку
    setTimeout(() => {
      startPos.current = null;
      isLongPress.current = false;
    }, 100);
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent click when dragging or long pressing
    if (isDragging || isLongPress.current) {
      isLongPress.current = false;
      return;
    }

    // Prevent default touch behavior
    e.preventDefault();

    if (isKey) {
      // For keys, open KeyDrawer
      onKeyClick(ticket);
    } else if (isCase) {
      // For cases, use correct ID
      const actualCaseId = ticket.caseId || ticket.eventId;
      if (actualCaseId) {
        navigate({ to: `/case/${actualCaseId}` });
      }
    } else if (ticket.eventId && ticket.name) {
      navigate({ to: `/event/${ticket.name}/${ticket.eventId}` });
    }
  };

  // Комбинируем listeners с нашими обработчиками
  const combinedListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      handlePointerDown(e);
      listeners?.onPointerDown?.(e as any);
    },
    onPointerMove: (e: React.PointerEvent) => {
      handlePointerMove(e);
      listeners?.onPointerMove?.(e as any);
    },
    onPointerUp: (e: React.PointerEvent) => {
      handlePointerUp();
      listeners?.onPointerUp?.(e as any);
    },
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        touchAction: "none", // Важно! Отключает браузерные жесты
      }}
      className={`relative flex aspect-square cursor-grab flex-col items-center justify-center rounded-2xl bg-[#DEB8FF] p-4 select-none active:cursor-grabbing ${
        isDragging ? "scale-105 shadow-2xl" : "shadow-md"
      }`}
      onClick={handleClick}
      {...attributes}
      {...combinedListeners}
    >
      {/* Badge with ticket count */}
      {ticket.count > 1 && (
        <div className="absolute -top-1 -right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
          {ticket.count}
        </div>
      )}

      <img
        src={
          isCase || isKey
            ? (eventData as any)?.photo?.startsWith("/")
              ? (eventData as any).photo
              : (getImageUrl((eventData as any)?.photo) ?? "/fallback.png")
            : ((eventData as any)?.image ?? "/fallback.png")
        }
        alt={
          isCase || isKey
            ? ((eventData as any)?.name ?? "Кейс")
            : ((eventData as any)?.title ?? "Предмет")
        }
        className="pointer-events-none h-[61px] w-[61px] rounded-lg object-cover"
        draggable={false}
      />

      <div className="pointer-events-none text-center text-xs font-bold text-[#A35700]">
        {ticket.type === "ticket" && (eventData as any)?.category === "Квест"
          ? "Квест"
          : isCase
            ? "Кейс"
            : isKey
              ? "Ключ"
              : "Ваучер"}
      </div>
    </div>
  );
}

import { useNavigate } from "@tanstack/react-router";
import { hapticFeedback } from "@telegram-apps/sdk";
import React, { useRef } from "react";
import { getImageUrl } from "~/lib/utils/getImageURL";
import type { GroupedTicket } from "~/types/inventory";

type InventoryItemProps = {
  ticket: GroupedTicket;
  eventData: any;
  onKeyClick: (ticket: GroupedTicket) => void;
  onLongPress: (ticket: GroupedTicket, eventData: any) => void;
};

export function InventoryItem({
  ticket,
  eventData,
  onKeyClick,
  onLongPress,
}: InventoryItemProps) {
  const navigate = useNavigate();

  const isCase = ticket.type === "case";
  const isKey = ticket.type === "key";

  // Long press logic
  const isLongPress = useRef(false);
  const longPressTimer = useRef<number | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

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

    // Запускаем таймер на 300ms
    longPressTimer.current = window.setTimeout(() => {
      // Проверяем что не двигались (с небольшим допуском)
      if (startPos.current) {
        isLongPress.current = true;
        onLongPress(ticket, eventData);

        if (hapticFeedback.isSupported()) {
          hapticFeedback.impactOccurred("medium");
        }
      }
    }, 300);
  };

  // Отслеживаем движение - если двигаем, отменяем long press
  const handlePointerMove = (e: React.PointerEvent) => {
    if (startPos.current && longPressTimer.current) {
      const deltaX = Math.abs(e.clientX - startPos.current.x);
      const deltaY = Math.abs(e.clientY - startPos.current.y);

      // Если сдвинули больше 8px - это drag/scroll, отменяем long press
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
    // Prevent click when long pressing
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }

    // Prevent default touch behavior
    // e.preventDefault(); // Might block scrolling if called on touchstart, but this is click

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

  return (
    <div
      style={{
        touchAction: "none", // Важно! Отключает браузерные жесты на самом элементе
      }}
      className={`relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl bg-[#DEB8FF] p-4 select-none shadow-md transition-transform active:scale-95`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
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


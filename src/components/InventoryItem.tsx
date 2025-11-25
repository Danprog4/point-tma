import { useNavigate } from "@tanstack/react-router";
import { hapticFeedback } from "@telegram-apps/sdk";
import { Key as KeyIcon, Package, Star, Ticket } from "lucide-react";
import React, { useRef, useState } from "react";
import { cn } from "~/lib/utils/cn";
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
  const [imageError, setImageError] = useState(false);

  const isCase = ticket.type === "case";
  const isKey = ticket.type === "key";

  // Long press logic
  const isLongPress = useRef(false);
  const longPressTimer = useRef<number | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    isLongPress.current = false;

    longPressTimer.current = window.setTimeout(() => {
      if (startPos.current) {
        isLongPress.current = true;
        onLongPress(ticket, eventData);

        if (hapticFeedback.isSupported()) {
          hapticFeedback.impactOccurred("medium");
        }
      }
    }, 300);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startPos.current && longPressTimer.current) {
      const deltaX = Math.abs(e.clientX - startPos.current.x);
      const deltaY = Math.abs(e.clientY - startPos.current.y);

      if (deltaX > 8 || deltaY > 8) {
        cancelLongPress();
        startPos.current = null;
      }
    }
  };

  const handlePointerUp = () => {
    cancelLongPress();
    setTimeout(() => {
      startPos.current = null;
      isLongPress.current = false;
    }, 100);
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }

    if (isKey) {
      onKeyClick(ticket);
    } else if (isCase) {
      const actualCaseId = ticket.caseId || ticket.eventId;
      if (actualCaseId) {
        navigate({ to: `/case/${actualCaseId}` });
      }
    } else if (ticket.eventId && ticket.name) {
      navigate({ to: `/event/${ticket.name}/${ticket.eventId}` });
    }
  };

  const getTicketTypeLabel = () => {
    if (ticket.type === "ticket" && (eventData as any)?.category === "Квест")
      return "Квест";
    if (isCase) return "Кейс";
    if (isKey) return "Ключ";
    return "Ваучер";
  };

  const getTicketIcon = () => {
    if (ticket.type === "ticket" && (eventData as any)?.category === "Квест")
      return <Star className="h-3 w-3" />;
    if (isCase) return <Package className="h-3 w-3" />;
    if (isKey) return <KeyIcon className="h-3 w-3" />;
    return <Ticket className="h-3 w-3" />;
  };

  const imageUrl =
    isCase || isKey
      ? (eventData as any)?.photo?.startsWith("/")
        ? (eventData as any).photo
        : getImageUrl((eventData as any)?.photo)
      : (eventData as any)?.image;

  const finalImageSrc = !imageError && imageUrl ? imageUrl : "/fallback.png"; // Replace with a real placeholder if available, or just use a generic icon/color

  // Type-based styling
  const typeLabel = getTicketTypeLabel();
  const typeColor =
    typeLabel === "Квест"
      ? "text-amber-600 bg-amber-50 ring-amber-200"
      : typeLabel === "Кейс"
        ? "text-blue-600 bg-blue-50 ring-blue-200"
        : typeLabel === "Ключ"
          ? "text-purple-600 bg-purple-50 ring-purple-200"
          : "text-emerald-600 bg-emerald-50 ring-emerald-200";

  return (
    <div
      style={{ touchAction: "none" }}
      className="group relative flex aspect-square cursor-pointer flex-col justify-between overflow-hidden rounded-[24px] bg-white p-3 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md active:scale-95"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Count Badge */}
      {ticket.count > 1 && (
        <div className="absolute top-2 right-2 z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-900 px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
          {ticket.count}
        </div>
      )}

      {/* Image Container */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl bg-gray-50">
        {!imageError && imageUrl ? (
          <img
            src={imageUrl}
            alt={typeLabel}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            {getTicketIcon()}
          </div>
        )}
      </div>

      {/* Label */}
      <div className="mt-2 flex items-center justify-center">
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold tracking-wide uppercase ring-1 ring-inset",
            typeColor,
          )}
        >
          {getTicketIcon()}
          <span>{typeLabel}</span>
        </div>
      </div>
    </div>
  );
}

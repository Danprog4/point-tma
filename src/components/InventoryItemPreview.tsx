import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { getImageUrl } from "~/lib/utils/getImageURL";
import type { GroupedTicket } from "~/types/inventory";

type InventoryItemPreviewProps = {
  isOpen: boolean;
  ticket: GroupedTicket | null;
  eventData: any;
  onClose: () => void;
};

export function InventoryItemPreview({
  isOpen,
  ticket,
  eventData,
  onClose,
}: InventoryItemPreviewProps) {
  // Блокируем скролл когда открыто
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!ticket) return null;

  const isCase = ticket.type === "case";
  const isKey = ticket.type === "key";

  const getItemTitle = () => {
    if (isCase) return (eventData as any)?.name ?? "Кейс";
    if (isKey) return "Ключ";
    return (eventData as any)?.title ?? "Предмет";
  };

  const getItemType = () => {
    if (ticket.type === "ticket" && (eventData as any)?.category === "Квест") {
      return "Квест";
    }
    if (isCase) return "Кейс";
    if (isKey) return "Ключ";
    return "Ваучер";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop с blur */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[9998] bg-black/40"
            onClick={onClose}
          />

          {/* Увеличенный предмет */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3,
            }}
            className="fixed top-1/2 left-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2"
            onClick={onClose}
          >
            <div className="relative flex w-[280px] flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-2xl">
              {/* Badge с количеством */}
              {ticket.count > 1 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                  className="absolute -top-3 -right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-lg font-bold text-white shadow-lg"
                >
                  {ticket.count}
                </motion.div>
              )}

              {/* Изображение */}
              <motion.div
                initial={{ scale: 0.8, rotate: -5 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.05, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <img
                  src={
                    isCase || isKey
                      ? (eventData as any)?.photo?.startsWith("/")
                        ? (eventData as any).photo
                        : (getImageUrl((eventData as any)?.photo) ?? "/fallback.png")
                      : ((eventData as any)?.image ?? "/fallback.png")
                  }
                  alt={getItemTitle()}
                  className="h-[140px] w-[140px] rounded-2xl object-cover shadow-lg"
                />
              </motion.div>

              {/* Информация */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-center"
              >
                <div className="mb-2 text-sm font-semibold tracking-wider text-purple-600 uppercase">
                  {getItemType()}
                </div>
                <div className="text-xl font-bold text-gray-800">{getItemTitle()}</div>

                {/* Описание если есть */}
                {eventData?.description && (
                  <div className="mt-3 max-w-[240px] text-sm text-gray-600">
                    {(eventData.description as string).slice(0, 100)}
                    {(eventData.description as string).length > 100 ? "..." : ""}
                  </div>
                )}
              </motion.div>

              {/* Подсказка для закрытия */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-xs text-gray-400"
              >
                Нажмите чтобы закрыть
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X as XIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { getImageUrl } from "~/lib/utils/getImageURL";

export const FullScreenPhoto = ({
  allPhotos,
  currentIndex,
  setCurrentIndex,
  setIsFullScreen,
  isOpen,
  children,
}: any) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-opacity-90 fixed inset-0 z-[10000000] flex items-center justify-center bg-black"
        >
          {allPhotos.length > 1 && (
            <ChevronLeft
              className="absolute left-4 h-10 w-10 cursor-pointer rounded-full bg-black/40 p-2 text-white shadow-lg backdrop-blur-sm transition-transform hover:bg-black/60 active:scale-95"
              onClick={() =>
                setCurrentIndex(
                  (prev: number) => (prev - 1 + allPhotos.length) % allPhotos.length,
                )
              }
            />
          )}

          {(() => {
            const imgSrc = allPhotos[currentIndex];
            if (!imgSrc) return null;
            return (
              <motion.img
                key={imgSrc}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                src={imgSrc.startsWith("data:image/") ? imgSrc : getImageUrl(imgSrc)}
                alt="Full view"
                className="max-h-full max-w-full object-contain"
              />
            );
          })()}

          {allPhotos.length > 1 && (
            <ChevronRight
              className="absolute right-4 h-10 w-10 cursor-pointer rounded-full bg-black/40 p-2 text-white shadow-lg backdrop-blur-sm transition-transform hover:bg-black/60 active:scale-95"
              onClick={() =>
                setCurrentIndex((prev: number) => (prev + 1) % allPhotos.length)
              }
            />
          )}

          <XIcon
            className="absolute top-28 right-4 h-8 w-8 cursor-pointer rounded-full bg-black/40 p-1 text-white shadow-lg backdrop-blur-sm transition-transform hover:bg-black/60 active:scale-95"
            onClick={() => setIsFullScreen(false)}
          />

          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

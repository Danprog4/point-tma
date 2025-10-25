import { AnimatePresence, motion } from "framer-motion";
import { getImage } from "~/lib/utils/getImage";

interface UserPhotoProps {
  user: any;
  photoData: {
    allPhotos: string[];
    currentIndex: number;
    imageToShow: string;
  };
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onClick: () => void;
  onMoreClick: (e: React.MouseEvent) => void;
  isFastMeet?: boolean;
}

export const UserPhoto = ({
  user,
  photoData,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onClick,
  onMoreClick,
  isFastMeet,
}: UserPhotoProps) => {
  const { allPhotos, currentIndex, imageToShow } = photoData;

  // Early return if user is undefined
  if (!user) {
    return null;
  }

  return (
    <div
      className="group relative w-full overflow-hidden rounded-t-2xl shadow-md transition-all hover:shadow-xl"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={onClick}
    >
      <div className="relative h-90 w-full overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.img
            key={currentIndex}
            src={getImage(user as any, imageToShow)}
            alt={user?.name || ""}
            className="h-90 w-full object-cover transition-transform group-hover:scale-105"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onError={(e) => {
              // First try Telegram avatar, then default image
              if (
                user?.photoUrl &&
                user.photoUrl.trim() !== "" &&
                e.currentTarget.src !== user.photoUrl
              ) {
                e.currentTarget.src = user.photoUrl.trim();
              } else {
                e.currentTarget.src = user?.sex === "male" ? "/men.jpeg" : "/women.jpeg";
              }
            }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* More button */}
      {!isFastMeet && (
        <motion.div
          onClick={onMoreClick}
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg backdrop-blur-sm"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className="pb-1 text-base font-bold text-purple-600">⋯</div>
        </motion.div>
      )}

      {/* Photo indicators */}
      {allPhotos.length > 1 && (
        <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
          {allPhotos.map((_, idx) => (
            <span
              key={idx}
              className={`h-2 w-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "w-6 bg-purple-600 shadow-md"
                  : "bg-white/70 hover:bg-white"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

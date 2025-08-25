import { AnimatePresence, motion } from "framer-motion";
import { getImage } from "~/lib/utils/getImage";
import { getUserAge } from "~/lib/utils/getUserAge";

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

  return (
    <div
      className="relative w-full"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={onClick}
    >
      <div className="relative h-90 w-full overflow-hidden rounded-t-2xl">
        <AnimatePresence initial={false}>
          <motion.img
            key={currentIndex}
            src={getImage(user as any, imageToShow)}
            alt={user.name || ""}
            className="h-90 w-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onError={(e) => {
              console.log(`Image failed to load for user ${user.id}:`, {
                src: getImage(user as any, imageToShow),
                originalSrc: e.currentTarget.src,
              });
              // First try Telegram avatar, then default image
              if (
                user?.photoUrl &&
                user.photoUrl.trim() !== "" &&
                e.currentTarget.src !== user.photoUrl
              ) {
                console.log(`Falling back to Telegram avatar for user ${user.id}`);
                e.currentTarget.src = user.photoUrl.trim();
              } else {
                console.log(`Using default image for user ${user.id}`);
                e.currentTarget.src = user?.sex === "male" ? "/men.jpeg" : "/women.jpeg";
              }
            }}
            onLoad={() => {
              console.log(
                `Image loaded successfully for user ${user.id}:`,
                getImage(user as any, imageToShow),
              );
            }}
          />
        </AnimatePresence>
        {isFastMeet ? (
          <div className="pointer-events-none absolute right-0 bottom-0 left-0 flex h-20 items-center justify-start gap-2 bg-gradient-to-t from-black/60 to-transparent px-4">
            <div className="text-xl font-bold text-white">
              {user.name} {user.surname}
            </div>
            <div className="text-lg text-neutral-300">{getUserAge(user.birthday)}</div>
            <div></div>
          </div>
        ) : null}
      </div>

      {/* More button */}
      {!isFastMeet && (
        <div
          onClick={onMoreClick}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F0FF] p-2"
        >
          <div className="pb-2 text-sm font-bold text-[#721DBD]">...</div>
        </div>
      )}

      {/* Photo indicators */}
      {allPhotos.length > 1 && (
        <div className="absolute bottom-2 left-4 flex items-center gap-1">
          {allPhotos.map((_, idx) => (
            <span
              key={idx}
              className={
                "h-2 w-2 rounded-full " +
                (idx === currentIndex ? "bg-[#9924FF]" : "bg-white/70")
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

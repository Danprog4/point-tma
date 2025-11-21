import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, MoreHorizontal, MapPin } from "lucide-react";
import { usePeopleGallery } from "~/hooks/usePeopleGallery";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { cn } from "~/lib/utils";
import { getImageUrl } from "~/lib/utils/getImageURL";

interface UserCardProps {
  user: any;
  isFavorite: boolean;
  onFavoriteClick: () => void;
  onMoreClick: () => void;
  galleryData: ReturnType<typeof usePeopleGallery>;
}

export const UserCard = ({
  user,
  isFavorite,
  onFavoriteClick,
  onMoreClick,
  galleryData,
}: UserCardProps) => {
  const navigate = useNavigate();
  const {
    touchStartXRef,
    touchEndXRef,
    didSwipeRef,
    handleSwipe,
    openFullScreen,
    getUserPhotoData,
  } = galleryData;

  const photoData = getUserPhotoData(user.id);

  // Touch handlers (kept for swipe functionality if needed, though simplified for now)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current[user.id] = e.touches[0].clientX;
    touchEndXRef.current[user.id] = e.touches[0].clientX;
    didSwipeRef.current[user.id] = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current[user.id] = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const startX = touchStartXRef.current[user.id] ?? 0;
    const endX = touchEndXRef.current[user.id] ?? 0;
    const deltaX = endX - startX;

    if (Math.abs(deltaX) > 50) {
      didSwipeRef.current[user.id] = true;
      if (deltaX < 0) handleSwipe(user.id, "left");
      else handleSwipe(user.id, "right");
      setTimeout(() => {
        didSwipeRef.current[user.id] = false;
      }, 0);
    }
  };

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Removed full screen open logic
    // if (didSwipeRef.current[user.id]) return;
    // openFullScreen(user.id);
  };

  const handleCardClick = () => {
    navigate({
      to: "/user-profile/$id",
      params: { id: user.id.toString() },
    });
    saveScrollPosition("people");
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoreClick();
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteClick();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
    >
      {/* Photo Section */}
      <div 
        className="relative h-[400px] w-full overflow-hidden bg-gray-100 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={getImageUrl(photoData.currentPhoto)}
          alt={user.name}
          className="h-full w-full object-cover transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        
        {/* Top Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
             <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleFavoriteClick}
                className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-colors",
                    isFavorite ? "bg-red-500/90 text-white" : "bg-black/20 text-white hover:bg-black/30"
                )}
             >
                <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
             </motion.button>
             
             <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleMoreClick}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md hover:bg-black/30"
             >
                <MoreHorizontal className="h-5 w-5" />
             </motion.button>
        </div>

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white pointer-events-none">
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-tight mb-1">
                        {user.name}, <span className="font-normal opacity-90">{user.age ?? 25}</span>
                    </h2>
                    
                    <div className="flex items-center gap-2 text-sm font-medium opacity-90 mb-3">
                        <div className={cn(
                            "h-2 w-2 rounded-full",
                            user.isOnline ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" : "bg-gray-400"
                        )} />
                        <span>{user.isOnline ? "Онлайн" : "Был(а) недавно"}</span>
                        {user.distance && (
                             <>
                                <span className="opacity-60">•</span>
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span>{user.distance} км</span>
                                </div>
                             </>
                        )}
                    </div>

                    {user.bio && (
                        <p className="line-clamp-2 text-sm text-white/80 leading-relaxed max-w-[90%]">
                            {user.bio}
                        </p>
                    )}
                </div>
            </div>

            {/* Photo Indicators */}
            {photoData.totalPhotos > 1 && (
                <div className="absolute top-4 left-4 flex gap-1">
                    {Array.from({ length: photoData.totalPhotos }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1 rounded-full transition-all duration-300",
                                i === photoData.currentIndex ? "w-6 bg-white" : "w-2 bg-white/40"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
};

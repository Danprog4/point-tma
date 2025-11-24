import { useNavigate } from "@tanstack/react-router";
import { Heart, MapPin, MoreHorizontal } from "lucide-react";
import { usePeopleGallery } from "~/hooks/usePeopleGallery";
import { cn } from "~/lib/utils";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";

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
    <div
      onClick={handleCardClick}
      className="relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 transition-shadow transition-transform duration-200 hover:shadow-md active:scale-[0.98]"
    >
      {/* Photo Section */}
      <div
        className="relative h-[400px] w-full touch-pan-y overflow-hidden bg-gray-100"
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* Top Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={handleFavoriteClick}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-colors transition-transform active:scale-90",
              isFavorite
                ? "bg-red-500/90 text-white"
                : "bg-black/20 text-white hover:bg-black/30",
            )}
          >
            <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
          </button>

          <button
            onClick={handleMoreClick}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-transform hover:bg-black/30 active:scale-90"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Bottom Info Overlay */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 p-5 text-white">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="mb-1 text-2xl leading-tight font-bold">
                {user.name},{" "}
                <span className="font-normal opacity-90">{user.age ?? 25}</span>
              </h2>

              <div className="mb-3 flex items-center gap-2 text-sm font-medium opacity-90">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    user.isOnline
                      ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"
                      : "bg-gray-400",
                  )}
                />
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
                <p className="line-clamp-2 max-w-[90%] text-sm leading-relaxed text-white/80">
                  {user.bio}
                </p>
              )}
            </div>
          </div>

          {/* Photo Indicators */}
          {photoData.allPhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1">
              {Array.from({ length: photoData.allPhotos.length }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === photoData.currentIndex ? "w-6 bg-white" : "w-2 bg-white/40",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

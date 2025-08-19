import { useNavigate } from "@tanstack/react-router";
import { usePeopleGallery } from "~/hooks/usePeopleGallery";
import { saveScrollPosition } from "~/lib/utils/scrollPosition";
import { UserInfo } from "./UserInfo";
import { UserPhoto } from "./UserPhoto";

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
      // Prevent immediate click after swipe
      setTimeout(() => {
        didSwipeRef.current[user.id] = false;
      }, 0);
    }
  };

  const handlePhotoClick = () => {
    if (didSwipeRef.current[user.id]) return;
    openFullScreen(user.id);
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoreClick();
  };

  const handleUserInfoClick = () => {
    navigate({
      to: "/user-profile/$id",
      params: { id: user.id.toString() },
    });
    saveScrollPosition("people");
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteClick();
  };

  return (
    <div key={user.id}>
      <div className="flex flex-col items-start justify-center">
        <UserPhoto
          user={user}
          photoData={photoData}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handlePhotoClick}
          onMoreClick={handleMoreClick}
        />

        <UserInfo
          user={user}
          isFavorite={isFavorite}
          onFavoriteClick={handleFavoriteClick}
          onClick={handleUserInfoClick}
        />
      </div>
    </div>
  );
};

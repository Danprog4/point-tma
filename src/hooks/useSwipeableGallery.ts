import { useRef, useState } from "react";

export const useSwipeableGallery = (photos: string[] = []) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
    didSwipe.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (Math.abs(distance) > minSwipeDistance) {
      didSwipe.current = true;
      if (isLeftSwipe) {
        nextPhoto();
      } else if (isRightSwipe) {
        prevPhoto();
      }
      // Reset swipe flag after a tick to allow click handlers to check it if needed immediately after
      setTimeout(() => {
        didSwipe.current = false;
      }, 0);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const nextPhoto = () => {
    if (photos.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    if (photos.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return {
    currentIndex,
    setCurrentIndex,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    nextPhoto,
    prevPhoto,
    currentPhoto: photos[currentIndex],
    didSwipe,
  };
};

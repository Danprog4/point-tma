import { useEffect, useRef, useState } from "react";

export const usePeopleGallery = (users: any[]) => {
  const [galleryPhotosByUserId, setGalleryPhotosByUserId] = useState<
    Record<number, string[]>
  >({});
  const [currentIndexByUserId, setCurrentIndexByUserId] = useState<
    Record<number, number>
  >({});
  const [selectedMainPhotoByUserId, setSelectedMainPhotoByUserId] = useState<
    Record<number, string | undefined>
  >({});

  // Full screen photo state
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenPhotos, setFullScreenPhotos] = useState<string[]>([]);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);

  // Touch handling refs
  const touchStartXRef = useRef<Record<number, number>>({});
  const touchEndXRef = useRef<Record<number, number>>({});
  const didSwipeRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    if (users) {
      setGalleryPhotosByUserId(
        users.reduce(
          (acc, u) => {
            acc[u.id] = u.gallery || [];
            return acc;
          },
          {} as Record<number, string[]>,
        ),
      );
      setCurrentIndexByUserId(
        users.reduce(
          (acc, u) => {
            acc[u.id] = 0;
            return acc;
          },
          {} as Record<number, number>,
        ),
      );
    }
  }, [users]);

  useEffect(() => {
    if (users) {
      setSelectedMainPhotoByUserId(
        users.reduce(
          (acc, u) => {
            acc[u.id] = u.photo || "";
            return acc;
          },
          {} as Record<number, string>,
        ),
      );
    }
  }, [users]);

  const handleSwipe = (userId: number, direction: "left" | "right") => {
    const allPhotos = [
      selectedMainPhotoByUserId[userId] ?? "",
      ...(galleryPhotosByUserId[userId] ?? []),
    ].filter(Boolean);

    if (allPhotos.length <= 1) return;

    const currentIndex = currentIndexByUserId[userId] ?? 0;
    const len = allPhotos.length;
    const nextIndex =
      direction === "left" ? (currentIndex + 1) % len : (currentIndex - 1 + len) % len;

    setCurrentIndexByUserId((prev) => ({ ...prev, [userId]: nextIndex }));
  };

  const openFullScreen = (userId: number) => {
    const allPhotos = [
      selectedMainPhotoByUserId[userId] ?? "",
      ...(galleryPhotosByUserId[userId] ?? []),
    ].filter(Boolean);

    const currentIndex = currentIndexByUserId[userId] ?? 0;
    const photosToShow = allPhotos.length > 0 ? allPhotos : [""]; // Empty string will trigger default image

    setFullScreenPhotos(photosToShow);
    setFullScreenIndex(currentIndex);
    setIsFullScreen(true);
  };

  const getUserPhotoData = (userId: number) => {
    const allPhotos = [
      selectedMainPhotoByUserId[userId] ?? "",
      ...(galleryPhotosByUserId[userId] ?? []),
    ].filter(Boolean);

    const currentIndex = currentIndexByUserId[userId] ?? 0;
    const currentPhoto = allPhotos[currentIndex] ?? "";
    const shouldShowImage = allPhotos.length > 0;
    const imageToShow = shouldShowImage ? currentPhoto : "";

    return {
      allPhotos,
      currentIndex,
      currentPhoto,
      shouldShowImage,
      imageToShow,
    };
  };

  return {
    galleryPhotosByUserId,
    currentIndexByUserId,
    selectedMainPhotoByUserId,
    isFullScreen,
    fullScreenPhotos,
    fullScreenIndex,
    touchStartXRef,
    touchEndXRef,
    didSwipeRef,
    setIsFullScreen,
    setFullScreenIndex,
    handleSwipe,
    openFullScreen,
    getUserPhotoData,
  };
};

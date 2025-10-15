import { ChevronLeft, ChevronRight, X as XIcon } from "lucide-react";
import { getImageUrl } from "~/lib/utils/getImageURL";

export const FullScreenPhoto = ({
  allPhotos,
  currentIndex,
  setCurrentIndex,
  setIsFullScreen,
}: any) => {
  return (
    <div className="relative">
      {" "}
      <div className="bg-opacity-90 fixed inset-0 top-[162px] bottom-[83px] z-[100000] flex items-center justify-center bg-black">
        <ChevronLeft
          className="absolute left-4 h-10 w-10 cursor-pointer text-white"
          onClick={() =>
            setCurrentIndex(
              (prev: number) => (prev - 1 + allPhotos.length) % allPhotos.length,
            )
          }
        />

        {(() => {
          const imgSrc = allPhotos[currentIndex];
          return (
            <img
              src={imgSrc.startsWith("data:image/") ? imgSrc : getImageUrl(imgSrc)}
              alt="Full view"
              className="max-h-full max-w-full object-contain"
            />
          );
        })()}

        {allPhotos.length > 1 && (
          <ChevronRight
            className="absolute right-4 h-10 w-10 cursor-pointer text-white"
            onClick={() =>
              setCurrentIndex((prev: number) => (prev + 1) % allPhotos.length)
            }
          />
        )}

        <XIcon
          className="absolute top-4 right-4 h-8 w-8 cursor-pointer text-white"
          onClick={() => setIsFullScreen(false)}
        />
      </div>
    </div>
  );
};

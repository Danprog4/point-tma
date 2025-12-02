import { Meet } from "~/db/schema";

interface MeetHeaderProps {
  isMobile: boolean;
  page: string;
  setPage: (page: string) => void;
  mainPhoto?: string;
  meeting?: Meet;
  getImageUrl: (photo: string) => string;
  setCurrentIndex: (index: number) => void;
  setIsFullScreen: (isFullScreen: boolean) => void;
  galleryPhotos: string[];
  setGalleryPhotos: (photos: string[] | ((prev: string[]) => string[])) => void;
  setMainPhoto: (photo: string) => void;
}

export const MeetHeader: React.FC<MeetHeaderProps> = ({
  isMobile,
  page,
  setPage,
  mainPhoto,
  meeting,

  getImageUrl,
  setCurrentIndex,
  setIsFullScreen,
  galleryPhotos,
  setGalleryPhotos,
  setMainPhoto,
}) => {
  return (
    <div data-mobile={isMobile} className="scrollbar-hidden overflow-y-auto">
      <div className="relative">
        <div className="relative h-[55vh] rounded-t-2xl">
          <img
            src={
              mainPhoto?.startsWith("data:image/")
                ? mainPhoto
                : getImageUrl(mainPhoto || meeting?.image || "")
            }
            alt={meeting?.name || ""}
            className="h-full w-full rounded-t-xl object-cover"
            onClick={() => {
              setCurrentIndex(0);
              setIsFullScreen(true);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-t-xl pointer-events-none" />
          <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-2 text-white">
            <div className="text-3xl font-bold leading-tight">{meeting?.name}</div>
            {meeting?.description && (
              <div className="line-clamp-2 text-sm text-gray-200/90">{meeting?.description}</div>
            )}
            
            <div className="flex flex-wrap items-center gap-3 pt-2">
               {meeting?.type && (
                <div className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/30">
                  {meeting?.type}
                </div>
               )}
               {meeting?.date && (
                 <div className="text-sm font-medium text-white/90">
                   {meeting.date}
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
      {galleryPhotos && galleryPhotos.length > 0 && (
        <div className="flex flex-col gap-3 py-6">
          <div className="px-6 text-lg font-bold text-gray-900">Галерея</div>
          <div className="scrollbar-hidden flex gap-3 overflow-x-auto px-6 pb-2">
            {galleryPhotos.map((img, idx) => (
              <img
                key={idx}
                src={img.startsWith("data:image/") ? img : getImageUrl(img)}
                alt=""
                className="h-24 w-24 flex-none cursor-pointer rounded-2xl object-cover shadow-sm transition-transform hover:scale-105 active:scale-95 ring-1 ring-black/5"
                onClick={() => {
                  setGalleryPhotos((prev) => {
                    const newGallery = prev.filter((i) => i !== img);
                    if (mainPhoto) newGallery.push(mainPhoto);
                    return newGallery;
                  });
                  setMainPhoto(img);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

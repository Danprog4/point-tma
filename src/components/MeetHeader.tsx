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
          <div className="absolute bottom-4 left-4 flex flex-col gap-2 text-white">
            <div className="text-2xl font-bold">{meeting?.name}</div>
            <div className="text-sm">{meeting?.description}</div>

            <div className="flex items-center justify-start gap-2">
              <div className="flex items-center justify-center rounded-full bg-[#DFD2EA] px-2 text-sm text-black">
                {meeting?.type}
              </div>
            </div>
            <div className="flex items-center justify-start">{meeting?.date}</div>
          </div>
        </div>
      </div>
      {galleryPhotos && galleryPhotos.length > 0 && (
        <div className="px-4 pt-2 pb-2 text-xl font-bold">Галерея</div>
      )}
      <div className="scrollbar-hidden flex gap-2 overflow-x-auto px-4">
        {galleryPhotos.map((img, idx) => (
          <img
            key={idx}
            src={img.startsWith("data:image/") ? img : getImageUrl(img)}
            alt=""
            className="h-20 w-20 cursor-pointer rounded-lg object-cover"
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
  );
};

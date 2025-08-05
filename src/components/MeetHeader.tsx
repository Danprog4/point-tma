interface MeetHeaderProps {
  isMobile: boolean;
  page: string;
  setPage: (page: string) => void;
  mainPhoto?: string;
  meeting?: {
    name?: string;
    description?: string;
    type?: string;
    image?: string;
    organizer?: {
      id?: number;
      name?: string;
      photo?: string;
    };
  };
  user?: {
    id?: number;
  };
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
  user,
  getImageUrl,
  setCurrentIndex,
  setIsFullScreen,
  galleryPhotos,
  setGalleryPhotos,
  setMainPhoto,
}) => {
  return (
    <div
      data-mobile={isMobile}
      className="scrollbar-hidden overflow-y-auto pt-18 data-[mobile=true]:pt-4"
    >
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
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full">
                <img
                  src={getImageUrl(meeting?.organizer?.photo || "")}
                  alt=""
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <div className="font-bold">{meeting?.organizer?.name}</div>
                <div className="text-sm text-white">
                  {user?.id === meeting?.organizer?.id ? "Вы организатор" : "Организатор"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 pt-2 text-xl font-bold">Галерея</div>
      <div className="scrollbar-hidden flex gap-2 overflow-x-auto px-4 pb-4">
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

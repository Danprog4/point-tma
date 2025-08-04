import { getImageUrl } from "~/lib/utils/getImageURL";
import { getInterestLabel } from "~/lib/utils/interestLabels";
import { useScroll } from "./hooks/useScroll";

interface ProfileMoreProps {
  user?: any;
  mainPhoto?: string;
  galleryPhotos: string[];
  age?: number;
  userSubscribersCount?: number;
  uniqueFriends: any[];
  isSubscribed: boolean;
  isFriend: boolean;
  isRequest: boolean;
  isFavorite: boolean;
  activeQuests?: any[];
  isClicked: boolean;
  setIsClicked: (value: boolean) => void;
  setCurrentIndex: (value: number) => void;
  setIsFullScreen: (value: boolean) => void;
  setGalleryPhotos: (updater: (prev: string[]) => string[]) => void;
  setMainPhoto: (photo: string) => void;
  handleToFavorites: () => void;
  handleSubscribe: () => void;
  handleRemoveFriend: () => void;
  handleSendRequest: () => void;
}

export const ProfileMore = ({
  user,
  mainPhoto,
  galleryPhotos,

  isClicked,
  setIsClicked,
  setCurrentIndex,
  setIsFullScreen,
  setGalleryPhotos,
  setMainPhoto,
}: ProfileMoreProps) => {
  useScroll();
  return (
    <>
      <div className="relative">
        <div className="relative h-[30vh] rounded-t-2xl">
          <div className="absolute top-4 right-4 z-10"></div>
          <img
            src={
              mainPhoto
                ? getImageUrl(mainPhoto)
                : user?.photo
                  ? getImageUrl(user?.photo ?? "")
                  : user?.photoUrl || ""
            }
            alt={user?.name || ""}
            className="h-full w-full rounded-2xl object-cover"
            onClick={() => {
              setIsClicked(!isClicked);
              setCurrentIndex(0);
              setIsFullScreen(true);
            }}
          />
        </div>
      </div>
      <div className="scrollbar-hidden mb-4 flex gap-2 overflow-x-auto px-4 pt-4">
        {galleryPhotos.map((img, idx) => (
          <img
            key={idx}
            src={img.startsWith("data:image/") ? img : getImageUrl(img || "")}
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

      <div className="w-full px-4">
        <div className="flex w-full flex-col items-start justify-between pb-4">
          <div className="flex w-full items-center justify-between">
            <h3 className="text-xl font-bold text-black">Обо мне</h3>
          </div>
          {user?.bio ? (
            <div className="text-sm text-black">{user.bio}</div>
          ) : (
            <div className="text-sm text-black">
              Этот пользователь пока не указал свое описание
            </div>
          )}
        </div>
      </div>

      <div className="mx-4">
        <div className="flex flex-col items-start justify-between py-3">
          <h3 className="text-xl font-bold text-black">Интересы</h3>
          {user?.interests &&
          Object.entries(user.interests).filter(([key, value]) => value).length > 0 ? (
            <div className="mt-2 grid w-full grid-cols-2 gap-2">
              {Object.entries(user.interests)
                .filter(([key, value]) => value)
                .map(([key, value]) => (
                  <div key={key} className="flex flex-col">
                    <div className="text-xs text-gray-500 capitalize">
                      {getInterestLabel(key)}
                    </div>
                    <div className="text-sm font-medium text-black">{String(value)}</div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-sm text-black">
              Этот пользователь пока не указал своих интересов
            </div>
          )}
        </div>
      </div>
    </>
  );
};

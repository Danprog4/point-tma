import { Heart } from "lucide-react";
import { cn } from "~/lib/utils";
import { formatDistance } from "~/lib/utils/calculateDistance";
import { getAge } from "~/lib/utils/getAge";

interface UserInfoProps {
  user: any;
  isFavorite: boolean;
  onFavoriteClick: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export const UserInfo = ({ user, isFavorite, onFavoriteClick, onClick }: UserInfoProps) => {
  return (
    <div onClick={onClick} className="w-full cursor-pointer">
      <div className="flex w-full items-center justify-between px-4 py-4">
        <div className="flex items-center justify-center gap-2">
          <div className="relative flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-purple-800 bg-purple-600">
              <span className="text-xl font-bold text-white">1</span>
            </div>
          </div>
          <div className="font-bold text-nowrap">
            {user.name} {user.surname}
          </div>
        </div>

        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50"
          onClick={onFavoriteClick}
        >
          <Heart
            className={cn(
              "h-6 w-6 text-black",
              isFavorite && "text-red-500",
            )}
          />
        </button>
      </div>
      
      <div className="flex w-full items-center justify-between px-4 pb-4">
        <div className="text-sm text-neutral-500">
          г. {user?.city}, {getAge(user?.birthday) || "не указано"}
        </div>
        <div className="flex items-center gap-2">
          {user.distance !== null && (
            <span className="text-sm font-medium text-blue-600">
              {formatDistance(user.distance)}
            </span>
          )}
          <div className="rounded-lg bg-[#FFF2BD] px-2 text-sm">
            Рейтинг 4.5
          </div>
        </div>
      </div>
      
      <div className="px-4">
        <div className="text-sm">
          {user.bio?.length && user.bio?.length > 100
            ? user.bio?.slice(0, 100) + "..."
            : user.bio || "не указано"}
        </div>
      </div>
    </div>
  );
};

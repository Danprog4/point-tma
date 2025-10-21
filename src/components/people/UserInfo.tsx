import { Heart, Mars, Venus } from "lucide-react";
import { cn } from "~/lib/utils";
import { formatDistance } from "~/lib/utils/calculateDistance";
import { getUserAge } from "~/lib/utils/getUserAge";

interface UserInfoProps {
  user: any;
  isFavorite: boolean;
  onFavoriteClick: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export const UserInfo = ({
  user,
  isFavorite,
  onFavoriteClick,
  onClick,
}: UserInfoProps) => {
  return (
    <div
      onClick={onClick}
      className="w-full cursor-pointer rounded-b-2xl bg-white shadow-md"
    >
      <div className="flex w-full items-center justify-between px-4 py-4">
        <div className="flex items-center justify-center gap-2">
          <div className="relative flex items-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-700 shadow-md ring-2 ring-purple-100">
              <span className="text-base font-bold text-white">1</span>
            </div>
          </div>
          <div className="font-bold text-nowrap text-gray-900">
            {user.name} {user.surname}
          </div>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition-all hover:bg-gray-200 active:scale-95"
          onClick={onFavoriteClick}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-colors",
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-600",
            )}
          />
        </button>
      </div>

      <div className="flex w-full items-center justify-between px-4 pb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>г. {user?.city}</span>
          <span className="text-gray-400">•</span>
          <span>{getUserAge(user?.birthday || "") || "не указано"}</span>
          <div>
            {user.sex === "male" ? (
              <Mars className="h-4 w-4 text-blue-500" />
            ) : (
              <Venus className="h-4 w-4 text-pink-500" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user.distance !== null && (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
              {formatDistance(user.distance)}
            </span>
          )}
          <div className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
            ⭐ 4.5
          </div>
        </div>
      </div>

      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm leading-relaxed text-gray-700">
          {user.bio?.length && user.bio?.length > 100
            ? user.bio?.slice(0, 100) + "..."
            : user.bio || "О себе не указано"}
        </p>
      </div>
    </div>
  );
};

import { usePeopleGallery } from "~/hooks/usePeopleGallery";
import { UserCard } from "./UserCard";

interface UsersListProps {
  users: any[];
  galleryData: ReturnType<typeof usePeopleGallery>;
  isFavorite: (userId: number) => boolean;
  onFavoriteClick: (userId: number) => void;
  onMoreClick: (userId: number) => void;
}

export const UsersList = ({
  users,
  galleryData,
  isFavorite,
  onFavoriteClick,
  onMoreClick,
}: UsersListProps) => {
  return (
    <div className="flex flex-col gap-6 pb-4 text-black">
      {users?.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          isFavorite={isFavorite(user.id)}
          onFavoriteClick={() => onFavoriteClick(user.id)}
          onMoreClick={() => onMoreClick(user.id)}
          galleryData={galleryData}
        />
      ))}
    </div>
  );
};

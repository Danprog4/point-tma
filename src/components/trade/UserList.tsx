import { User } from "~/db/schema";
import { getImage } from "~/lib/utils/getImage";

interface UserListProps {
  users: User[];
  title: string;
  titleColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  onUserSelect: (user: User) => void;
}

export default function UserList({
  users,
  title,
  titleColor,
  borderColor,
  bgColor,
  textColor,
  onUserSelect,
}: UserListProps) {
  if (users.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        {title === "Друзья"
          ? "У вас нет друзей для обмена"
          : "Не найдено пользователей по запросу"}
      </div>
    );
  }

  return (
    <div>
      <div className={`mb-2 px-2 text-sm font-bold uppercase ${titleColor}`}>{title}</div>
      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <button
            key={user.id}
            className={`hover:border-opacity-60 flex items-center gap-4 rounded-xl border px-5 py-3 shadow transition ${borderColor} ${bgColor}`}
            onClick={() => onUserSelect(user)}
          >
            <img
              src={getImage(user, "")}
              alt={user.name ?? ""}
              className={`h-10 w-10 rounded-full border object-cover ${borderColor}`}
            />
            <div className="flex flex-col items-start text-left">
              <span className={`font-semibold ${textColor}`}>
                {user.name} {user.surname}
              </span>
              <span className={`text-xs ${textColor.replace("900", "400")}`}>
                {user.login ? `${user.login}` : ""}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

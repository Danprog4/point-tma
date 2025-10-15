import { UserIcon } from "lucide-react";

interface UserSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function UserSearch({ search, onSearchChange }: UserSearchProps) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2">
      <UserIcon className="h-5 w-5 text-purple-400" />
      <input
        className="flex-1 bg-transparent text-purple-800 placeholder-purple-400 outline-none"
        placeholder="Поиск по имени или логину..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}

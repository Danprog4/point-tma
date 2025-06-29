import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Logo } from "./Icons/Logo";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4">
      <div className="flex w-20 items-center gap-4">
        <div className="flex items-center">
          <Logo />
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1">
        <div className="h-4 w-4 rounded-full bg-orange-400"></div>
        <span className="text-sm font-medium">0</span>
      </div>
      <div className="flex w-[81px] items-center justify-end gap-4">
        <button className="flex" onClick={() => navigate({ to: "/notif" })}>
          <Bell className="h-5 w-5 text-gray-700" />
        </button>
      </div>
    </header>
  );
};

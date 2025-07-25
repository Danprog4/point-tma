import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useTRPC } from "~/trpc/init/react";
import { Coin } from "./Icons/Coin";
import { Logo } from "./Icons/Logo";

export const Header = () => {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { data: notifications } = useQuery(trpc.main.getNotifications.queryOptions());
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  const splitBalanceToK = () => {
    if (user?.balance && user?.balance > 1000) {
      return (user?.balance / 1000).toFixed(user?.balance % 1000 === 0 ? 0 : 1);
    } else {
      return user?.balance;
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4">
      <div className="flex w-20 items-center gap-4">
        <div className="flex items-center">
          <Logo />
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1">
        <Coin />
        <span className="text-sm font-medium">{splitBalanceToK()}К</span>
      </div>
      <div className="flex w-[81px] items-center justify-end gap-4">
        {notifications && notifications.length > 0 ? (
          <button className="relative flex" onClick={() => navigate({ to: "/notif" })}>
            <Bell className="h-5 w-5 text-gray-700" />
            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {notifications.length}
            </div>
          </button>
        ) : (
          <button className="flex" onClick={() => navigate({ to: "/notif" })}>
            <Bell className="h-5 w-5 text-gray-700" />
          </button>
        )}
      </div>
    </header>
  );
};

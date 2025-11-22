import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { usePlatform } from "~/hooks/usePlatform";
import { useTRPC } from "~/trpc/init/react";
import { Coin } from "./Icons/Coin";
import { Logo } from "./Icons/Logo";

export const Header = () => {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { data: notifications } = useQuery(trpc.main.getNotifications.queryOptions());
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());

  const activeNotifications = notifications?.filter(
    (notification) => notification.isRead === false,
  );

  const splitBalanceToK = () => {
    if (user?.balance && user?.balance > 1000) {
      return (user?.balance / 1000).toFixed(user?.balance % 1000 === 0 ? 0 : 1);
    } else {
      return user?.balance;
    }
  };

  const isMobile = usePlatform();

  return (
    <header
      data-mobile={isMobile}
      className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-[#FAFAFA]/80 px-5 py-4 backdrop-blur-xl data-[mobile=true]:pt-28 supports-[backdrop-filter]:bg-[#FAFAFA]/60"
    >
      <div className="flex w-20 items-center gap-4">
        <div className="flex items-center">
          <Logo />
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-black/5">
        <Coin />
        <span className="text-sm font-bold text-gray-900">
          {splitBalanceToK()}
          {user?.balance && user?.balance > 1000 ? "К" : ""}
        </span>
      </div>
      <div className="flex w-[81px] items-center justify-end gap-4">
        {activeNotifications && activeNotifications.length > 0 ? (
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform active:scale-95"
            onClick={() => navigate({ to: "/notif" })}
          >
            <Bell className="h-5 w-5 text-gray-700" />
            <div className="absolute top-0 right-0 flex h-4 w-4 translate-x-1 -translate-y-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#FAFAFA]">
              {activeNotifications.length > 9 ? "9+" : activeNotifications.length}
            </div>
          </button>
        ) : (
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform active:scale-95"
            onClick={() => navigate({ to: "/notif" })}
          >
            <Bell className="h-5 w-5 text-gray-700" />
          </button>
        )}
      </div>
    </header>
  );
};

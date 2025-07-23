import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTRPC } from "~/trpc/init/react";
import { Main } from "./Icons/NavBar.tsx/Main";
import { Meet } from "./Icons/NavBar.tsx/Meet";
import { Profile } from "./Icons/NavBar.tsx/Profile";
import { Quests } from "./Icons/NavBar.tsx/Quests";

export const Navbar = () => {
  const trpc = useTRPC();
  const pathname = useLocation();
  const navigate = useNavigate();
  const { data: requests } = useQuery(trpc.friends.getRequests.queryOptions());
  const activeRequests = requests?.filter((request) => request.status === "pending");
  const { data: meetRequests } = useQuery(trpc.meetings.getRequests.queryOptions());
  const activeMeetRequests = meetRequests?.filter(
    (request) => request.status === "pending",
  );
  const [active, setActive] = useState<string>("");

  const isRender =
    pathname.pathname === "/profile" ||
    pathname.pathname === "/quests" ||
    pathname.pathname === "/meetings" ||
    pathname.pathname === "/";

  useEffect(() => {
    setActive(pathname.pathname);
  }, [pathname]);

  return (
    <>
      {isRender ? (
        <div className="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white px-4 py-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex flex-col items-center px-4 py-2"
            >
              <div className="mb-1 h-6 w-6">
                <Main />
              </div>
              <span
                className={`text-xs font-medium ${active === "/" ? "text-gray-900" : "text-gray-400"}`}
              >
                Афиша
              </span>
              <div className="mt-1 h-0.5 w-8">
                {active === "/" && (
                  <div className="h-full w-full rounded-full bg-purple-600"></div>
                )}
              </div>
            </button>
            <button
              onClick={() => navigate({ to: "/meetings" })}
              className="flex flex-col items-center px-4 py-2"
            >
              {activeMeetRequests && activeMeetRequests?.length > 0 ? (
                <div className="relative mb-1 h-6 w-6">
                  <Meet />
                  <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></div>
                </div>
              ) : (
                <div className="mb-1 h-6 w-6">
                  <Meet />
                </div>
              )}
              <span
                className={`text-xs font-medium ${active === "/meetings" ? "text-gray-900" : "text-gray-400"}`}
              >
                Встречи
              </span>
              <div className="mt-1 h-0.5 w-8">
                {active === "/meetings" && (
                  <div className="h-full w-full rounded-full bg-purple-600"></div>
                )}
              </div>
            </button>
            <button
              onClick={() => navigate({ to: "/quests" })}
              className="flex flex-col items-center px-4 py-2"
            >
              <div className="mb-1 h-6 w-6">
                <Quests />
              </div>
              <span
                className={`text-xs font-medium ${active === "/quests" ? "text-gray-900" : "text-gray-400"}`}
              >
                Квесты
              </span>
              <div className="mt-1 h-0.5 w-8">
                {active === "/quests" && (
                  <div className="h-full w-full rounded-full bg-purple-600"></div>
                )}
              </div>
            </button>
            <button
              onClick={() => navigate({ to: "/profile" })}
              className="flex flex-col items-center px-4 py-2"
            >
              <div className="mb-1 h-6 w-6">
                {activeRequests && activeRequests?.length > 0 ? (
                  <div className="relative">
                    <Profile />
                    <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></div>
                  </div>
                ) : (
                  <Profile />
                )}
              </div>
              <span
                className={`text-xs font-medium ${active === "/profile" ? "text-gray-900" : "text-gray-400"}`}
              >
                Профиль
              </span>
              <div className="mt-1 h-0.5 w-8">
                {active === "/profile" && (
                  <div className="h-full w-full rounded-full bg-purple-600"></div>
                )}
              </div>
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};

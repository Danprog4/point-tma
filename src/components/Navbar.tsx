import { useLocation, useNavigate } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";

export const Navbar = () => {
  const pathname = useLocation();
  const navigate = useNavigate();

  const [active, setActive] = useState<string>("");

  useEffect(() => {
    setActive(pathname.pathname);
  }, [pathname]);

  if (pathname.pathname === "/onboarding") {
    return null;
  }

  return (
    <div className="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white px-4 py-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex flex-col items-center px-4 py-2"
        >
          <div className="relative mb-1 h-6 w-6">
            <div className="grid grid-cols-3 gap-px">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-1 rounded-sm ${active === "/" ? "bg-gray-900" : "bg-gray-400"}`}
                ></div>
              ))}
            </div>
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
          <Calendar
            className={`mb-1 h-6 w-6 ${active === "/meetings" ? "text-gray-900" : "text-gray-400"}`}
          />
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
          <div
            className={`mb-1 h-6 w-6 rounded ${active === "/quests" ? "bg-gray-900" : "bg-gray-400"}`}
          ></div>
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
          <div
            className={`mb-1 h-6 w-6 rounded ${active === "/profile" ? "bg-gray-900" : "bg-gray-400"}`}
          ></div>
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
  );
};

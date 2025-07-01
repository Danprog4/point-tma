import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/fill-profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col px-4">
      <header>
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="absolute top-4 left-4 flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex items-center justify-center p-4 pb-2">
          <div className="flex-1">
            <h1 className="text-center text-base font-bold text-gray-800">
              Заполнение профиля
            </h1>
          </div>
        </div>
      </header>
      <div className="mt-4 flex-1 rounded-sm rounded-tl-2xl bg-[#DEB8FF] px-4 py-2">
        <div className="flex flex-col gap-2">
          <div>Заполенность профиля 0%</div>
          <div className="h-2 w-full rounded-full bg-white"></div>
        </div>
      </div>
    </div>
  );
}

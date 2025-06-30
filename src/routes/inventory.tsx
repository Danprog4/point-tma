import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/inventory")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="relative flex items-center justify-center p-4 pb-10">
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="absolute left-4 flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-base font-bold text-gray-800">Инвентарь</h1>
      </div>
      <div className="mx-auto text-center text-gray-800">Ваш инвентарь пока пуст</div>
    </div>
  );
}

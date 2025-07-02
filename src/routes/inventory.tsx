import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/inventory")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const navigate = useNavigate();
  const getQuest = useQuery(trpc.quest.getMyQuests.queryOptions());

  if (!user?.inventory) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-gray-500">Ваш инвентарь пока пуст</div>
      </div>
    );
  }

  const quests = getQuest.data?.filter(
    (quest) =>
      user.inventory &&
      quest.id === user?.inventory.find((item) => item.type === "ticket")?.questId,
  );

  return (
    <div>
      <div className="relative flex items-center justify-center p-4">
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="absolute left-4 flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-base font-bold text-gray-800">Инвентарь</h1>
      </div>
      <div className="px-4 text-start text-gray-500">
        {quests?.map((quest) => <div key={quest.id}>{quest.id}</div>)}
      </div>
    </div>
  );
}

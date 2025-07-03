import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { questsData } from "~/config/quests";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/inventory")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const navigate = useNavigate();

  if (!user?.inventory) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-gray-500">Ваш инвентарь пока пуст</div>
      </div>
    );
  }

  const tickets = user.inventory.filter((item) => item.type === "ticket");

  const inactiveTickets = tickets.filter((ticket) => !ticket.isActive);

  const getQuest = (questId: number) => {
    return questsData.find((quest) => quest.id === questId);
  };

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
      {inactiveTickets.length > 0 ? (
        <div className="grid grid-cols-3 gap-4 px-4">
          {inactiveTickets.map((ticket) => (
            <div
              key={ticket.questId}
              className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-[#DEB8FF] p-4"
              onClick={() => {
                navigate({ to: `/quest/${ticket.questId}` });
              }}
            >
              <img
                src={getQuest(ticket.questId)?.image}
                alt={getQuest(ticket.questId)?.title}
                className="h-[61px] w-[61px] rounded-lg"
              />

              <div className="text-center text-sm font-bold text-nowrap text-[#A35700]">
                Билет на квест
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 text-start text-gray-500">Ваш инвентарь пока пуст</div>
      )}
    </div>
  );
}

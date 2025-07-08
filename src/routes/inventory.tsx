import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getEventData } from "~/lib/utils/getEventData";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/inventory")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const navigate = useNavigate();

  const tickets = user?.inventory?.filter((item) => item.type === "ticket") ?? [];

  const inactiveTickets = tickets.filter((ticket) => !ticket.isActive);

  const getEvent = (eventId: number, name: string) => {
    return getEventData(name, eventId);
  };

  return (
    <div>
      <div className="z-10 flex items-center justify-between p-4 pb-2">
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <div className="flex-1">
          <h1 className="text-center text-base font-bold text-gray-800">Инвентарь</h1>
        </div>
      </div>
      {inactiveTickets.length > 0 ? (
        <div className="grid grid-cols-3 gap-4 px-4">
          {inactiveTickets.map((ticket) => (
            <div
              key={ticket.eventId}
              className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-[#DEB8FF] p-4"
              onClick={() => {
                navigate({ to: `/event/${ticket.name}/${ticket.eventId}` });
              }}
            >
              <img
                src={getEvent(ticket.eventId, ticket.name)?.image}
                alt={getEvent(ticket.eventId, ticket.name)?.title}
                className="h-[61px] w-[61px] rounded-lg"
              />

              <div className="text-center text-sm font-bold text-nowrap text-[#A35700]">
                Билет {getEvent(ticket.eventId, ticket.name)?.category}
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

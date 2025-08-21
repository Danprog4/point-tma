import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { usePlatform } from "~/hooks/usePlatform";
import { getEventData } from "~/lib/utils/getEventData";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/inventory")({
  component: RouteComponent,
});

// Тип для сгруппированного билета
type GroupedTicket = {
  eventId: number;
  name: string;
  type: string;
  count: number;
  isActive: boolean;
};

function RouteComponent() {
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const navigate = useNavigate();

  const tickets = user?.inventory?.filter((item) => item.type === "ticket") ?? [];

  const inactiveTickets = tickets.filter((ticket) => !ticket.isActive);

  // Функция для группировки билетов
  const groupTickets = (tickets: typeof inactiveTickets): GroupedTicket[] => {
    const groupedMap = new Map<string, GroupedTicket>();

    tickets.forEach((ticket) => {
      const key = `${ticket.eventId}-${ticket.name}`;

      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.count += 1;
      } else {
        groupedMap.set(key, {
          eventId: ticket.eventId,
          name: ticket.name,
          type: ticket.type,
          count: 1,
          isActive: ticket.isActive || false,
        });
      }
    });

    return Array.from(groupedMap.values());
  };

  const groupedTickets = groupTickets(inactiveTickets);

  const getEvent = (eventId: number, name: string) => {
    return getEventData(name, eventId);
  };

  const isMobile = usePlatform();

  return (
    <div
      data-mobile={isMobile}
      className="mx-auto min-h-screen w-full max-w-sm bg-white pb-24 data-[mobile=true]:pt-40"
    >
      {/* Header */}
      <div
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          onClick={() => navigate({ to: "/profile" })}
          className="flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-center text-base font-bold text-gray-800">Инвентарь</h1>

        <button className="flex h-6 w-6 items-center justify-center"></button>
      </div>
      {groupedTickets.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {groupedTickets.map((ticket) => (
            <div
              key={`${ticket.eventId}-${ticket.name}`}
              className="relative flex aspect-square flex-col items-center justify-center rounded-2xl bg-[#DEB8FF] p-4"
              onClick={() => {
                navigate({ to: `/event/${ticket.name}/${ticket.eventId}` });
              }}
            >
              {/* Бейдж с количеством билетов */}
              {ticket.count > 1 && (
                <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {ticket.count}
                </div>
              )}

              <img
                src={getEvent(ticket.eventId, ticket.name)?.image}
                alt={getEvent(ticket.eventId, ticket.name)?.title}
                className="h-[61px] w-[61px] rounded-lg"
              />

              <div className="text-center text-xs font-bold text-[#A35700]">
                {getEventData(ticket.name, ticket.eventId)?.category === "Квест"
                  ? "Билет на квест"
                  : "Ваучер"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-start text-gray-500">Ваш инвентарь пока пуст</div>
      )}
    </div>
  );
}

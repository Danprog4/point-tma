import { useQuery } from "@tanstack/react-query";
import { Event } from "~/db/schema";
import { useTRPC } from "~/trpc/init/react";

export const Inventory = ({
  setSelectedInventory,
  setIsInventoryOpen,
  selectedInventory,
}: {
  setSelectedInventory: (item: string[]) => void;
  setIsInventoryOpen: (isInventoryOpen: boolean) => void;
  selectedInventory: string[];
}) => {
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const { data: events } = useQuery(trpc.event.getEvents.queryOptions());
  const tickets = user?.inventory?.filter((item) => item.type === "ticket") ?? [];

  const inactiveTickets = tickets.filter((ticket) => !ticket.isActive);

  const getEvent = (eventId: number, name: string) => {
    return events?.find(
      (event) => event.id === eventId && event.category === name,
    ) as Event;
  };

  return (
    <div>
      {inactiveTickets.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {inactiveTickets
            .filter((ticket) => !selectedInventory.includes(ticket.id?.toString() ?? ""))
            .map((ticket) => (
              <div
                key={ticket.id}
                className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-[#DEB8FF] p-4"
                onClick={() => {
                  setSelectedInventory([
                    ...selectedInventory,
                    ticket.id?.toString() ?? "",
                  ]);
                  setIsInventoryOpen(false);
                }}
              >
                <img
                  src={getEvent(ticket.eventId, ticket.name)?.image ?? ""}
                  alt={getEvent(ticket.eventId, ticket.name)?.title ?? ""}
                  className="h-[61px] w-[61px] rounded-lg"
                />

                <div className="text-center text-sm font-bold text-nowrap text-[#A35700]">
                  {getEvent(ticket.eventId, ticket.name)?.category === "Квест"
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
};

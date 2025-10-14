import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import KeyDrawer from "~/components/KeyDrawer";
import { usePlatform } from "~/hooks/usePlatform";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/inventory")({
  component: RouteComponent,
});

// Тип для сгруппированного билета
type GroupedTicket = {
  eventId?: number;
  name?: string;
  caseId?: number;
  type: string;
  count: number;
  isActive: boolean;
};

function RouteComponent() {
  const trpc = useTRPC();
  const { data: user } = useQuery(trpc.main.getUser.queryOptions());
  const navigate = useNavigate();
  const { data: events } = useQuery(trpc.event.getEvents.queryOptions());
  const [selectedKey, setSelectedKey] = useState<any>(null);
  const [isKeyDrawerOpen, setIsKeyDrawerOpen] = useState(false);

  const { data: cases } = useQuery(trpc.cases.getCases.queryOptions());

  const getCase = (caseId: number) => {
    return cases?.find((c) => c.id === caseId);
  };

  const inactiveTickets = user?.inventory?.filter((ticket) => !ticket.isActive);

  // Функция для группировки билетов
  const groupTickets = (tickets: typeof inactiveTickets): GroupedTicket[] => {
    const groupedMap = new Map<string, GroupedTicket>();

    tickets?.forEach((ticket) => {
      // Создаем уникальный ключ для группировки
      let key: string;

      if (ticket.type === "case") {
        // Для кейсов группируем по типу и ID кейса
        const caseId = ticket.caseId || ticket.id;
        key = `${ticket.type}-${caseId || "no-case"}`;
      } else if (ticket.type === "key") {
        // Для ключей группируем по типу и ID кейса
        key = `${ticket.type}-${ticket.caseId || "no-case"}`;
      } else {
        // Для остальных типов используем старую логику
        key = `${ticket.type}-${ticket.eventId || "no-event"}-${ticket.name || "no-name"}`;
      }

      console.log(ticket, "ticket", "key:", key);

      if (groupedMap.has(key)) {
        const existing = groupedMap.get(key)!;
        existing.count += 1;
      } else {
        groupedMap.set(key, {
          eventId: ticket.eventId,
          name: ticket.name,
          caseId: ticket.caseId || ticket.id,
          type: ticket.type,
          count: 1,
          isActive: ticket.isActive || false,
        });
      }
    });

    return Array.from(groupedMap.values());
  };

  const groupedTickets = groupTickets(inactiveTickets);

  const getEvent = (eventId?: number, name?: string, type?: string, caseId?: number) => {
    if (type === "case") {
      // For cases, we need to find by the actual case ID, not eventId
      const actualCaseId = caseId || eventId;
      const caseData = cases?.find((c) => c.id === actualCaseId);
      console.log(caseData, "caseData", "actualCaseId:", actualCaseId);
      return caseData;
    }
    if (type === "key" && caseId) {
      const caseData = cases?.find((c) => c.id === caseId);
      console.log(caseData, "caseData for key");
      return caseData;
    }
    if (eventId && name) {
      return events?.find((event) => event.id === eventId && event.category === name);
    }
    return null;
  };

  console.log(groupedTickets, "groupedTickets");
  console.log(user?.inventory, "user inventory");
  console.log(cases, "cases data");

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
          {groupedTickets.map((ticket, index) => {
            const eventData = getEvent(
              ticket.eventId,
              ticket.name,
              ticket.type,
              ticket.caseId,
            );
            const isCase = ticket.type === "case";
            const isKey = ticket.type === "key";

            return (
              <div
                key={`${ticket.type}-${ticket.eventId || "no-event"}-${ticket.name || "no-name"}-${ticket.caseId || "no-case"}-${index}`}
                className="relative flex aspect-square flex-col items-center justify-center rounded-2xl bg-[#DEB8FF] p-4"
                onClick={() => {
                  if (isKey) {
                    // Для ключей открываем KeyDrawer
                    setSelectedKey(ticket);
                    setIsKeyDrawerOpen(true);
                  } else if (isCase) {
                    // Для кейсов используем правильный ID
                    const actualCaseId = ticket.caseId || ticket.eventId;
                    if (actualCaseId) {
                      navigate({ to: `/case/${actualCaseId}` });
                    }
                  } else if (ticket.eventId && ticket.name) {
                    navigate({ to: `/event/${ticket.name}/${ticket.eventId}` });
                  }
                }}
              >
                {/* Бейдж с количеством билетов */}
                {ticket.count > 1 && (
                  <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {ticket.count}
                  </div>
                )}

                <img
                  src={
                    isCase || isKey
                      ? (eventData as any)?.photo?.startsWith("/")
                        ? (eventData as any).photo
                        : (getImageUrl((eventData as any)?.photo) ?? "/fallback.png")
                      : ((eventData as any)?.image ?? "/fallback.png")
                  }
                  alt={
                    isCase || isKey
                      ? ((eventData as any)?.name ?? "Кейс")
                      : ((eventData as any)?.title ?? "Предмет")
                  }
                  className="h-[61px] w-[61px] rounded-lg object-cover"
                />

                <div className="text-center text-xs font-bold text-[#A35700]">
                  {ticket.type === "ticket" && (eventData as any)?.category === "Квест"
                    ? "Квест"
                    : isCase
                      ? "Кейс"
                      : isKey
                        ? "Ключ"
                        : "Ваучер"}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-start text-gray-500">Ваш инвентарь пока пуст</div>
      )}

      {/* KeyDrawer для ключей */}
      {selectedKey && (
        <KeyDrawer
          open={isKeyDrawerOpen}
          onOpenChange={setIsKeyDrawerOpen}
          keyData={selectedKey}
          caseData={selectedKey.caseId ? getCase(selectedKey.caseId) : undefined}
        >
          <div />
        </KeyDrawer>
      )}
    </div>
  );
}

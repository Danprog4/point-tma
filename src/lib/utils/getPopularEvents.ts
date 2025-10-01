import { inArray } from "drizzle-orm";
import { db } from "~/db";
import { eventsTable } from "~/db/schema";

export const getPopularEvents = async () => {
  const users = await db.query.usersTable.findMany({});
  const activeEvents = await db.query.activeEventsTable.findMany({});

  const userInventories = users.map((user) => user.inventory).flat();

  // Count tickets by eventId + category combination
  const ticketCounts: Record<string, number> = {};
  userInventories.forEach((inventory) => {
    if (inventory?.type === "ticket" && inventory?.eventId && inventory?.name) {
      const key = `${inventory.eventId}-${inventory.name}`;
      ticketCounts[key] = (ticketCounts[key] || 0) + 1;
    }
  });

  // Count active events by eventId + category combination
  const activeEventCounts: Record<string, number> = {};
  activeEvents.forEach((activeEvent) => {
    if (activeEvent?.eventId && activeEvent?.name) {
      const key = `${activeEvent.eventId}-${activeEvent.name}`;
      activeEventCounts[key] = (activeEventCounts[key] || 0) + 1;
    }
  });

  // Combine counts from tickets and active events
  const combinedCounts: Record<string, number> = {};

  // Add ticket counts
  Object.entries(ticketCounts).forEach(([key, count]) => {
    combinedCounts[key] = (combinedCounts[key] || 0) + count;
  });

  // Add active event counts
  Object.entries(activeEventCounts).forEach(([key, count]) => {
    combinedCounts[key] = (combinedCounts[key] || 0) + count;
  });

  // Sort by popularity and take top 20
  const sortedEvents = Object.entries(combinedCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([key, count]) => {
      const [eventId, category] = key.split("-");
      return {
        eventId: Number(eventId),
        category,
        count,
      };
    });

  const filteredEvents = await db.query.eventsTable.findMany({
    where: inArray(
      eventsTable.id,
      sortedEvents.map((event) => event.eventId),
    ),
  });

  return filteredEvents;
};

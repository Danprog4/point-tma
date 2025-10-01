import { desc } from "drizzle-orm";
import { db } from "~/db";
import { eventsTable } from "~/db/schema";

export const getNewEvents = async () => {
  const events = await db.query.eventsTable.findMany({
    orderBy: [desc(eventsTable.createdAt)],
  });

  return events.slice(0, 20);
};

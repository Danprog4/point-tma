import { db } from "~/db";
import { loggingTable } from "~/db/schema";

type LogParams = {
  userId: number;
  type: string;
  amount?: number | null;
  eventId?: number | null;
  meetId?: number | null;
  caseId?: number | null;
  itemId?: number | null;
  keyId?: number | null;
};

export async function logAction(params: LogParams): Promise<void> {
  const { userId, type, amount, eventId, meetId, caseId, itemId, keyId } = params;
  try {
    await db.insert(loggingTable).values({
      userId,
      type,
      amount: amount ?? null,
      eventId: eventId ?? null,
      meetId: meetId ?? null,
      caseId: caseId ?? null,
      itemId: itemId ?? null,
      keyId: keyId ?? null,
    });
  } catch (error) {
    // Non-blocking: swallow logging errors to not affect main flow
    console.error("Failed to write log entry", { error, params });
  }
}

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { casesTable } from "~/db/schema";
import { createTRPCRouter, procedure } from "./init";

export const casesRouter = createTRPCRouter({
  getCases: procedure.query(async () => {
    const cases = await db.query.casesTable.findMany();
    return cases;
  }),

  getCase: procedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const caseData = await db.query.casesTable.findFirst({
      where: eq(casesTable.id, input.id),
    });
    if (!caseData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Case not found",
      });
    }
    return caseData;
  }),
});

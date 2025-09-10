import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { casesTable, usersTable } from "~/db/schema";
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

  getKeys: procedure.query(async () => {
    const keys = await db.query.keysTable.findMany();
    return keys;
  }),

  buyCase: procedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const caseData = await db.query.casesTable.findFirst({
        where: eq(casesTable.id, input.caseId),
      });

      if (!caseData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found",
        });
      }

      if (user.balance! < caseData.price!) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not enough balance",
        });
      }

      await db
        .update(usersTable)
        .set({
          inventory: [...(user.inventory || []), { type: "case", eventId: input.caseId }],
          balance: user.balance! - caseData.price!,
        })
        .where(eq(usersTable.id, ctx.userId));
    }),

  openCase: procedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Реализовать открытие кейса
      // 1. Проверить наличие кейса в инвентаре
      // 2. Удалить кейс из инвентаря
      // 3. Выдать случайную награду
      console.log("Открытие кейса:", input.caseId, "пользователем:", ctx.userId);
      return { success: true, reward: "Ключ для золотого кейса" };
    }),
});

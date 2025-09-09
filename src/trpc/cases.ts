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

  getKeys: procedure.query(async () => {
    const keys = await db.query.keysTable.findMany();
    return keys;
  }),

  buyCase: procedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Реализовать покупку кейса
      // 1. Проверить баланс пользователя
      // 2. Списть монеты
      // 3. Добавить кейс в инвентарь пользователя
      console.log("Покупка кейса:", input.caseId, "пользователем:", ctx.userId);
      return { success: true };
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

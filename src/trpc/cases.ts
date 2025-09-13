import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/db";
import { casesTable, usersTable } from "~/db/schema";
import { getItem } from "~/lib/utils/getItem";
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
    .input(
      z.object({
        caseId: z.number(),
        eventId: z.number().nullable(),
        eventType: z.string().nullable(),
      }),
    )
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
          inventory: [
            ...(user.inventory || []),
            {
              id: input.caseId,
              type: "case",
              eventId: input.eventId ?? undefined,
              eventType: input.eventType || caseData.eventType || "",
            },
          ],
          balance: user.balance! - caseData.price!,
        })
        .where(eq(usersTable.id, ctx.userId));
    }),

  openCase: procedure
    .input(
      z.object({
        caseId: z.number(),
        eventType: z.string().nullable(),
        eventId: z.number().nullable(),
      }),
    )
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

      let caseInInventory: any;

      if (input.eventType && input.eventId) {
        caseInInventory = user.inventory?.find(
          (item) =>
            item.type === "case" &&
            item.eventId === input.eventId &&
            item.eventType === input.eventType,
        );
      } else if (!input.eventType && !input.eventId) {
        caseInInventory = user.inventory?.find(
          (item) => item.type === "case" && item.id === input.caseId,
        );
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Case not found in inventory",
        });
      }

      // 2. Получаем случайный предмет из кейса
      const reward = await getItem(input.caseId, ctx.userId);

      if (!reward) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate reward",
        });
      }

      // 3. Обновляем инвентарь: удаляем кейс и добавляем награду
      const updatedInventory = user.inventory
        ?.filter((item, index) => {
          if (input.eventId && input.eventType) {
            const firstMatchIndex = user.inventory?.findIndex(
              (inv) => inv.type === "case" && inv.eventId === input.caseId,
            );
            return !(
              item.type === "case" &&
              item.eventId === input.caseId &&
              index === firstMatchIndex
            );
          } else if (!input.eventId && !input.eventType) {
            const firstMatchIndex = user.inventory?.findIndex(
              (inv) => inv.type === "case" && inv.id === input.caseId,
            );
            return !(
              item.type === "case" &&
              item.id === input.caseId &&
              index === firstMatchIndex
            );
          }
        })
        .concat([reward]);

      await db
        .update(usersTable)
        .set({
          inventory: updatedInventory,
        })
        .where(eq(usersTable.id, ctx.userId));

      return {
        success: true,
        reward: {
          type: reward.type,
          value: reward.value,
          rarity: reward.rarity,
          id: reward.id,
        },
      };
    }),
});

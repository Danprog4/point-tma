import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { questsData } from "~/config/quests";
import { db } from "~/db";
import { activeQuestsTable, usersTable } from "~/db/schema";
import { createTRPCRouter, procedure } from "./init";

export const questRouter = createTRPCRouter({
  getMyQuests: procedure.query(async ({ ctx }) => {
    const quests = await db.query.activeQuestsTable.findMany({
      where: eq(activeQuestsTable.userId, ctx.userId),
    });
    return quests;
  }),

  buyQuest: procedure
    .input(
      z.object({
        questId: z.number(),
      }),
    )

    .mutation(async ({ ctx, input }) => {
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const questData = questsData.find((quest) => quest.id === input.questId);

      if (!questData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quest not found",
        });
      }

      if (user.balance! < questData.price) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not enough balance",
        });
      }

      const quest = await db
        .insert(activeQuestsTable)
        .values({
          userId: ctx.userId,
          isCompleted: false,
        })
        .returning();

      await db
        .update(usersTable)
        .set({
          inventory: [
            ...(user.inventory || []),
            { type: "ticket", questId: quest[0].id, isActive: false },
          ],
        })
        .where(eq(usersTable.id, ctx.userId));
    }),
});

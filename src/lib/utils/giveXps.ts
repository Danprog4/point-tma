import { eq } from "drizzle-orm";
import { levelsConfig } from "~/config/levels";
import { db } from "~/db";
import { User, usersTable } from "~/db/schema";

export const giveXps = async (userId: number, user: User, xp: number) => {
  await db
    .update(usersTable)
    .set({
      xp: (user.xp ?? 0) + xp,
    })
    .where(eq(usersTable.id, userId));

  const updatedUser = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
  });

  if (!updatedUser) return;

  let currentLevel = updatedUser.level ?? 1;
  let currentXp = updatedUser.xp ?? 0;

  while (true) {
    const levelConfig = levelsConfig.find((level) => level.level === currentLevel);
    if (!levelConfig || currentXp < levelConfig.xpToNextLevel) break;

    currentLevel += 1;
    currentXp -= levelConfig.xpToNextLevel;
  }

  if (currentLevel !== updatedUser.level) {
    await db
      .update(usersTable)
      .set({
        level: currentLevel,
        xp: currentXp,
      })
      .where(eq(usersTable.id, userId));
  }
};

export function calculateStreak(user: {
  lastCheckIn?: Date | string | null;
  checkInStreak?: number | null;
}): number {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const lastCheck = user.lastCheckIn ? new Date(user.lastCheckIn) : undefined;

  let newStreak = 1;
  if (lastCheck) {
    const lastStart = new Date(
      lastCheck.getFullYear(),
      lastCheck.getMonth(),
      lastCheck.getDate(),
    );
    if (lastStart.getTime() === startOfToday.getTime()) {
      // already checked in today
      newStreak = user.checkInStreak ?? 1;
    } else if (lastStart.getTime() === startOfYesterday.getTime()) {
      // consecutive day
      const currentStreak = user.checkInStreak ?? 0;
      // Если стрик был 10, сбрасываем на 1 (начинаем цикл заново)
      newStreak = currentStreak >= 10 ? 1 : currentStreak + 1;
    } else {
      // missed a day → reset
      newStreak = 1;
    }
  }

  return newStreak;
}

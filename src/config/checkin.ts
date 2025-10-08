export type DailyReward = { type: "xp" | "points" | "case" | "key"; value: number };

// 10-day reward track; day index = (streak - 1) % 10
export const DAILY_REWARDS: DailyReward[] = [
  { type: "xp", value: 50 },
  { type: "points", value: 100 },
  { type: "xp", value: 75 },
  { type: "points", value: 150 },
  { type: "xp", value: 100 },
  { type: "points", value: 200 },
  { type: "xp", value: 150 },
  { type: "points", value: 250 },
  { type: "xp", value: 200 },
  { type: "points", value: 300 },
];

export function getRewardForStreak(streak: number): DailyReward {
  const idx =
    (((streak - 1) % DAILY_REWARDS.length) + DAILY_REWARDS.length) % DAILY_REWARDS.length;
  return DAILY_REWARDS[idx];
}

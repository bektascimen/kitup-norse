type Args = {
  lastActiveDate: string | null;
  currentStreak: number;
  today: string; // YYYY-MM-DD
};

export function nextStreak(args: Args): { currentStreak: number; longestDelta: number } {
  if (!args.lastActiveDate) return { currentStreak: 1, longestDelta: 1 };
  if (args.lastActiveDate === args.today) {
    return { currentStreak: args.currentStreak, longestDelta: 0 };
  }
  const last = new Date(args.lastActiveDate + 'T00:00:00Z').getTime();
  const today = new Date(args.today + 'T00:00:00Z').getTime();
  const diffDays = Math.round((today - last) / 86_400_000);
  if (diffDays === 1) {
    return { currentStreak: args.currentStreak + 1, longestDelta: 1 };
  }
  return { currentStreak: 1, longestDelta: 0 };
}

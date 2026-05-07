import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { nextStreak } from './calc';

/**
 * Local calendar date in YYYY-MM-DD. Using UTC here was wrong: a learner
 * in UTC-08 finishing at 23:00 their time gets a UTC date of "tomorrow",
 * which means their next-day session compares as the same calendar day
 * and the streak never advances.
 */
function localToday(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function bumpStreakForToday(): Promise<void> {
  const userId = useAuthStore.getState().session?.user.id;
  if (!userId) return;
  const today = localToday();

  const { data: cur } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const { currentStreak, longestDelta: _longestDelta } = nextStreak({
    lastActiveDate: cur?.last_active_date ?? null,
    currentStreak: cur?.current_streak ?? 0,
    today,
  });
  const longest = Math.max(cur?.longest_streak ?? 0, currentStreak);

  await supabase.from('user_streaks').upsert({
    user_id: userId,
    current_streak: currentStreak,
    longest_streak: longest,
    last_active_date: today,
  });
}

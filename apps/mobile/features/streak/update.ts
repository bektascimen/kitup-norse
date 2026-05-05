import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { nextStreak } from './calc';

export async function bumpStreakForToday(): Promise<void> {
  const userId = useAuthStore.getState().session?.user.id;
  if (!userId) return;
  const today = new Date().toISOString().slice(0, 10);

  const { data: cur } = await supabase
    .from('user_streaks').select('*').eq('user_id', userId).maybeSingle();

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

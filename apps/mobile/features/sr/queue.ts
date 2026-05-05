import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { nextInterval } from './sm2';

export async function enqueueWrong(questionIds: string[]): Promise<void> {
  const userId = useAuthStore.getState().session?.user.id;
  if (!userId || questionIds.length === 0) return;
  const due = new Date();
  due.setDate(due.getDate() + 1);
  const rows = questionIds.map((q) => ({
    user_id: userId,
    question_id: q,
    due_at: due.toISOString(),
    interval_days: 1,
    ease_factor: 2.5,
  }));
  await supabase.from('review_queue').upsert(rows, { onConflict: 'user_id,question_id' });
}

export async function recordReview(reviewId: string, correct: boolean) {
  const { data: row } = await supabase.from('review_queue').select('*').eq('id', reviewId).single();
  if (!row) return;
  const { ease, intervalDays } = nextInterval({ ease: row.ease_factor, intervalDays: row.interval_days, correct });
  if (correct && intervalDays > 14) {
    await supabase.from('review_queue').delete().eq('id', reviewId);
    return;
  }
  const due = new Date();
  due.setDate(due.getDate() + intervalDays);
  await supabase.from('review_queue').update({
    ease_factor: ease, interval_days: intervalDays, due_at: due.toISOString(),
  }).eq('id', reviewId);
}

export async function dueCount(): Promise<number> {
  const userId = useAuthStore.getState().session?.user.id;
  if (!userId) return 0;
  const { count } = await supabase.from('review_queue')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId).lte('due_at', new Date().toISOString());
  return count ?? 0;
}

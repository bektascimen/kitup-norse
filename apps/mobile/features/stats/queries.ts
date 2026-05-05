import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';

export type LearnerStats = {
  completed: number;
  totalDays: number;
  avgScore: number | null;
  currentStreak: number;
  longestStreak: number;
  dueReviews: number;
};

/**
 * Aggregates the four numbers the Profile screen surfaces.
 * One hook, one query key — refetches together so the grid never
 * shows mismatched counts during a partial load.
 */
export function useLearnerStats() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    enabled: !!userId,
    queryKey: ['learner_stats', userId],
    queryFn: async (): Promise<LearnerStats> => {
      const nowIso = new Date().toISOString();

      const [progressRes, streakRes, dueRes, totalRes] = await Promise.all([
        supabase
          .from('user_progress')
          .select('score, completed_at')
          .eq('user_id', userId!)
          .not('completed_at', 'is', null),
        supabase
          .from('user_streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', userId!)
          .maybeSingle(),
        supabase
          .from('review_queue')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId!)
          .lte('due_at', nowIso),
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
      ]);

      if (progressRes.error) throw progressRes.error;
      if (streakRes.error) throw streakRes.error;
      if (dueRes.error) throw dueRes.error;

      const completedRows = progressRes.data ?? [];
      const completed = completedRows.length;
      const scored = completedRows
        .map((r) => r.score)
        .filter((s): s is number => typeof s === 'number');
      const avgScore =
        scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;

      return {
        completed,
        totalDays: totalRes.count ?? 21,
        avgScore,
        currentStreak: streakRes.data?.current_streak ?? 0,
        longestStreak: streakRes.data?.longest_streak ?? 0,
        dueReviews: dueRes.count ?? 0,
      };
    },
  });
}

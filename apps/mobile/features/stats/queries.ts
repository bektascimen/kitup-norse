import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { useActiveCourse, useLessons } from '../lessons/queries';

const COURSE_DAYS = 21;

export type LearnerStats = {
  completed: number;
  totalDays: number;
  avgScore: number | null;
  currentStreak: number;
  longestStreak: number;
  dueReviews: number;
};

/**
 * Aggregates the four numbers the Profile screen surfaces, scoped to
 * the user's currently chosen path. Switching paths drops the picture
 * to that course's progress alone — completed lessons + avg score +
 * due reviews are all filtered against this course's lesson IDs.
 *
 * Streak stays global (one record per user, calendar-day based) since
 * the schema has no per-path streak. Acceptable for the demo: it still
 * tells the learner whether they showed up today, regardless of path.
 */
export function useLearnerStats() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const course = useActiveCourse();
  const lessons = useLessons(course.data?.id);

  const lessonIds = (lessons.data ?? []).map((l) => l.id);
  const courseKey = course.data?.id ?? 'no-course';

  return useQuery({
    enabled: !!userId && lessons.isSuccess,
    queryKey: ['learner_stats', userId, courseKey],
    queryFn: async (): Promise<LearnerStats> => {
      const nowIso = new Date().toISOString();

      // Resolve question IDs that live under this course so we can
      // filter review_queue by question_id directly. PostgREST's nested
      // embed filter does NOT propagate through to count(head:true) —
      // it only filters the embedded payload, leaving the outer count
      // unscoped. Two-step resolution is the correct shape here.
      const questionIdsRes =
        lessonIds.length === 0
          ? { data: [] as { id: string }[], error: null }
          : await supabase
              .from('quiz_questions')
              .select('id, quizzes!inner(lesson_id)')
              .in('quizzes.lesson_id', lessonIds);
      if (questionIdsRes.error) throw questionIdsRes.error;
      const questionIds = (questionIdsRes.data ?? []).map((r) => r.id);

      const [progressRes, streakRes, dueRes] = await Promise.all([
        lessonIds.length === 0
          ? Promise.resolve({ data: [], error: null })
          : supabase
              .from('user_progress')
              .select('score, completed_at')
              .eq('user_id', userId!)
              .in('lesson_id', lessonIds)
              .not('completed_at', 'is', null),
        supabase
          .from('user_streaks')
          .select('current_streak, longest_streak')
          .eq('user_id', userId!)
          .maybeSingle(),
        questionIds.length === 0
          ? Promise.resolve({ count: 0, error: null })
          : supabase
              .from('review_queue')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', userId!)
              .in('question_id', questionIds)
              .lte('due_at', nowIso),
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
        totalDays: COURSE_DAYS,
        avgScore,
        currentStreak: streakRes.data?.current_streak ?? 0,
        longestStreak: streakRes.data?.longest_streak ?? 0,
        dueReviews: dueRes.count ?? 0,
      };
    },
  });
}

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
 * Local-date YYYY-MM-DD from a Postgres timestamptz string. We bucket
 * by the device's calendar day so a user finishing at 23:00 their
 * time advances yesterday's streak, not "two days ago" because UTC
 * already rolled over.
 */
function localDateOf(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Walk a sorted set of YYYY-MM-DD activity dates and return the
 * current and longest run of consecutive calendar days. "Current"
 * counts only if the latest activity is today or yesterday — a learner
 * who skipped a full day has broken their run.
 */
function computeStreak(activityDates: Set<string>): { current: number; longest: number } {
  if (activityDates.size === 0) return { current: 0, longest: 0 };
  const sorted = [...activityDates].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]! + 'T00:00:00Z').getTime();
    const cur = new Date(sorted[i]! + 'T00:00:00Z').getTime();
    const diff = Math.round((cur - prev) / 86_400_000);
    if (diff === 1) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }
  const todayLocal = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const last = sorted[sorted.length - 1]!;
  const lastTs = new Date(last + 'T00:00:00Z').getTime();
  const todayTs = new Date(todayLocal + 'T00:00:00Z').getTime();
  const gap = Math.round((todayTs - lastTs) / 86_400_000);
  // Run is "current" only if the user was active today or yesterday.
  const current = gap <= 1 ? run : 0;
  return { current, longest };
}

/**
 * Aggregates the four numbers the Profile screen surfaces, scoped to
 * the user's currently chosen path. Switching paths drops the picture
 * to that course's progress alone — completed days, avg score, streak,
 * and due reviews are all derived from this course's lesson IDs.
 *
 * Streak is computed client-side from user_progress.completed_at
 * (filtered by this course's lessons) rather than read from the global
 * user_streaks row, which conflates activity across paths. user_streaks
 * is still maintained for the Today chip and notification scheduling.
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

      const [progressRes, dueRes] = await Promise.all([
        lessonIds.length === 0
          ? Promise.resolve({ data: [], error: null })
          : supabase
              .from('user_progress')
              .select('score, completed_at')
              .eq('user_id', userId!)
              .in('lesson_id', lessonIds)
              .not('completed_at', 'is', null),
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
      if (dueRes.error) throw dueRes.error;

      const completedRows = progressRes.data ?? [];
      const completed = completedRows.length;
      const scored = completedRows
        .map((r) => r.score)
        .filter((s): s is number => typeof s === 'number');
      const avgScore =
        scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;

      const activityDates = new Set(
        completedRows
          .map((r) => r.completed_at)
          .filter((s): s is string => typeof s === 'string')
          .map(localDateOf),
      );
      const { current, longest } = computeStreak(activityDates);

      return {
        completed,
        totalDays: COURSE_DAYS,
        avgScore,
        currentStreak: current,
        longestStreak: longest,
        dueReviews: dueRes.count ?? 0,
      };
    },
  });
}

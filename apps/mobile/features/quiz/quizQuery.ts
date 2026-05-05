import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { track } from '../../lib/analytics';
import { useAuthStore } from '../auth/store';
import { bumpStreakForToday } from '../streak/update';
import { enqueueProgress } from './outbox';

export function useQuiz(quizId: string | undefined) {
  return useQuery({
    enabled: !!quizId,
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, lesson_id, pass_threshold, quiz_questions(id, type, stem_key, explanation_key, position, quiz_options(id, label_key, is_correct, position))')
        .eq('id', quizId!)
        .single();
      if (error) throw error;
      const questions = (data.quiz_questions ?? [])
        .sort((a: any, b: any) => a.position - b.position)
        .map((q: any) => ({
          ...q,
          options: (q.quiz_options ?? []).sort((a: any, b: any) => a.position - b.position),
          correctOptionIds: (q.quiz_options ?? []).filter((o: any) => o.is_correct).map((o: any) => o.id),
        }));
      return { ...data, questions };
    },
  });
}

export function useSubmitProgress() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { lessonId: string; score: number }) => {
      if (!userId) throw new Error('not authenticated');
      const item = { lessonId: input.lessonId, score: input.score, ts: new Date().toISOString() };
      const { error } = await supabase.from('user_progress').upsert({
        user_id: userId, lesson_id: item.lessonId,
        completed_at: item.ts, score: item.score, attempts: 1,
      }, { onConflict: 'user_id,lesson_id' });
      if (error) enqueueProgress(item);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['user_progress'] });
      bumpStreakForToday();
      track('lesson_completed', { lessonId: vars.lessonId, score: vars.score });
    },
  });
}

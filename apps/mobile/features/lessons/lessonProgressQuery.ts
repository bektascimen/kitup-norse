import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';

/** Returns this user's progress record for a single lesson, or null if untouched. */
export function useLessonProgress(lessonId: string | undefined) {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    enabled: !!userId && !!lessonId,
    queryKey: ['user_progress', 'lesson', userId, lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId!)
        .eq('lesson_id', lessonId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

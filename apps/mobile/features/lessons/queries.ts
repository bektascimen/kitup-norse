import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';
import { useOnboarding } from '../onboarding/store';

/**
 * Resolve the active course by the user's chosen path.
 * If a path is set we look for a course with that tone; if none exists yet
 * (e.g. user changed path before its variant is seeded) we fall back to
 * any published course so the app never shows an empty state.
 */
export function useActiveCourse() {
  const path = useOnboarding((s) => s.path);
  return useQuery({
    queryKey: ['course', 'active', path ?? 'fallback'],
    queryFn: async () => {
      if (path) {
        const { data: byTone } = await supabase
          .from('courses')
          .select('*')
          .eq('status', 'published')
          .eq('tone', path)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (byTone) return byTone;
      }
      const { data: any, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return any;
    },
  });
}

export function useLessons(courseId: string | undefined) {
  return useQuery({
    enabled: !!courseId,
    queryKey: ['lessons', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId!)
        .order('day_number', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUserProgress() {
  const userId = useAuthStore((s) => s.session?.user.id);
  return useQuery({
    enabled: !!userId,
    queryKey: ['user_progress', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

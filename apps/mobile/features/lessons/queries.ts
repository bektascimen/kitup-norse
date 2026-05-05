import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../auth/store';

export function useActiveCourse() {
  return useQuery({
    queryKey: ['course', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
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

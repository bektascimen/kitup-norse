import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export function useLesson(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['lesson', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*, quizzes(id)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

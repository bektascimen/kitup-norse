import { supabase } from '../../lib/supabase';
import { queryClient } from '../../lib/queryClient';

const TABLES = ['courses', 'lessons', 'quizzes', 'quiz_questions', 'quiz_options', 'app_config'] as const;

export function subscribeContent(): () => void {
  const channels = TABLES.map((table) =>
    supabase
      .channel(`rt:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        if (table === 'courses') queryClient.invalidateQueries({ queryKey: ['course'] });
        if (table === 'lessons') queryClient.invalidateQueries({ queryKey: ['lessons'] });
        if (['quizzes', 'quiz_questions', 'quiz_options'].includes(table))
          queryClient.invalidateQueries({ queryKey: ['quiz'] });
        if (table === 'app_config') queryClient.invalidateQueries({ queryKey: ['app_config'] });
      })
      .subscribe(),
  );
  return () => channels.forEach((c) => supabase.removeChannel(c));
}

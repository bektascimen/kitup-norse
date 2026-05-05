import { queryClient } from '../../lib/queryClient';
import { supabase } from '../../lib/supabase';

export async function prefetchCourse(courseId: string): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: ['lessons', courseId],
    queryFn: async () => {
      const { data } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('day_number');
      return data ?? [];
    },
  });
  const lessons = queryClient.getQueryData<any[]>(['lessons', courseId]) ?? [];
  await Promise.all(lessons.map((l) =>
    queryClient.prefetchQuery({
      queryKey: ['lesson', l.id],
      queryFn: async () => {
        const { data } = await supabase.from('lessons').select('*, quizzes(id, quiz_questions(*, quiz_options(*)))').eq('id', l.id).single();
        return data;
      },
    })
  ));
}

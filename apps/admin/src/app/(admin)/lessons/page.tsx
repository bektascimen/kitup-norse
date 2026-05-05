import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SortableList } from './SortableList';

export default async function LessonsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: courses } = await supabase.from('courses').select('id, slug').order('created_at');

  const sections = await Promise.all(
    (courses ?? []).map(async (c) => {
      const { data: lessons } = await supabase
        .from('lessons').select('id, day_number, title_key')
        .eq('course_id', c.id).order('day_number');
      return { course: c, lessons: lessons ?? [] };
    }),
  );

  return (
    <div className="space-y-8">
      {sections.map(({ course, lessons }) => (
        <section key={course.id}>
          <h2 className="text-xl font-display mb-3">{course.slug}</h2>
          <SortableList courseId={course.id} items={lessons} />
        </section>
      ))}
    </div>
  );
}

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CourseForm } from './CourseForm';
import { Card } from '@/components/ui/card';
import { deleteCourse } from './actions';

export default async function CoursesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: courses } = await supabase
    .from('courses').select('*').order('created_at', { ascending: false });

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <section>
        <h2 className="text-xl font-display mb-4">Courses</h2>
        <div className="space-y-3">
          {(courses ?? []).map((c) => (
            <Card key={c.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{c.slug}</p>
                <p className="text-textMid text-sm">{c.day_count} days · {c.status}</p>
              </div>
              <form action={async () => { 'use server'; await deleteCourse(c.id); }}>
                <button className="text-danger text-sm">Delete</button>
              </form>
            </Card>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-display mb-4">New course</h2>
        <CourseForm />
      </section>
    </div>
  );
}

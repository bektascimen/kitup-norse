import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function QuizzesIndex() {
  const supabase = await createServerSupabaseClient();
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, day_number, title_key, courses(slug)')
    .order('course_id, day_number');

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-display mb-3">Lessons → Quiz editor</h2>
      {(lessons ?? []).map((l: any) => (
        <Link key={l.id} href={`/quizzes/${l.id}`} className="block p-3 bg-bgElevated rounded-md border border-border hover:border-accent">
          <span className="text-textMid text-xs mr-2">{l.courses?.slug}</span>
          Day {l.day_number} — {l.title_key}
        </Link>
      ))}
    </div>
  );
}

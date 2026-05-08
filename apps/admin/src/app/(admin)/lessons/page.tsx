import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadDict } from '@/lib/translations';
import { Panel } from '@/components/dash/Panel';
import { SortableList } from './SortableList';

export default async function LessonsPage() {
  const supabase = await createServerSupabaseClient();
  const t = await loadDict(supabase, 'tr');
  const { data: courses } = await supabase
    .from('courses')
    .select('id, slug, title_key, day_count, status')
    .order('created_at');

  const sections = await Promise.all(
    (courses ?? []).map(async (c) => {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, day_number, title_key')
        .eq('course_id', c.id)
        .order('day_number');
      return {
        course: c,
        lessons: (lessons ?? []).map((l) => ({
          id: l.id,
          day_number: l.day_number,
          title_key: l.title_key,
          title: t(l.title_key),
        })),
      };
    }),
  );

  const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);

  return (
    <div className="reveal-stack space-y-6">
      <header data-reveal>
        <div className="flex items-baseline gap-3 mb-1">
          <span
            className="font-display text-accent text-base leading-none translate-y-[1px]"
            aria-hidden
          >
            ᛒ
          </span>
          <span className="font-display text-[10px] tracking-carved uppercase text-textLow">
            The branches
          </span>
        </div>
        <h1 className="font-display text-3xl tracking-tight text-textHigh">Lessons</h1>
        <p className="mt-1 font-serif italic text-[13px] text-textMid">
          {totalLessons} {totalLessons === 1 ? 'lesson' : 'lessons'} across {sections.length}{' '}
          {sections.length === 1 ? 'saga' : 'sagas'}. Drag to reorder.
        </p>
      </header>

      {sections.length === 0 && (
        <Panel rune="ᛒ" title="No sagas yet">
          <div className="px-5 py-12 text-center">
            <p className="font-serif italic text-textMid text-sm">
              Forge a saga first — its lessons will appear here.
            </p>
          </div>
        </Panel>
      )}

      {sections.map(({ course, lessons }) => (
        <section key={course.id} data-reveal>
          <Panel
            rune="ᛞ"
            title={t(course.title_key) || course.slug}
            hint={`${course.slug} · ${course.day_count} days · ${course.status}`}
          >
            {lessons.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="font-serif italic text-textMid text-sm">No lessons yet.</p>
              </div>
            ) : (
              <SortableList courseId={course.id} items={lessons} />
            )}
          </Panel>
        </section>
      ))}
    </div>
  );
}

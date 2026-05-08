import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadDict } from '@/lib/translations';
import { Panel } from '@/components/dash/Panel';

type LessonRow = {
  id: string;
  day_number: number;
  title_key: string;
  course_id: string;
  courses: { slug: string; title_key: string } | { slug: string; title_key: string }[] | null;
};

function pickCourse(c: LessonRow['courses']): { slug: string; title_key: string } | null {
  if (!c) return null;
  return Array.isArray(c) ? (c[0] ?? null) : c;
}

export default async function QuizzesIndex() {
  const supabase = await createServerSupabaseClient();
  const t = await loadDict(supabase, 'tr');

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, day_number, title_key, course_id, courses(slug, title_key)')
    .order('course_id, day_number')
    .returns<LessonRow[]>();

  // Group lessons by course for clearer scanning.
  const byCourse = new Map<string, { slug: string; title: string; items: LessonRow[] }>();
  for (const l of lessons ?? []) {
    const course = pickCourse(l.courses);
    if (!course) continue;
    const k = l.course_id;
    if (!byCourse.has(k)) {
      byCourse.set(k, {
        slug: course.slug,
        title: t(course.title_key) || course.slug,
        items: [],
      });
    }
    byCourse.get(k)!.items.push(l);
  }

  const sections = Array.from(byCourse.entries());

  return (
    <div className="reveal-stack space-y-6">
      <header data-reveal>
        <div className="flex items-baseline gap-3 mb-1">
          <span
            className="font-display text-accent text-base leading-none translate-y-[1px]"
            aria-hidden
          >
            ᛗ
          </span>
          <span className="font-display text-[10px] tracking-carved uppercase text-textLow">
            Trials of memory
          </span>
        </div>
        <h1 className="font-display text-3xl tracking-tight text-textHigh">Quizzes</h1>
        <p className="mt-1 font-serif italic text-[13px] text-textMid">
          Pick a lesson to edit its quiz — questions and options are stored as translation keys.
        </p>
      </header>

      {sections.length === 0 && (
        <Panel rune="ᛗ" title="No lessons yet">
          <div className="px-5 py-12 text-center">
            <p className="font-serif italic text-textMid text-sm">
              Forge a saga first — its lessons (and their quizzes) will appear here.
            </p>
          </div>
        </Panel>
      )}

      {sections.map(([id, { title, slug, items }]) => (
        <section key={id} data-reveal>
          <Panel
            rune="ᛞ"
            title={title}
            hint={`${slug} · ${items.length} ${items.length === 1 ? 'lesson' : 'lessons'}`}
          >
            <ul>
              {items.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/quizzes/${l.id}`}
                    className="group flex items-center gap-4 px-4 py-3 border-b border-border/60 last:border-b-0 hover:bg-bgElevated/60 transition-colors"
                  >
                    <span className="font-display text-[11px] tracking-carved uppercase text-accent w-12 leading-none">
                      D {String(l.day_number).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[14px] tracking-tight text-textHigh truncate">
                        {t(l.title_key)}
                      </p>
                      <p className="font-mono text-[10px] text-textLow truncate">{l.title_key}</p>
                    </div>
                    <span className="font-display text-textLow text-lg group-hover:text-accent transition-colors">
                      ›
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      ))}
    </div>
  );
}

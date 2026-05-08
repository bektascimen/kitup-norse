import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadDict } from '@/lib/translations';
import { CourseForm } from './CourseForm';
import { Panel } from '@/components/dash/Panel';
import { deleteCourse } from './actions';

const STATUS_TONE: Record<string, string> = {
  published: 'text-moss',
  draft: 'text-ember',
  archived: 'text-textLow',
};

export default async function CoursesPage() {
  const supabase = await createServerSupabaseClient();
  const t = await loadDict(supabase, 'tr');
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  const list = courses ?? [];
  const publishedCount = list.filter((c) => c.status === 'published').length;

  return (
    <div className="reveal-stack space-y-6">
      <header data-reveal>
        <div className="flex items-baseline gap-3 mb-1">
          <span
            className="font-display text-accent text-base leading-none translate-y-[1px]"
            aria-hidden
          >
            ᛞ
          </span>
          <span className="font-display text-[10px] tracking-carved uppercase text-textLow">
            The sagas
          </span>
        </div>
        <h1 className="font-display text-3xl tracking-tight text-textHigh">Courses</h1>
        <p className="mt-1 font-serif italic text-[13px] text-textMid">
          {publishedCount} of {list.length} {list.length === 1 ? 'saga is' : 'sagas are'} published.
        </p>
      </header>

      <div data-reveal className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Panel rune="ᛞ" title="All sagas" hint="Newest first">
          {list.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-serif italic text-textMid text-sm">
                The codex is empty. Create the first saga →
              </p>
            </div>
          ) : (
            <ul>
              {list.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-4 px-4 py-3 border-b border-border/60 last:border-b-0 hover:bg-bgElevated/60 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[14px] tracking-tight text-textHigh truncate">
                      {t(c.title_key) || c.slug}
                    </p>
                    <p className="font-mono text-[10px] text-textLow truncate">
                      {c.slug} · {c.day_count} days · {c.difficulty}
                    </p>
                  </div>
                  <span
                    className={`font-display text-[10px] tracking-carved uppercase ${STATUS_TONE[c.status] ?? 'text-textMid'}`}
                  >
                    {c.status}
                  </span>
                  <form
                    action={async () => {
                      'use server';
                      await deleteCourse(c.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="font-display text-[10px] tracking-rune uppercase text-danger/80 hover:text-danger transition-colors px-2 py-1"
                    >
                      Delete
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel rune="ᚱ" title="New saga" hint="Slug + key references; AI fills the body">
          <div className="p-4">
            <CourseForm />
          </div>
        </Panel>
      </div>
    </div>
  );
}

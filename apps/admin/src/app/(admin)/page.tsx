import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/dash/StatCard';
import { StatusPill } from '@/components/dash/StatusPill';
import { Panel } from '@/components/dash/Panel';

function nameFromEmail(email: string | null | undefined): string {
  if (!email) return 'Skald';
  const local = email.split('@')[0] ?? '';
  const first = local.split(/[._-]/)[0] ?? local;
  if (!first) return 'Skald';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

const TYPE_RUNE: Record<string, string> = {
  course: 'ᛞ',
  translation: 'ᚷ',
  quiz: 'ᛗ',
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const [
    {
      data: { user },
    },
    coursesRes,
    lessonsRes,
    trCountRes,
    enCountRes,
    activeJobsRes,
    recentJobsRes,
    recentCoursesRes,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('courses').select('id, status'),
    supabase.from('lessons').select('id', { count: 'exact', head: true }),
    supabase.from('translations').select('key', { count: 'exact', head: true }).eq('locale', 'tr'),
    supabase.from('translations').select('key', { count: 'exact', head: true }).eq('locale', 'en'),
    supabase
      .from('generation_jobs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'running']),
    supabase
      .from('generation_jobs')
      .select('id, type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('courses')
      .select('id, slug, title_key, day_count, status, created_at')
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  const allCourses = coursesRes.data ?? [];
  const publishedCount = allCourses.filter((c) => c.status === 'published').length;
  const draftCount = allCourses.filter((c) => c.status === 'draft').length;
  const lessonsCount = lessonsRes.count ?? 0;
  const trCount = trCountRes.count ?? 0;
  const enCount = enCountRes.count ?? 0;
  const localeGap = Math.abs(trCount - enCount);
  const activeJobs = activeJobsRes.count ?? 0;
  const recentJobs = recentJobsRes.data ?? [];
  const recentCourses = recentCoursesRes.data ?? [];

  const name = nameFromEmail(user?.email);

  return (
    <div className="reveal-stack space-y-8">
      {/* HERO */}
      <header data-reveal className="relative">
        <div
          className="absolute inset-0 -z-10 bg-grain opacity-[0.35] pointer-events-none rounded-2xl"
          aria-hidden
        />
        <div className="flex items-baseline gap-3 mb-3">
          <span
            className="font-display text-accent text-base leading-none translate-y-[1px]"
            aria-hidden
          >
            ᛞ
          </span>
          <span className="font-display text-[10px] tracking-carved uppercase text-textLow">
            The Forge · Codex Hall
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-textHigh leading-[1.05]">
          Velkominn, <span className="text-accent">{name}</span>.
        </h1>
        <p className="mt-3 font-serif italic text-textMid text-[15px] max-w-2xl leading-relaxed">
          {publishedCount > 0
            ? `${publishedCount} ${publishedCount === 1 ? 'saga walks' : 'sagas walk'} the Bifrost. ${activeJobs > 0 ? `${activeJobs} ${activeJobs === 1 ? 'forge fire is' : 'forge fires are'} burning.` : 'The forge is quiet.'}`
            : 'Light the first fire — generate a saga to begin.'}
        </p>
      </header>

      {/* STAT CARDS */}
      <section data-reveal className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          rune="ᛞ"
          label="Published"
          value={publishedCount}
          hint={
            draftCount > 0
              ? `${draftCount} ${draftCount === 1 ? 'draft' : 'drafts'} in the workshop`
              : 'No drafts pending'
          }
          href="/courses"
          tone="forge"
        />
        <StatCard
          rune="ᛒ"
          label="Lessons"
          value={lessonsCount}
          hint={lessonsCount > 0 ? 'Across every saga' : 'No lessons yet'}
          href="/lessons"
        />
        <StatCard
          rune="ᚷ"
          label="Translations"
          value={`${trCount} · ${enCount}`}
          hint={
            localeGap === 0
              ? 'TR and EN are level'
              : `${localeGap} ${localeGap === 1 ? 'string' : 'strings'} out of step`
          }
          href="/translations"
        />
        <StatCard
          rune="ᚱ"
          label="In the Forge"
          value={activeJobs}
          hint={activeJobs > 0 ? 'Pending or running now' : 'All jobs settled'}
          href="/generate"
          tone={activeJobs > 0 ? 'forge' : 'default'}
        />
      </section>

      {/* TWO-COL DETAIL */}
      <section data-reveal className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity — spans 2 */}
        <Panel
          rune="ᚱ"
          title="Forge activity"
          hint="Last six generation jobs"
          action={
            <Link
              href="/generate"
              className="font-display text-[10px] tracking-rune uppercase text-textMid hover:text-accent transition-colors"
            >
              Open forge ›
            </Link>
          }
          className="lg:col-span-2"
        >
          {recentJobs.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-serif italic text-textMid text-sm">
                No fires lit yet. Generate a saga to wake the forge.
              </p>
              <Link
                href="/generate"
                className="mt-4 inline-block font-display text-[10px] tracking-rune uppercase text-accent hover:underline underline-offset-4"
              >
                ᚱ Begin
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {recentJobs.map((job) => (
                <li
                  key={job.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-bgElevated/60 transition-colors"
                >
                  <span
                    className="font-display text-2xl text-accent w-6 text-center leading-none"
                    aria-hidden
                  >
                    {TYPE_RUNE[job.type] ?? 'ᚷ'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[13px] text-textHigh tracking-tight capitalize">
                      {job.type}
                    </p>
                    <p className="font-mono text-[10px] text-textLow truncate">
                      {job.id.slice(0, 8)} · {relativeTime(job.created_at)}
                    </p>
                  </div>
                  <StatusPill status={job.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Recent courses */}
        <Panel
          rune="ᛞ"
          title="Recent sagas"
          hint="Latest courses created"
          action={
            <Link
              href="/courses"
              className="font-display text-[10px] tracking-rune uppercase text-textMid hover:text-accent transition-colors"
            >
              All sagas ›
            </Link>
          }
        >
          {recentCourses.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-serif italic text-textMid text-sm">
                The codex is empty. The first saga awaits.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {recentCourses.map((course) => (
                <li
                  key={course.id}
                  className="px-5 py-3.5 hover:bg-bgElevated/60 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <p className="font-display text-[13px] text-textHigh tracking-tight truncate">
                      {course.slug}
                    </p>
                    <span className="font-display text-[9px] tracking-carved uppercase text-textLow">
                      {course.status}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-textLow">
                    {course.day_count} days · {relativeTime(course.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      {/* QUICK ACTIONS BAND */}
      <section data-reveal>
        <div className="rune-rule mb-5">
          <span>ᛟ</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/generate"
            className="group flex items-center gap-3 px-4 py-3.5 rounded-md border border-border bg-bgElevated/30 hover:border-accent/40 hover:bg-accentSoft/40 transition-all"
          >
            <span
              className="font-display text-2xl text-accent leading-none group-hover:animate-pulse-rune"
              aria-hidden
            >
              ᚱ
            </span>
            <div>
              <p className="font-display text-[13px] tracking-tight text-textHigh">Forge a saga</p>
              <p className="font-serif italic text-[11px] text-textMid">Gemini · TR or EN</p>
            </div>
          </Link>
          <Link
            href="/translations"
            className="group flex items-center gap-3 px-4 py-3.5 rounded-md border border-border bg-bgElevated/30 hover:border-accent/40 hover:bg-accentSoft/40 transition-all"
          >
            <span className="font-display text-2xl text-accent leading-none" aria-hidden>
              ᚷ
            </span>
            <div>
              <p className="font-display text-[13px] tracking-tight text-textHigh">
                Tend the words
              </p>
              <p className="font-serif italic text-[11px] text-textMid">Edit translation strings</p>
            </div>
          </Link>
          <Link
            href="/app-config"
            className="group flex items-center gap-3 px-4 py-3.5 rounded-md border border-border bg-bgElevated/30 hover:border-accent/40 hover:bg-accentSoft/40 transition-all"
          >
            <span className="font-display text-2xl text-accent leading-none" aria-hidden>
              ᛏ
            </span>
            <div>
              <p className="font-display text-[13px] tracking-tight text-textHigh">Set the runes</p>
              <p className="font-serif italic text-[11px] text-textMid">Feature flags · config</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

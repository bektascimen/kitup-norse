import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadDict } from '@/lib/translations';
import { ensureQuiz, upsertQuestion, upsertOption, deleteQuestion, deleteOption } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Panel } from '@/components/dash/Panel';

const TYPE_LABEL: Record<string, string> = {
  multiple_choice: 'Multiple choice',
  true_false: 'True / false',
};

export default async function QuizEditor({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const supabase = await createServerSupabaseClient();
  const t = await loadDict(supabase, 'tr');

  const quizId = await ensureQuiz(lessonId);

  const [{ data: lesson }, { data: questions }] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, day_number, title_key, courses(slug, title_key)')
      .eq('id', lessonId)
      .maybeSingle(),
    supabase
      .from('quiz_questions')
      .select('*, quiz_options(*)')
      .eq('quiz_id', quizId)
      .order('position'),
  ]);

  const course = Array.isArray(lesson?.courses) ? lesson?.courses[0] : lesson?.courses;
  const lessonTitle = lesson ? t(lesson.title_key) : '';
  const courseTitle = course ? t(course.title_key) || course.slug : '';

  return (
    <div className="reveal-stack space-y-6">
      {/* HERO */}
      <header data-reveal>
        <div className="flex items-baseline gap-3 mb-1">
          <span
            className="font-display text-accent text-base leading-none translate-y-[1px]"
            aria-hidden
          >
            ᛗ
          </span>
          <Link
            href="/quizzes"
            className="font-display text-[10px] tracking-carved uppercase text-textLow hover:text-accent transition-colors"
          >
            ‹ All quizzes
          </Link>
        </div>
        <h1 className="font-display text-3xl tracking-tight text-textHigh">
          {lessonTitle || 'Quiz editor'}
        </h1>
        <p className="mt-1 font-mono text-[11px] text-textLow truncate">
          {courseTitle ? `${courseTitle} · ` : ''}
          {lesson ? `Day ${String(lesson.day_number).padStart(2, '0')}` : ''}
          {' · '}
          {lessonId}
        </p>
      </header>

      {/* QUESTIONS */}
      {(questions ?? []).length === 0 && (
        <Panel rune="ᛗ" title="No questions yet">
          <div className="px-5 py-12 text-center">
            <p className="font-serif italic text-textMid text-sm">
              Add the first question below — keys live in the{' '}
              <span className="font-mono">translations</span> table.
            </p>
          </div>
        </Panel>
      )}

      {(questions ?? []).map((q) => {
        const stem = t(q.stem_key);
        const explanation = q.explanation_key ? t(q.explanation_key) : null;
        const options = (q.quiz_options ?? []).slice().sort((a, b) => a.position - b.position);
        return (
          <Panel
            key={q.id}
            rune="ᛞ"
            title={stem || q.stem_key}
            hint={`${TYPE_LABEL[q.type] ?? q.type} · pos ${q.position}`}
            action={
              <form
                action={async () => {
                  'use server';
                  await deleteQuestion(q.id);
                }}
              >
                <button className="font-display text-[10px] tracking-rune uppercase text-danger/80 hover:text-danger transition-colors">
                  Delete question
                </button>
              </form>
            }
          >
            <div className="px-5 py-4 space-y-4">
              <div className="space-y-1">
                <p className="font-mono text-[10px] text-textLow">{q.stem_key}</p>
                {explanation && (
                  <p className="font-serif italic text-[12px] text-textMid leading-snug">
                    {explanation}
                  </p>
                )}
              </div>

              <ul className="divide-y divide-border/60 border border-border/70 rounded-md overflow-hidden bg-bgDeep/40">
                {options.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-bgElevated/60 transition-colors"
                  >
                    <span
                      className={`font-display text-base w-5 text-center leading-none ${o.is_correct ? 'text-moss' : 'text-textLow'}`}
                      aria-hidden
                    >
                      {o.is_correct ? '✓' : '·'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[13px] text-textHigh truncate">
                        {t(o.label_key) || o.label_key}
                      </p>
                      <p className="font-mono text-[10px] text-textLow truncate">{o.label_key}</p>
                    </div>
                    <form
                      action={async () => {
                        'use server';
                        await deleteOption(o.id);
                      }}
                    >
                      <button className="font-display text-[10px] tracking-rune uppercase text-danger/70 hover:text-danger transition-colors">
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
                {options.length === 0 && (
                  <li className="px-3 py-3 font-serif italic text-[12px] text-textMid">
                    No options yet.
                  </li>
                )}
              </ul>

              <form
                action={async (fd) => {
                  'use server';
                  await upsertOption(fd);
                }}
                className="flex flex-wrap gap-2 items-center pt-1"
              >
                <input type="hidden" name="question_id" value={q.id} />
                <input type="hidden" name="position" value={options.length} />
                <Input
                  name="label_key"
                  placeholder="option label key"
                  required
                  className="flex-1 min-w-[200px]"
                />
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-bgDeep/40 text-[12px]">
                  <input type="checkbox" name="is_correct" value="true" className="accent-accent" />
                  <span className="font-display text-[10px] tracking-rune uppercase text-textMid">
                    Correct
                  </span>
                </label>
                <Button type="submit" size="sm">
                  Add option
                </Button>
              </form>
            </div>
          </Panel>
        );
      })}

      {/* ADD QUESTION */}
      <Panel rune="ᚱ" title="New question" hint="Stem and explanation are translation keys">
        <form
          action={async (fd) => {
            'use server';
            await upsertQuestion(fd);
          }}
          className="px-5 py-4 space-y-3"
        >
          <input type="hidden" name="quiz_id" value={quizId} />
          <input type="hidden" name="position" value={(questions ?? []).length} />
          <select
            name="type"
            className="w-full bg-bgDeep border border-border rounded-md px-3 py-2 text-[13px] text-textHigh focus:outline-none focus:border-accent/60 transition-colors"
          >
            <option value="multiple_choice">Multiple choice</option>
            <option value="true_false">True / false</option>
          </select>
          <Input name="stem_key" placeholder="stem translation key" required />
          <Input name="explanation_key" placeholder="explanation key (optional)" />
          <Button type="submit">Add question</Button>
        </form>
      </Panel>
    </div>
  );
}

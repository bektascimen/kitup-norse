import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  ensureQuiz, upsertQuestion, upsertOption, deleteQuestion, deleteOption,
} from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function QuizEditor({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const supabase = await createServerSupabaseClient();
  const quizId = await ensureQuiz(lessonId);

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*, quiz_options(*)')
    .eq('quiz_id', quizId)
    .order('position');

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-display">Quiz for lesson {lessonId}</h2>

      {(questions ?? []).map((q: any) => (
        <section key={q.id} className="p-4 bg-bgElevated rounded-md border border-border space-y-3">
          <p className="font-medium">{q.stem_key} <span className="text-textMid text-xs">({q.type})</span></p>
          <ul className="space-y-1 text-sm">
            {(q.quiz_options ?? []).sort((a: any, b: any) => a.position - b.position).map((o: any) => (
              <li key={o.id} className="flex justify-between">
                <span>{o.is_correct ? '✓ ' : ''}{o.label_key}</span>
                <form action={async () => { 'use server'; await deleteOption(o.id); }}>
                  <button className="text-danger text-xs">remove</button>
                </form>
              </li>
            ))}
          </ul>

          <form action={async (fd) => { 'use server'; await upsertOption(fd); }} className="flex gap-2 items-center">
            <input type="hidden" name="question_id" value={q.id} />
            <input type="hidden" name="position" value={(q.quiz_options ?? []).length} />
            <Input name="label_key" placeholder="option label key" required />
            <label className="text-sm flex items-center gap-1">
              <input type="checkbox" name="is_correct" value="true" /> correct
            </label>
            <Button type="submit">Add option</Button>
          </form>
          <form action={async () => { 'use server'; await deleteQuestion(q.id); }}>
            <button className="text-danger text-xs">delete question</button>
          </form>
        </section>
      ))}

      <section className="p-4 border border-dashed border-border rounded-md">
        <h3 className="font-medium mb-3">Add question</h3>
        <form action={async (fd) => { 'use server'; await upsertQuestion(fd); }} className="space-y-2">
          <input type="hidden" name="quiz_id" value={quizId} />
          <input type="hidden" name="position" value={(questions ?? []).length} />
          <select name="type" className="bg-bg border border-border rounded-md p-2">
            <option value="multiple_choice">multiple_choice</option>
            <option value="true_false">true_false</option>
          </select>
          <Input name="stem_key" placeholder="stem translation key" required />
          <Input name="explanation_key" placeholder="explanation key (optional)" />
          <Button type="submit">Add</Button>
        </form>
      </section>
    </div>
  );
}

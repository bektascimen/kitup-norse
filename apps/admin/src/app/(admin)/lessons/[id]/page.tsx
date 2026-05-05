import { createServerSupabaseClient } from '@/lib/supabase/server';
import { upsertLesson, deleteLesson } from '../actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function LessonEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: lesson } = await supabase.from('lessons').select('*').eq('id', id).single();
  if (!lesson) return <p>Not found</p>;

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-display mb-4">Day {lesson.day_number} — {lesson.title_key}</h2>
      <form action={async (fd) => { 'use server'; await upsertLesson(fd); }} className="space-y-3">
        <input type="hidden" name="id" value={lesson.id} />
        <input type="hidden" name="course_id" value={lesson.course_id} />
        <input type="hidden" name="day_number" value={lesson.day_number} />
        <Input name="title_key" defaultValue={lesson.title_key} required />
        <Input name="body_key" defaultValue={lesson.body_key} required />
        <Input name="hero_image_url" defaultValue={lesson.hero_image_url ?? ''} placeholder="https://..." />
        <Input name="audio_url" defaultValue={lesson.audio_url ?? ''} placeholder="https://..." />
        <Input name="est_minutes" type="number" min={1} defaultValue={lesson.est_minutes} />
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
        </div>
      </form>
      <form action={async () => { 'use server'; await deleteLesson(lesson.id); }} className="mt-6">
        <button className="text-danger text-sm">Delete this lesson</button>
      </form>
    </div>
  );
}

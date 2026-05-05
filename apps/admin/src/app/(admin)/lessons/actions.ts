'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const upsert = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  day_number: z.coerce.number().int().min(1),
  title_key: z.string().min(1),
  body_key: z.string().min(1),
  hero_image_url: z.string().url().nullish(),
  audio_url: z.string().url().nullish(),
  est_minutes: z.coerce.number().int().min(1).default(5),
});

export async function upsertLesson(formData: FormData) {
  const parsed = upsert.parse(Object.fromEntries(formData));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('lessons').upsert(parsed);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/lessons');
  return { ok: true };
}

export async function reorderLessons(courseId: string, ordered: { id: string }[]) {
  const supabase = await createServerSupabaseClient();
  // Two-pass to avoid unique(course_id, day_number) collisions.
  const offset = 1000;
  for (let i = 0; i < ordered.length; i++) {
    await supabase.from('lessons').update({ day_number: offset + i + 1 }).eq('id', ordered[i].id);
  }
  for (let i = 0; i < ordered.length; i++) {
    await supabase.from('lessons').update({ day_number: i + 1 }).eq('id', ordered[i].id);
  }
  revalidatePath(`/lessons`);
  return { ok: true };
}

export async function deleteLesson(id: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/lessons');
  return { ok: true };
}

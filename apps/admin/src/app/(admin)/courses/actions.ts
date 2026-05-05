'use server';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const upsert = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  title_key: z.string().min(1),
  description_key: z.string().min(1),
  day_count: z.coerce.number().int().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  status: z.enum(['draft', 'published', 'archived']),
  cover_image_url: z.string().url().nullish(),
});

export async function upsertCourse(formData: FormData) {
  const parsed = upsert.parse(Object.fromEntries(formData));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('courses').upsert(parsed);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/courses');
  return { ok: true };
}

export async function deleteCourse(id: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/courses');
  return { ok: true };
}

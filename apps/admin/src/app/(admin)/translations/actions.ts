'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const upsert = z.object({
  key: z.string().min(1),
  locale: z.enum(['tr', 'en']),
  value: z.string(),
});

export async function upsertTranslation(formData: FormData) {
  const parsed = upsert.parse(Object.fromEntries(formData));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('translations').upsert(parsed);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/translations');
  return { ok: true };
}

'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const upsert = z.object({
  key: z.string().min(1),
  value_json: z.string().refine((s) => { try { JSON.parse(s); return true; } catch { return false; } }, 'invalid JSON'),
});

export async function upsertConfig(formData: FormData) {
  const parsed = upsert.parse(Object.fromEntries(formData));
  const value = JSON.parse(parsed.value_json);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('app_config').upsert({ key: parsed.key, value });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/app-config');
  return { ok: true };
}

export async function deleteConfig(key: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from('app_config').delete().eq('key', key);
  revalidatePath('/app-config');
}

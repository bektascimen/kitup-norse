'use server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function startGeneration(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: 'not authenticated' };

  const body = {
    topic: String(formData.get('topic') ?? ''),
    difficulty: String(formData.get('difficulty') ?? 'beginner'),
    dayCount: Number(formData.get('day_count') ?? 7),
    locale: String(formData.get('locale') ?? 'tr'),
  };

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-course`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  const json = await res.json();
  return { ok: true, jobId: json.jobId as string };
}

export async function startTranslate() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/translate-content`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ sourceLocale: 'tr', targetLocale: 'en', batchSize: 200 }),
  });
}

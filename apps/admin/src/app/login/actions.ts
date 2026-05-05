'use server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { ok: false, error: 'Email is required.' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

import { supabase } from '../../lib/supabase';
import * as Linking from 'expo-linking';

export async function sendMagicLink(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const redirect = Linking.createURL('/auth/callback');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirect },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

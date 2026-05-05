import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '../supabase/server';

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | undefined)?.role;
  if (!user || role !== 'admin') redirect('/login');
  return { user, supabase };
}

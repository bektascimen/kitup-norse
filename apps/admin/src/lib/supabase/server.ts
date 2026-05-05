import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@kitup/shared-types';
import { env } from '../env';

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (set: CookieToSet[]) => {
        try {
          set.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* called from a Server Component – ignore */
        }
      },
    },
  });
}

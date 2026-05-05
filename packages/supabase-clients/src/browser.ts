import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@kitup/shared-types';

export type Kitup = SupabaseClient<Database>;

export function createBrowserClient(args: {
  url: string;
  publishableKey: string;
  storage?: any;
}): Kitup {
  return createClient<Database>(args.url, args.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: args.storage,
    },
    realtime: { params: { eventsPerSecond: 10 } },
  });
}

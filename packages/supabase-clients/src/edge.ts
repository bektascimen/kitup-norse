import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@kitup/shared-types';

/**
 * Build a per-request Supabase client that acts as the caller.
 * `authHeader` is the raw `Authorization: Bearer <jwt>` value from the
 * incoming Edge Function request. RLS enforces all permissions.
 */
export function createCallerClient(args: {
  url: string;
  publishableKey: string;
  authHeader: string;
}): SupabaseClient<Database> {
  return createClient<Database>(args.url, args.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { authorization: args.authHeader } },
  });
}

'use client';
import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr';
import type { Database } from '@kitup/shared-types';
import { env } from '../env';

export function createBrowserClient() {
  return createSsrBrowserClient<Database>(env.supabaseUrl, env.supabasePublishableKey);
}

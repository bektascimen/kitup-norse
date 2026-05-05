import { createBrowserClient } from '@kitup/supabase-clients';
import { env } from './env';
import { mmkvStorageAdapter } from './storage';

export const supabase = createBrowserClient({
  url: env.supabaseUrl,
  publishableKey: env.supabasePublishableKey,
  storage: mmkvStorageAdapter,
});

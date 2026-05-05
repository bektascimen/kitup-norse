import { supabase } from '../../lib/supabase';
import { useAuthStore } from './store';

export async function bootstrapAuth(): Promise<void> {
  useAuthStore.getState().setStatus('authenticating');

  const { data: { session: existing } } = await supabase.auth.getSession();
  if (existing) {
    useAuthStore.getState().setSession(existing);
    subscribe();
    return;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    useAuthStore.getState().setStatus('error', error?.message ?? 'sign-in failed');
    return;
  }
  useAuthStore.getState().setSession(data.session);
  subscribe();
}

function subscribe() {
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
  });
}

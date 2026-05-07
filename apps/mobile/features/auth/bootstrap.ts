import { supabase } from '../../lib/supabase';
import { useAuthStore } from './store';

// Register the auth-state subscriber once at module load. The previous
// version only subscribed inside the success branches of bootstrapAuth,
// which meant Apple sign-in / magic-link / anonymous-disabled errors
// could land a Supabase session but never reach the Zustand store —
// the UI thought the user was signed out while the SDK held a JWT.
let subscribed = false;
export function ensureAuthSubscription(): void {
  if (subscribed) return;
  subscribed = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setSession(session);
  });
}

export async function bootstrapAuth(): Promise<void> {
  ensureAuthSubscription();
  useAuthStore.getState().setStatus('authenticating');

  const {
    data: { session: existing },
  } = await supabase.auth.getSession();
  if (existing) {
    useAuthStore.getState().setSession(existing);
    return;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    useAuthStore.getState().setStatus('error', error?.message ?? 'sign-in failed');
    return;
  }
  useAuthStore.getState().setSession(data.session);
}

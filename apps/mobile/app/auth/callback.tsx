import { useEffect } from 'react';
import { router } from 'expo-router';
import { useURL } from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../features/auth/store';
import { ensureAuthSubscription } from '../../features/auth/bootstrap';

export default function AuthCallback() {
  const url = useURL();
  useEffect(() => {
    if (!url) return;
    const params = new URL(url).searchParams;
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (!access_token || !refresh_token) return;

    // The deep link can fire before bootstrapAuth() has registered the
    // onAuthStateChange listener, in which case setSession's emitted
    // event is dropped. Make sure the listener is up, AND write the
    // resolved session straight into the store as a belt-and-braces.
    ensureAuthSubscription();
    supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => {
      if (!error && data.session) useAuthStore.getState().setSession(data.session);
      router.replace('/(tabs)');
    });
  }, [url]);
  return null;
}

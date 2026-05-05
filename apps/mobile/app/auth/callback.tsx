import { useEffect } from 'react';
import { router } from 'expo-router';
import { useURL } from 'expo-linking';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const url = useURL();
  useEffect(() => {
    if (!url) return;
    const params = new URL(url).searchParams;
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(() => router.replace('/(tabs)'));
    }
  }, [url]);
  return null;
}

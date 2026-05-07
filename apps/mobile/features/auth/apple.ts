import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from './store';
import { ensureAuthSubscription } from './bootstrap';

export const appleAvailable = Platform.OS === 'ios';

export async function signInWithApple(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!appleAvailable) return { ok: false, error: 'iOS only' };
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) return { ok: false, error: 'no identity token' };
    ensureAuthSubscription();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) return { ok: false, error: error.message };
    if (data.session) useAuthStore.getState().setSession(data.session);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'apple sign-in failed' };
  }
}

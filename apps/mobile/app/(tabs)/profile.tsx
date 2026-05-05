import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../../lib/supabase';
import { useT, useI18nStore, syncTranslations } from '../../features/i18n';
import { useAuthStore } from '../../features/auth/store';
import { sendMagicLink } from '../../features/auth/magicLink';
import { appleAvailable, signInWithApple } from '../../features/auth/apple';
import { palette, fontFamily, fontSize, space } from '../../theme';
import type { Locale } from '@kitup/shared-types';

export default function Profile() {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);
  const session = useAuthStore((s) => s.session);

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickLocale(l: Locale) {
    setLocale(l);
    await syncTranslations(l);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/(onboarding)/welcome');
  }

  async function onSendLink() {
    setError(null);
    const r = await sendMagicLink(email);
    r.ok ? setSent(true) : setError(r.error);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
      <View>
        <Text style={styles.label}>{t('profile.language')}</Text>
        <View style={styles.row}>
          {(['tr', 'en'] as const).map((l) => (
            <Pressable
              key={l}
              style={[styles.chip, locale === l && styles.chipActive]}
              onPress={() => pickLocale(l)}
            >
              <Text style={[styles.chipText, locale === l && styles.chipTextActive]}>{l.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text style={styles.label}>{t('profile.create_account')}</Text>
        <TextInput
          placeholder="you@example.com"
          placeholderTextColor={palette.textLow}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            backgroundColor: palette.bgElevated, color: palette.textHigh,
            borderWidth: 1, borderColor: palette.border, borderRadius: 10,
            padding: space.md, fontFamily: fontFamily.body, fontSize: fontSize.md,
          }}
        />
        <Pressable
          style={{ marginTop: space.sm, padding: space.md, alignItems: 'center', borderRadius: 10, backgroundColor: palette.accent }}
          onPress={onSendLink}
        >
          <Text style={{ fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md }}>
            {t('profile.signin.email')}
          </Text>
        </Pressable>
        {sent && <Text style={[styles.muted, { color: palette.success, marginTop: space.sm }]}>Check your email.</Text>}
        {error && <Text style={[styles.muted, { color: palette.danger, marginTop: space.sm }]}>{error}</Text>}
        {appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={12}
            style={{ height: 48, marginTop: space.sm }}
            onPress={() => signInWithApple()}
          />
        )}
      </View>

      {session && (
        <Pressable style={styles.signOut} onPress={signOut}>
          <Text style={styles.signOutText}>{t('profile.sign_out')}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  label: { fontFamily: fontFamily.bodyMedium, color: palette.textMid, fontSize: fontSize.sm, letterSpacing: 1.5, marginBottom: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
  chip: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.bgElevated },
  chipActive: { borderColor: palette.accent, backgroundColor: palette.accentMuted },
  chipText: { fontFamily: fontFamily.body, color: palette.textMid, fontSize: fontSize.sm },
  chipTextActive: { color: palette.textHigh },
  muted: { fontFamily: fontFamily.body, color: palette.textMid, fontSize: fontSize.sm },
  signOut: { marginTop: space.xl, padding: space.md, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: palette.danger },
  signOutText: { fontFamily: fontFamily.bodyMedium, color: palette.danger, fontSize: fontSize.md },
});

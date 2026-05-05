import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useT, useI18nStore, syncTranslations } from '../../features/i18n';
import { useAuthStore } from '../../features/auth/store';
import { palette, fontFamily, fontSize, space } from '../../theme';
import type { Locale } from '@kitup/shared-types';

export default function Profile() {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);
  const session = useAuthStore((s) => s.session);

  async function pickLocale(l: Locale) {
    setLocale(l);
    await syncTranslations(l);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/(onboarding)/welcome');
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

      {/* Account section is filled in Phase 9 (Apple + magic link). For now, show placeholder text. */}
      <View>
        <Text style={styles.label}>{t('profile.create_account')}</Text>
        <Text style={styles.muted}>(Phase 9 fills in Apple + email forms here.)</Text>
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

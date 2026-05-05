import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useT, useI18nStore } from '../../features/i18n';
import { useAuthStore } from '../../features/auth/store';
import { useOnboarding, type Path } from '../../features/onboarding/store';
import { palette, fontFamily, fontSize, space, tracking } from '../../theme';
import { MenuRow, MenuSectionLabel } from '../../components/atmospherics/MenuRow';

const PATH_LABELS: Record<Path, { tr: string; en: string }> = {
  wisdom: { tr: 'Bilge — Odin’in patikası', en: 'The Wise — Odin’s path' },
  warrior: { tr: 'Savaşçı — Tyr’in çağrısı', en: 'The Warrior — Tyr’s call' },
  traveler: { tr: 'Yolcu — Loki’nin yolu', en: 'The Traveler — Loki’s road' },
};

export default function Profile() {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const session = useAuthStore((s) => s.session);
  const path = useOnboarding((s) => s.path);

  const pathValue = path
    ? PATH_LABELS[path][locale === 'en' ? 'en' : 'tr']
    : locale === 'en'
      ? 'Not chosen'
      : 'Henüz seçilmedi';

  const accountValue = session?.user?.email
    ? session.user.email
    : locale === 'en'
      ? 'Anonymous traveler'
      : 'Anonim gezgin';

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/(onboarding)/welcome');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: space.xxxl }}>
      <View style={styles.heroWrap}>
        <Text style={styles.eyebrow}>ᛟ {locale === 'en' ? 'PROFILE' : 'PROFİL'}</Text>
        <Text style={styles.title}>{locale === 'en' ? 'Your Path' : 'Senin Yolun'}</Text>
      </View>

      <MenuSectionLabel>{locale === 'en' ? 'JOURNEY' : 'YOLCULUK'}</MenuSectionLabel>
      <MenuRow
        rune="ᚨ"
        title={locale === 'en' ? 'Path' : 'Yol'}
        value={pathValue}
        onPress={() => router.push('/profile/path')}
      />
      <MenuRow
        rune="ᚦ"
        title={locale === 'en' ? 'Account' : 'Hesap'}
        value={accountValue}
        onPress={() => router.push('/profile/account')}
      />

      <MenuSectionLabel>{locale === 'en' ? 'PREFERENCES' : 'TERCİHLER'}</MenuSectionLabel>
      <MenuRow
        rune="ᚷ"
        title={locale === 'en' ? 'Language' : 'Dil'}
        value={locale === 'tr' ? 'Türkçe' : 'English'}
        onPress={() => router.push('/profile/language')}
      />
      <MenuRow
        rune="ᛒ"
        title={locale === 'en' ? 'Notifications' : 'Bildirimler'}
        value={locale === 'en' ? 'Daily reminder' : 'Günlük hatırlatma'}
        onPress={() => router.push('/profile/notifications')}
      />

      <MenuSectionLabel>{locale === 'en' ? 'ABOUT' : 'HAKKINDA'}</MenuSectionLabel>
      <MenuRow
        rune="ᛞ"
        title={locale === 'en' ? 'About kitUP Norse' : 'kitUP Norse Hakkında'}
        onPress={() => router.push('/profile/about')}
      />

      {session && (
        <View style={{ paddingTop: space.xl }}>
          <MenuRow rune="ᚺ" title={t('profile.sign_out')} onPress={signOut} destructive />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  heroWrap: { paddingHorizontal: space.lg, paddingTop: space.xl, paddingBottom: space.lg },
  eyebrow: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
  title: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.xxl,
    letterSpacing: tracking.tight,
    marginTop: space.xs,
  },
});

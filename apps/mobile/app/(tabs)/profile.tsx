import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useT, useI18nStore } from '../../features/i18n';
import { useAuthStore } from '../../features/auth/store';
import { useOnboarding, type Path } from '../../features/onboarding/store';
import { useLearnerStats } from '../../features/stats/queries';
import { palette, fontFamily, fontSize, space, tracking, radius } from '../../theme';
import { MenuRow, MenuSectionLabel } from '../../components/atmospherics/MenuRow';

const PATH_LABELS: Record<Path, { tr: string; en: string }> = {
  wisdom: { tr: 'Bilge — Odin’in patikası', en: 'The Wise — Odin’s path' },
  warrior: { tr: 'Savaşçı — Tyr’in çağrısı', en: 'The Warrior — Tyr’s call' },
  traveler: { tr: 'Yolcu — Loki’nin yolu', en: 'The Traveler — Loki’s road' },
};

type StatTile = {
  rune: string;
  label: string;
  value: string;
  hint?: string;
};

function StatGrid({ tiles }: { tiles: StatTile[] }) {
  return (
    <View style={styles.statGrid}>
      {tiles.map((tile) => (
        <View key={tile.label} style={styles.statTile}>
          <Text style={styles.statRune}>{tile.rune}</Text>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {tile.value}
          </Text>
          <Text style={styles.statLabel}>{tile.label}</Text>
          {tile.hint && <Text style={styles.statHint}>{tile.hint}</Text>}
        </View>
      ))}
    </View>
  );
}

export default function Profile() {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const session = useAuthStore((s) => s.session);
  const path = useOnboarding((s) => s.path);
  const stats = useLearnerStats();

  const pathValue = path
    ? PATH_LABELS[path][locale === 'en' ? 'en' : 'tr']
    : locale === 'en'
      ? 'Not chosen'
      : 'Henüz seçilmedi';

  const dash = '—';
  const tiles: StatTile[] = [
    {
      rune: 'ᛞ',
      label: locale === 'en' ? 'DAYS DONE' : 'TAMAMLANAN',
      value: stats.data ? `${stats.data.completed}/${stats.data.totalDays}` : dash,
      hint: locale === 'en' ? 'lessons' : 'ders',
    },
    {
      rune: 'ᚦ',
      label: locale === 'en' ? 'AVG SCORE' : 'ORT. SKOR',
      value: stats.data?.avgScore != null ? `${stats.data.avgScore}%` : dash,
      hint: locale === 'en' ? 'across quizzes' : 'tüm quizlerde',
    },
    {
      rune: 'ᛟ',
      label: locale === 'en' ? 'STREAK' : 'SERİ',
      value: stats.data ? String(stats.data.currentStreak) : dash,
      hint:
        stats.data && stats.data.longestStreak > 0
          ? locale === 'en'
            ? `best ${stats.data.longestStreak}`
            : `en uzun ${stats.data.longestStreak}`
          : locale === 'en'
            ? 'days in a row'
            : 'arka arkaya',
    },
    {
      rune: 'ᚱ',
      label: locale === 'en' ? 'REVIEWS' : 'TEKRAR',
      value: stats.data ? String(stats.data.dueReviews) : dash,
      hint: locale === 'en' ? 'due now' : 'şimdi',
    },
  ];

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

      <MenuSectionLabel>{locale === 'en' ? 'STANDING' : 'DURUM'}</MenuSectionLabel>
      <StatGrid tiles={tiles} />

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
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  statTile: {
    flexBasis: '47%',
    flexGrow: 1,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    backgroundColor: 'rgba(201, 169, 110, 0.04)',
    gap: 2,
  },
  statRune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.md,
    opacity: 0.8,
  },
  statValue: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.xl,
    letterSpacing: tracking.tight,
    marginTop: 2,
  },
  statLabel: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    marginTop: 2,
  },
  statHint: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: 11,
    opacity: 0.8,
  },
});

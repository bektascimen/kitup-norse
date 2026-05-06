import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useT } from '../../features/i18n';
import { useAuthStore } from '../../features/auth/store';
import { useOnboarding, type Path } from '../../features/onboarding/store';
import { useLearnerStats } from '../../features/stats/queries';
import { palette, fontFamily, fontSize, space, tracking, radius } from '../../theme';
import { MenuRow, MenuSectionLabel } from '../../components/atmospherics/MenuRow';

const PATH_SUMMARY_KEY: Record<Path, string> = {
  wisdom: 'profile.path_summary.wisdom',
  warrior: 'profile.path_summary.warrior',
  traveler: 'profile.path_summary.traveler',
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
  const session = useAuthStore((s) => s.session);
  const path = useOnboarding((s) => s.path);
  const stats = useLearnerStats();

  const pathValue = path ? t(PATH_SUMMARY_KEY[path]) : t('profile.path.not_chosen');
  const accountValue = session?.user?.email ?? t('profile.account.anonymous');

  const dash = '—';
  const longest = stats.data?.longestStreak ?? 0;
  const tiles: StatTile[] = [
    {
      rune: 'ᛞ',
      label: t('profile.stats.days_done'),
      value: stats.data ? `${stats.data.completed}/${stats.data.totalDays}` : dash,
      hint: t('profile.stats.days_done.hint'),
    },
    {
      rune: 'ᚦ',
      label: t('profile.stats.avg_score'),
      value: stats.data?.avgScore != null ? `${stats.data.avgScore}%` : dash,
      hint: t('profile.stats.avg_score.hint'),
    },
    {
      rune: 'ᛟ',
      label: t('profile.stats.streak'),
      value: stats.data ? String(stats.data.currentStreak) : dash,
      hint:
        longest > 0
          ? t('profile.stats.streak.hint.best', { n: longest })
          : t('profile.stats.streak.hint.fallback'),
    },
    {
      rune: 'ᚱ',
      label: t('profile.stats.reviews'),
      value: stats.data ? String(stats.data.dueReviews) : dash,
      hint: t('profile.stats.reviews.hint'),
    },
  ];

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/(onboarding)/welcome');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: space.xxxl }}>
      <View style={styles.heroWrap}>
        <Text style={styles.eyebrow}>{t('profile.header.eyebrow')}</Text>
        <Text style={styles.title}>{t('profile.header.title')}</Text>
      </View>

      <MenuSectionLabel>{t('profile.section.standing')}</MenuSectionLabel>
      <StatGrid tiles={tiles} />

      <MenuSectionLabel>{t('profile.section.journey')}</MenuSectionLabel>
      <MenuRow
        rune="ᚨ"
        title={t('profile.menu.path')}
        value={pathValue}
        onPress={() => router.push('/profile/path')}
      />
      <MenuRow
        rune="ᚦ"
        title={t('profile.menu.account')}
        value={accountValue}
        onPress={() => router.push('/profile/account')}
      />

      <MenuSectionLabel>{t('profile.section.preferences')}</MenuSectionLabel>
      <MenuRow
        rune="ᚷ"
        title={t('profile.language')}
        value={t('app.language.native')}
        onPress={() => router.push('/profile/language')}
      />
      <MenuRow
        rune="ᛒ"
        title={t('profile.menu.notifications')}
        value={t('profile.menu.notifications.value')}
        onPress={() => router.push('/profile/notifications')}
      />

      <MenuSectionLabel>{t('profile.section.about')}</MenuSectionLabel>
      <MenuRow
        rune="ᛞ"
        title={t('profile.menu.about')}
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

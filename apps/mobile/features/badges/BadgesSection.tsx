import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useT } from '../i18n';
import { palette, fontFamily, fontSize, space, tracking } from '../../theme';
import { BadgeCard } from './BadgeCard';
import { BadgeDetailSheet } from './BadgeDetailSheet';
import { useBadges, type BadgeView } from './useBadges';

export function BadgesSection() {
  const t = useT();
  const { badges, earnedCount } = useBadges();
  const [active, setActive] = useState<BadgeView | null>(null);

  // No auto-ack here — `newlyEarned` is consumed by either the
  // post-quiz SigilUnlockModal (preferred path), or by tapping a card
  // → BadgeDetailSheet's onClose. Auto-acking on render race-conditions
  // with the modal: store update propagates instantly, the modal sees
  // an already-empty `newlyEarned` and never shows.

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.label}>{t('profile.section.sigils')}</Text>
        <Text style={styles.count}>
          {earnedCount}/{badges.length}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {badges.map((b) => (
          <BadgeCard key={b.id} badge={b} onPress={() => setActive(b)} />
        ))}
      </ScrollView>
      <BadgeDetailSheet badge={active} onClose={() => setActive(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.sm,
  },
  label: {
    fontFamily: fontFamily.displayMid,
    color: palette.shadow,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
  count: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
  row: {
    paddingHorizontal: space.lg,
    gap: space.sm,
    paddingVertical: space.xs,
  },
});

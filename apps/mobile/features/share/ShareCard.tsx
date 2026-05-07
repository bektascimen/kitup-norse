import { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, fontFamily, fontSize, space, tracking, radius } from '../../theme';

type Props = {
  dayNumber: number;
  totalDays: number;
  score: number;
  lessonTitle: string;
  dayLabel: string;
  tagline: string;
};

/**
 * Off-screen share-card surface. Composed in app coordinates (430×620
 * roughly square-ish) and snapshotted by react-native-view-shot. Lives
 * outside the main scroll so its layout doesn't fight the parent.
 */
export const ShareCard = forwardRef<View, Props>(function ShareCard(
  { dayNumber, totalDays, score, lessonTitle, dayLabel, tagline },
  ref,
) {
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <LinearGradient
        colors={[palette.bgDeep, palette.twilight, palette.horizon, palette.bgDeep]}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative runes anchored to corners */}
      <Text style={[styles.cornerRune, styles.cornerTL]}>ᚨ</Text>
      <Text style={[styles.cornerRune, styles.cornerTR]}>ᛏ</Text>
      <Text style={[styles.cornerRune, styles.cornerBL]}>ᛚ</Text>
      <Text style={[styles.cornerRune, styles.cornerBR]}>ᛟ</Text>

      <View style={styles.body}>
        <Text style={styles.dayBadge}>
          ᛞ {dayLabel} {String(dayNumber).padStart(2, '0')} / {totalDays}
        </Text>
        <Text style={styles.title} numberOfLines={3}>
          {lessonTitle}
        </Text>
        <View style={styles.divider} />
        <Text style={styles.scoreLabel}>SCORE</Text>
        <Text style={styles.score}>{score}%</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.brand}>kitUP NORSE</Text>
        <Text style={styles.tagline}>{tagline}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 540,
    height: 720,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: palette.bg,
    padding: space.xxl,
    justifyContent: 'space-between',
  },
  cornerRune: {
    position: 'absolute',
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: 28,
    opacity: 0.45,
  },
  cornerTL: { top: 24, left: 28 },
  cornerTR: { top: 24, right: 28 },
  cornerBL: { bottom: 100, left: 28 },
  cornerBR: { bottom: 100, right: 28 },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    gap: space.lg,
  },
  dayBadge: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: 16,
    letterSpacing: tracking.rune,
  },
  title: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: tracking.tight,
    textAlign: 'center',
    maxWidth: 460,
  },
  divider: {
    width: 80,
    height: 1,
    backgroundColor: palette.forge,
    opacity: 0.6,
    marginTop: space.md,
  },
  scoreLabel: {
    fontFamily: fontFamily.displayMid,
    color: palette.mist,
    fontSize: 12,
    letterSpacing: tracking.rune,
    marginTop: space.md,
  },
  score: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: 96,
    letterSpacing: tracking.tight,
    lineHeight: 110,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  brand: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: 14,
    letterSpacing: tracking.rune,
  },
  tagline: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: 13,
    opacity: 0.85,
  },
});

export const SHARE_CARD_OFFSCREEN: Pick<
  Props,
  'dayNumber' | 'totalDays' | 'score' | 'lessonTitle' | 'dayLabel' | 'tagline'
> = {
  dayNumber: 0,
  totalDays: 21,
  score: 0,
  lessonTitle: '',
  dayLabel: 'DAY',
  tagline: '',
};

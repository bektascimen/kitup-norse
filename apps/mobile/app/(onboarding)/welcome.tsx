import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';
import { CarvedDivider } from '../../components/atmospherics/CarvedDivider';

// Each rune sits at an asymmetric anchor — top/right/bottom percentages
// keep them anchored to the canvas edges, never colliding with the
// centered text column. The fade values stagger depth so the eye
// reads them as carved into the background, not stamped on top.
type Rune = {
  glyph: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: number;
  opacity: number;
  delay: number;
};

// Top band sits above the eyebrow (~22% Y), bottom band fills the
// negative space between the body line and the CTA. Nothing lands in
// the title/body strip (~30%–60% Y), so the runes never collide with
// text regardless of how the translations wrap.
const SCATTERED: Rune[] = [
  { glyph: 'ᚦ', top: '7%', left: '8%', size: 22, opacity: 0.28, delay: 200 },
  { glyph: 'ᚱ', top: '13%', right: '10%', size: 26, opacity: 0.22, delay: 360 },
  { glyph: 'ᚨ', bottom: '38%', left: '6%', size: 20, opacity: 0.32, delay: 520 },
  { glyph: 'ᛚ', bottom: '32%', right: '14%', size: 24, opacity: 0.26, delay: 680 },
  { glyph: 'ᚷ', bottom: '22%', left: '24%', size: 22, opacity: 0.26, delay: 840 },
  { glyph: 'ᛞ', bottom: '14%', right: '8%', size: 20, opacity: 0.22, delay: 1000 },
];

function ScatteredRunes() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {SCATTERED.map((r, i) => (
        <Animated.Text
          key={`${r.glyph}-${i}`}
          entering={FadeIn.delay(r.delay).duration(1400)}
          style={[
            styles.scatterRune,
            {
              top: r.top as unknown as number | undefined,
              bottom: r.bottom as unknown as number | undefined,
              left: r.left as unknown as number | undefined,
              right: r.right as unknown as number | undefined,
              fontSize: r.size,
              opacity: r.opacity,
            },
          ]}
        >
          {r.glyph}
        </Animated.Text>
      ))}
    </View>
  );
}

export default function Welcome() {
  const t = useT();
  return (
    <View style={styles.container}>
      <GradientBackdrop variant="night" />
      <ScatteredRunes />
      <View style={styles.content}>
        <Animated.Text entering={FadeIn.duration(900)} style={styles.eyebrow}>
          {t('onboarding.welcome.eyebrow')}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(200).duration(900)} style={styles.title}>
          {t('onboarding.welcome.title')}
        </Animated.Text>
        <CarvedDivider />
        <Animated.Text entering={FadeInUp.delay(500).duration(900)} style={styles.body}>
          {t('onboarding.welcome.body')}
        </Animated.Text>
      </View>
      <Animated.View entering={FadeInUp.delay(800).duration(700)} style={styles.ctaWrap}>
        <Pressable style={styles.cta} onPress={() => router.push('/(onboarding)/why')}>
          <Text style={styles.ctaText}>{t('onboarding.cta.continue')}</Text>
          <Text style={styles.ctaRune}> ›</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  scatterRune: {
    position: 'absolute',
    fontFamily: fontFamily.display,
    color: palette.forge,
    letterSpacing: 4,
    includeFontPadding: false,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
  },
  eyebrow: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    marginBottom: space.lg,
  },
  title: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.hero,
    lineHeight: fontSize.hero * 1.05,
    letterSpacing: tracking.tight,
  },
  body: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * 1.55,
    maxWidth: 320,
  },
  ctaWrap: { paddingHorizontal: space.xl, paddingBottom: space.xxxl },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    borderTopWidth: 1,
    borderTopColor: palette.forge,
  },
  ctaText: {
    fontFamily: fontFamily.displayMid,
    color: palette.parchment,
    fontSize: fontSize.md,
    letterSpacing: tracking.wide,
  },
  ctaRune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.lg,
  },
});

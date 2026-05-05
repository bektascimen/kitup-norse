import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useT } from '../../features/i18n';
import { useI18nStore } from '../../features/i18n';
import { palette, fontFamily, fontSize, space, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';
import { CarvedDivider } from '../../components/atmospherics/CarvedDivider';

// Hardcoded Turkish/English fallbacks — these screens describe the offer,
// they live outside the dynamic translation table for now.
const COPY = {
  tr: {
    eyebrow: 'ᚱ  GÜNDE 5 DAKIKA',
    bigUnit: 'GÜN',
    body: 'Her gün kısa bir hikaye, hızlı bir quiz. Yanlış bildiklerini sistem sana tekrar sorar — bilim destekli aralıklı tekrar.',
  },
  en: {
    eyebrow: 'ᚱ  FIVE MINUTES A DAY',
    bigUnit: 'DAYS',
    body: 'Each day, a short story and a quick quiz. The ones you miss return to you — spaced repetition, quietly insistent.',
  },
} as const;

export default function Why() {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const copy = COPY[locale === 'en' ? 'en' : 'tr'];

  return (
    <View style={styles.container}>
      <GradientBackdrop variant="night" />
      <View style={styles.content}>
        <Animated.Text entering={FadeIn.duration(900)} style={styles.eyebrow}>
          {copy.eyebrow}
        </Animated.Text>
        <View style={styles.numberRow}>
          <Animated.Text entering={FadeInUp.delay(150).duration(900)} style={styles.bigNumber}>
            21
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(300).duration(900)} style={styles.bigUnit}>
            {copy.bigUnit}
          </Animated.Text>
        </View>
        <CarvedDivider />
        <Animated.Text entering={FadeInUp.delay(500).duration(900)} style={styles.body}>
          {copy.body}
        </Animated.Text>
      </View>
      <Animated.View entering={FadeInUp.delay(800).duration(700)} style={styles.ctaWrap}>
        <Pressable style={styles.cta} onPress={() => router.push('/(onboarding)/language')}>
          <Text style={styles.ctaText}>{t('onboarding.cta.continue')}</Text>
          <Text style={styles.ctaRune}> ›</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
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
    marginBottom: space.xl,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.lg,
  },
  bigNumber: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.mega + 24, // 80
    letterSpacing: tracking.tight,
    lineHeight: (fontSize.mega + 24) * 0.95,
  },
  bigUnit: {
    fontFamily: fontFamily.displayMid,
    color: palette.mist,
    fontSize: fontSize.md,
    letterSpacing: tracking.rune,
    paddingBottom: space.lg,
  },
  body: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * 1.55,
    maxWidth: 360,
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

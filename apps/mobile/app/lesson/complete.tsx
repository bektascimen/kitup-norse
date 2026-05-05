import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { useT } from '../../features/i18n';
import { useI18nStore } from '../../features/i18n';
import { palette, fontFamily, fontSize, space, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';

const TOMORROW_MSG = {
  tr: 'Yarın seni bekliyorum.',
  en: 'I will wait for you tomorrow.',
} as const;

const ALREADY_DONE_MSG = {
  tr: 'Bu günü çoktan kazandın.',
  en: 'You have already earned this day.',
} as const;

export default function Complete() {
  const t = useT();
  const { score, alreadyDone } = useLocalSearchParams<{
    score: string;
    alreadyDone?: string;
  }>();
  const locale = useI18nStore((s) => s.locale);
  const isReplay = alreadyDone === '1';

  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const runeStyle = useAnimatedStyle(() => ({
    opacity: 0.7 + pulse.value * 0.3,
    transform: [{ scale: 1 + pulse.value * 0.05 }],
  }));

  const tomorrow = (isReplay ? ALREADY_DONE_MSG : TOMORROW_MSG)[locale === 'en' ? 'en' : 'tr'];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <GradientBackdrop variant="ember" />

      <View style={styles.top}>
        <Animated.Text entering={FadeIn.duration(900)} style={styles.eyebrow}>
          ᛞ{' '}
          {isReplay
            ? locale === 'en'
              ? 'ALREADY EARNED'
              : 'ZATEN KAZANILDI'
            : locale === 'en'
              ? 'TODAY’S DEED'
              : 'BUGÜNLÜK'}
        </Animated.Text>
      </View>

      <View style={styles.center}>
        <Animated.Text entering={FadeIn.duration(1500)} style={[styles.bigRune, runeStyle]}>
          ᛟ
        </Animated.Text>

        <Animated.Text entering={FadeInUp.delay(800).duration(900)} style={styles.scoreLabel}>
          {t('day.complete.title').toUpperCase()}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(1000).duration(900)} style={styles.score}>
          {score ?? '0'}%
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(1300).duration(900)} style={styles.body}>
          {tomorrow}
        </Animated.Text>
      </View>

      <Animated.View entering={FadeInUp.delay(1700).duration(700)} style={styles.ctaWrap}>
        <Pressable style={styles.cta} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.ctaText}>{t('onboarding.cta.continue')}</Text>
          <Text style={styles.ctaRune}> ›</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  top: {
    paddingTop: space.xxxl + space.lg,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    gap: space.md,
  },
  eyebrow: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
  bigRune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: 200,
    lineHeight: 220,
    textAlign: 'center',
    marginBottom: space.xl,
  },
  scoreLabel: {
    fontFamily: fontFamily.displayMid,
    color: palette.mist,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
  score: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.mega,
    letterSpacing: tracking.tight,
  },
  body: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.lg,
    textAlign: 'center',
    marginTop: space.lg,
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

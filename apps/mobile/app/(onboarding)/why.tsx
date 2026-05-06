import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';
import { CarvedDivider } from '../../components/atmospherics/CarvedDivider';

export default function Why() {
  const t = useT();

  return (
    <View style={styles.container}>
      <GradientBackdrop variant="night" />
      <View style={styles.content}>
        <Animated.Text entering={FadeIn.duration(900)} style={styles.eyebrow}>
          {t('onboarding.why.eyebrow')}
        </Animated.Text>
        <View style={styles.numberRow}>
          <Animated.Text entering={FadeInUp.delay(150).duration(900)} style={styles.bigNumber}>
            21
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(300).duration(900)} style={styles.bigUnit}>
            {t('onboarding.why.big_unit')}
          </Animated.Text>
        </View>
        <CarvedDivider />
        <Animated.Text entering={FadeInUp.delay(500).duration(900)} style={styles.body}>
          {t('onboarding.why.body')}
        </Animated.Text>
      </View>
      <Animated.View entering={FadeInUp.delay(800).duration(700)} style={styles.ctaWrap}>
        <Pressable style={styles.cta} onPress={() => router.push('/(onboarding)/path')}>
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
    paddingTop: space.md,
  },
  bigNumber: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.mega + 24,
    letterSpacing: tracking.normal,
    lineHeight: (fontSize.mega + 24) * 1.1,
    includeFontPadding: false,
    paddingHorizontal: 4,
  },
  bigUnit: {
    fontFamily: fontFamily.displayMid,
    color: palette.mist,
    fontSize: fontSize.md,
    letterSpacing: tracking.rune,
    paddingBottom: space.xl,
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

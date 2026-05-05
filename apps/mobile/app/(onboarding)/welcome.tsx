import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';
import { RuneColumn } from '../../components/atmospherics/RuneColumn';
import { CarvedDivider } from '../../components/atmospherics/CarvedDivider';

export default function Welcome() {
  const t = useT();
  return (
    <View style={styles.container}>
      <GradientBackdrop variant="dawn" />
      <View style={styles.runeColumnLeft}>
        <RuneColumn />
      </View>
      <View style={styles.content}>
        <Animated.Text entering={FadeIn.duration(900)} style={styles.eyebrow}>
          ᛇ 21 GÜN ᛇ NORSE MITOLOJI
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
  runeColumnLeft: { position: 'absolute', left: space.md, top: '20%' },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
    paddingLeft: space.xxxl,
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

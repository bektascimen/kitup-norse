import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { palette, fontFamily, fontSize, space, tracking } from '../../theme';
import { GradientBackdrop } from './GradientBackdrop';

/**
 * Cold-start loading surface. Shown after the native splash hides
 * but before the first translations sync resolves — gives the user
 * an on-brand, breathing screen instead of a black flash.
 *
 * The big rune slowly pulses (scale + opacity) and a row of fainter
 * sibling runes shimmer in sequence to imply progress. No spinner,
 * no text "Loading…" — the motion does the work.
 */
export function LoadingScreen() {
  const pulse = useSharedValue(0);
  const dot1 = useSharedValue(0.2);
  const dot2 = useSharedValue(0.2);
  const dot3 = useSharedValue(0.2);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    const wave = (sv: typeof dot1, delay: number) => {
      sv.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: delay }),
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.2, { duration: 500, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.2, { duration: 1500 - delay }),
        ),
        -1,
        false,
      );
    };
    wave(dot1, 0);
    wave(dot2, 200);
    wave(dot3, 400);
  }, [pulse, dot1, dot2, dot3]);

  const runeStyle = useAnimatedStyle(() => ({
    opacity: 0.65 + pulse.value * 0.35,
    transform: [{ scale: 1 + pulse.value * 0.06 }],
  }));
  const d1Style = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const d2Style = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const d3Style = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={styles.root}>
      <GradientBackdrop variant="night" />

      <View style={styles.center}>
        <Animated.Text entering={FadeIn.duration(700)} style={[styles.bigRune, runeStyle]}>
          ᛟ
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(200).duration(700)} style={styles.brand}>
          kitUP NORSE
        </Animated.Text>
        <Animated.Text entering={FadeIn.delay(350).duration(800)} style={styles.tagline}>
          21 days of myth
        </Animated.Text>

        <View style={styles.dots}>
          <Animated.Text style={[styles.dot, d1Style]}>ᚦ</Animated.Text>
          <Animated.Text style={[styles.dot, d2Style]}>ᚱ</Animated.Text>
          <Animated.Text style={[styles.dot, d3Style]}>ᛚ</Animated.Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  bigRune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: 140,
    lineHeight: 156,
    textAlign: 'center',
  },
  brand: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.xl,
    letterSpacing: tracking.wide,
    marginTop: space.lg,
  },
  tagline: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.forge,
    fontSize: fontSize.sm,
    letterSpacing: tracking.normal,
    opacity: 0.85,
  },
  dots: {
    flexDirection: 'row',
    gap: space.xl,
    marginTop: space.xxl + space.lg,
  },
  dot: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.lg,
  },
});

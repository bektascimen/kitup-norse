import { useEffect, useRef } from 'react';
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
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useT } from '../../features/i18n';
import { useLesson } from '../../features/lessons/lessonQuery';
import { palette, fontFamily, fontSize, space, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';
import { ShareCard } from '../../features/share/ShareCard';

export default function Complete() {
  const t = useT();
  const { score, alreadyDone, lessonId } = useLocalSearchParams<{
    score: string;
    alreadyDone?: string;
    lessonId?: string;
  }>();
  const isReplay = alreadyDone === '1';
  const lesson = useLesson(lessonId);

  const pulse = useSharedValue(0);
  const cardRef = useRef<View>(null);

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

  const eyebrow = isReplay ? t('day.complete.eyebrow.replay') : t('day.complete.eyebrow');
  const tomorrow = isReplay ? t('day.complete.body.replay') : t('day.complete.body.tomorrow');
  const scoreNum = Number(score ?? '0');
  const dayNumber = lesson.data?.day_number ?? 0;
  const lessonTitle = lesson.data ? t(lesson.data.title_key) : '';

  async function share() {
    if (!cardRef.current) return;
    try {
      const uri = await captureRef(cardRef.current, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const ok = await Sharing.isAvailableAsync();
      if (ok) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'kitUP Norse',
        });
      }
    } catch (e) {
      console.warn('[share] failed', e);
    }
  }

  const canShare = !!lesson.data && !!score;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <GradientBackdrop variant="ember" />

      <View style={styles.top}>
        <Animated.Text entering={FadeIn.duration(900)} style={styles.eyebrow}>
          {eyebrow}
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
        {canShare && (
          <Pressable style={styles.shareCta} onPress={share}>
            <Text style={styles.shareCtaText}>↑ {t('day.complete.share')}</Text>
          </Pressable>
        )}
        <Pressable style={styles.cta} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.ctaText}>{t('onboarding.cta.continue')}</Text>
          <Text style={styles.ctaRune}> ›</Text>
        </Pressable>
      </Animated.View>

      {/* Off-screen capture surface — never visible to the user but
          rendered into the layout so view-shot can snapshot it. */}
      <View style={styles.offscreen} pointerEvents="none">
        <ShareCard
          ref={cardRef}
          dayNumber={dayNumber}
          totalDays={21}
          score={scoreNum}
          lessonTitle={lessonTitle}
          dayLabel={t('day.complete.share.day_label')}
          tagline={t('day.complete.share.tagline')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  top: { paddingTop: space.xxxl + space.lg, alignItems: 'center' },
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
  ctaWrap: { paddingHorizontal: space.xl, paddingBottom: space.xxxl, gap: space.md },
  shareCta: {
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.forge,
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
    alignSelf: 'center',
  },
  shareCtaText: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.sm,
    letterSpacing: tracking.rune,
  },
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
  ctaRune: { fontFamily: fontFamily.display, color: palette.forge, fontSize: fontSize.lg },
  offscreen: {
    position: 'absolute',
    left: -10_000,
    top: -10_000,
    opacity: 0,
  },
});

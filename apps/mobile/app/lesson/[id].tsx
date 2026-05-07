import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useLesson } from '../../features/lessons/lessonQuery';
import { useLessonProgress } from '../../features/lessons/lessonProgressQuery';
import {
  clearLessonScroll,
  getLessonScroll,
  saveLessonScroll,
} from '../../features/resume/storage';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space, tracking, radius } from '../../theme';
import Body from '../../components/Markdown';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';
import { CarvedDivider } from '../../components/atmospherics/CarvedDivider';
import { HeaderBack } from '../../components/atmospherics/HeaderBack';
import { AskSkaldModal } from '../../features/skald/AskSkaldModal';
import { SpeakButton } from '../../features/skald/SpeakButton';

const SCROLL_SAVE_INTERVAL_MS = 250;

export default function LessonScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = useLesson(id);
  const progress = useLessonProgress(id);
  const [skaldOpen, setSkaldOpen] = useState(false);

  // Resume-where-you-left-off: restore the last scroll Y once content
  // is measured, throttle-save while the user reads, capture the final
  // Y on every drag/momentum end (the leading-edge throttle alone
  // misses the resting position), and drop the saved offset once the
  // lesson is marked complete (re-entry should always start fresh).
  const scrollRef = useRef<ScrollView>(null);
  const lastSaveTsRef = useRef(0);
  const lastYRef = useRef(0);
  const lastMaxYRef = useRef(0);
  const restoredRef = useRef(false);
  const prevHRef = useRef(0);
  const initial = useRef(getLessonScroll(id)).current;

  useEffect(() => {
    if (progress.data?.completed_at) clearLessonScroll(id);
  }, [id, progress.data?.completed_at]);

  // Backstop: once the lesson data is in, fire the restore on the next
  // few frames as a fallback for cases where onContentSizeChange's
  // "settled" detection bails before the full body has measured.
  useEffect(() => {
    if (restoredRef.current) return;
    if (initial === 0) return;
    if (!lesson.data) return;
    const targets = initial === 'bottom' ? [0, 200, 600] : [200, 600];
    const handles = targets.map((delay) =>
      setTimeout(() => {
        if (initial === 'bottom') {
          // Pass a Y past any plausible content; RN clamps to max scroll.
          scrollRef.current?.scrollTo({ y: 1_000_000, animated: false });
        } else {
          scrollRef.current?.scrollTo({ y: initial, animated: false });
        }
      }, delay),
    );
    return () => handles.forEach(clearTimeout);
  }, [initial, lesson.data?.id]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    // iOS bounce reports Y past the real maximum during overscroll —
    // clamp against contentSize/layout so a kill at the bottom-edge
    // bounce doesn't persist e.g. Y=3000 on a 1500-tall lesson.
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const maxY = Math.max(0, contentSize.height - layoutMeasurement.height);
    const y = Math.min(maxY, Math.max(0, contentOffset.y));
    lastYRef.current = y;
    lastMaxYRef.current = maxY;
    const now = Date.now();
    if (now - lastSaveTsRef.current < SCROLL_SAVE_INTERVAL_MS) return;
    lastSaveTsRef.current = now;
    saveLessonScroll(id, y, maxY);
  }

  // Always persist the resting position when scrolling stops, so the
  // last-known offset matches what the user is actually looking at.
  function flushScroll() {
    saveLessonScroll(id, lastYRef.current, lastMaxYRef.current);
  }

  function onContentSizeChange(_w: number, h: number) {
    if (restoredRef.current) return;
    if (initial === 0) {
      restoredRef.current = true;
      return;
    }
    if (h <= 0) return;
    // Content lays out in passes — first the hero (≈540px), then the
    // markdown body grows the total height. Re-fire on every size
    // change so we always end up against the fully-measured content.
    if (initial === 'bottom') {
      scrollRef.current?.scrollToEnd({ animated: false });
    } else {
      scrollRef.current?.scrollTo({ y: initial, animated: false });
    }
    // Only finalize once height has either reached the saved Y (for
    // numeric restores) or stopped growing (content settled).
    const settled = (typeof initial === 'number' && h >= initial) || h <= prevHRef.current;
    if (settled) restoredRef.current = true;
    prevHRef.current = h;
  }

  const headerOptions = {
    title: lesson.data
      ? `${t('lesson.day_long')} ${String(lesson.data.day_number).padStart(2, '0')}`
      : t('lesson.header.title'),
    headerLeft: () => <HeaderBack label={t('lesson.header.back')} />,
    headerStyle: { backgroundColor: palette.bg },
    headerTintColor: palette.parchment,
    headerShadowVisible: false,
    headerTitleStyle: { fontFamily: fontFamily.display, fontSize: 18 },
    headerBackVisible: false,
  };

  if (lesson.isLoading)
    return (
      <View style={styles.center}>
        <Stack.Screen options={headerOptions} />
        <GradientBackdrop variant="night" />
        <ActivityIndicator color={palette.forge} />
      </View>
    );
  if (!lesson.data) return null;

  const quizId = (lesson.data.quizzes as { id?: string }[] | { id?: string } | undefined)
    ? Array.isArray(lesson.data.quizzes)
      ? lesson.data.quizzes[0]?.id
      : (lesson.data.quizzes as { id?: string }).id
    : undefined;

  const heroUri = lesson.data.hero_image_url ?? null;
  const completed = !!progress.data?.completed_at;
  const completedScore = progress.data?.score ?? null;

  return (
    <View style={styles.root}>
      <Stack.Screen options={headerOptions} />
      <GradientBackdrop variant="night" />
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: space.xxxl }}
        onScroll={onScroll}
        onScrollEndDrag={flushScroll}
        onMomentumScrollEnd={flushScroll}
        scrollEventThrottle={64}
        onContentSizeChange={onContentSizeChange}
      >
        {heroUri ? (
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: heroUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={400}
            />
            <LinearGradient
              colors={['transparent', 'transparent', palette.bg]}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </View>
        ) : (
          <View style={[styles.heroWrap, { backgroundColor: palette.twilight }]} />
        )}

        <View style={styles.body}>
          <View style={styles.dayRow}>
            <Animated.Text entering={FadeIn.duration(700)} style={styles.day}>
              ᛞ {t('lesson.day_short')} {String(lesson.data.day_number).padStart(2, '0')}
            </Animated.Text>
            {completed && (
              <Animated.View entering={FadeIn.duration(700)} style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>
                  ✓ {t('lesson.completed_badge')}
                  {completedScore != null ? ` · ${completedScore}%` : ''}
                </Text>
              </Animated.View>
            )}
          </View>
          <Animated.Text entering={FadeInUp.delay(120).duration(800)} style={styles.title}>
            {t(lesson.data.title_key)}
          </Animated.Text>
          <Animated.View entering={FadeInUp.delay(280).duration(800)}>
            <SpeakButton text={t(lesson.data.body_key)} lessonId={lesson.data.id} />
            <Body>{t(lesson.data.body_key)}</Body>
          </Animated.View>

          <CarvedDivider />
          {completed ? (
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionBtn, styles.actionSecondary]}
                onPress={() => setSkaldOpen(true)}
              >
                <Text style={styles.actionSecondaryText}>{t('lesson.ask_skald.cta')}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.actionDone]}
                onPress={() => router.replace('/(tabs)')}
              >
                <Text style={styles.actionDoneText}>{t('lesson.cta.back_to_today')}</Text>
              </Pressable>
            </View>
          ) : quizId ? (
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionBtn, styles.actionSecondary]}
                onPress={() => setSkaldOpen(true)}
              >
                <Text style={styles.actionSecondaryText}>{t('lesson.ask_skald.cta')}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, styles.actionPrimary]}
                onPress={() => router.push(`/quiz/${quizId}`)}
              >
                <Text style={styles.actionPrimaryText}>{t('lesson.cta.continue_quiz')}</Text>
                <Text style={styles.actionPrimaryRune}> ›</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <AskSkaldModal
        visible={skaldOpen}
        onClose={() => setSkaldOpen(false)}
        lessonTitle={t(lesson.data.title_key)}
        lessonBody={t(lesson.data.body_key)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.bg,
  },
  heroWrap: {
    width: '100%',
    aspectRatio: 4 / 5,
    overflow: 'hidden',
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  body: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    gap: space.sm,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  day: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
  completedBadge: {
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.moss,
    backgroundColor: 'rgba(90, 140, 92, 0.10)',
  },
  completedBadgeText: {
    fontFamily: fontFamily.displayMid,
    color: palette.moss,
    fontSize: 10,
    letterSpacing: tracking.rune,
  },
  title: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.xxl,
    letterSpacing: tracking.tight,
    lineHeight: fontSize.xxl * 1.1,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    borderTopWidth: 1,
    borderTopColor: palette.forge,
  },
  ctaCompleted: { borderTopColor: palette.moss },
  actionRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.md + 2,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  actionSecondary: {
    borderColor: palette.forge,
    backgroundColor: 'rgba(201, 169, 110, 0.06)',
  },
  actionSecondaryText: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    textAlign: 'center',
  },
  actionPrimary: {
    borderColor: palette.forge,
    backgroundColor: palette.forge,
  },
  actionPrimaryText: {
    fontFamily: fontFamily.displayMid,
    color: palette.bg,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
  actionPrimaryRune: {
    fontFamily: fontFamily.display,
    color: palette.bg,
    fontSize: fontSize.md,
  },
  actionDone: {
    borderColor: palette.moss,
    backgroundColor: 'rgba(90, 140, 92, 0.08)',
  },
  actionDoneText: {
    fontFamily: fontFamily.displayMid,
    color: palette.moss,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    textAlign: 'center',
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

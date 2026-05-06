import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useT } from '../../features/i18n';
import { useActiveCourse, useLessons, useUserProgress } from '../../features/lessons/queries';
import { useUserStreak } from '../../features/streak/query';
import { prefetchCourse } from '../../features/lessons/prefetch';
import { dueCount } from '../../features/sr/queue';
import { syncTodayWidget } from '../../features/widget/sync';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';
import { CarvedDivider } from '../../components/atmospherics/CarvedDivider';

export default function Today() {
  const t = useT();
  const course = useActiveCourse();
  const lessons = useLessons(course.data?.id);
  const progress = useUserProgress();
  const streak = useUserStreak();
  const reviewsDueQ = useQuery({ queryKey: ['reviews-due'], queryFn: dueCount });

  const completed = new Set(
    (progress.data ?? []).filter((p) => p.completed_at).map((p) => p.lesson_id),
  );
  const todays = (lessons.data ?? []).find((l) => !completed.has(l.id));

  // Day-gating: one lesson per calendar day. If the user finished any
  // lesson today, hide the next one until tomorrow — the cadence the
  // 21-day journey was designed around.
  const completedToday = (progress.data ?? []).some((p) => {
    if (!p.completed_at) return false;
    const done = new Date(p.completed_at);
    const now = new Date();
    return (
      done.getFullYear() === now.getFullYear() &&
      done.getMonth() === now.getMonth() &&
      done.getDate() === now.getDate()
    );
  });

  useEffect(() => {
    if (course.data?.id) prefetchCourse(course.data.id);
  }, [course.data?.id]);

  useEffect(() => {
    if (course.data && todays) {
      syncTodayWidget({
        title: t(todays.title_key),
        day: todays.day_number,
        totalDays: course.data.day_count,
      });
    }
  }, [course.data?.id, todays?.id]);

  if (course.isLoading || lessons.isLoading || progress.isLoading) {
    return (
      <View style={styles.center}>
        <GradientBackdrop variant="night" />
        <ActivityIndicator color={palette.forge} />
      </View>
    );
  }
  if (!course.data) {
    return (
      <View style={styles.center}>
        <GradientBackdrop variant="night" />
        <Text style={styles.wolfRune}>🐺</Text>
        <CarvedDivider />
        <Text style={styles.muted}>{t('today.empty.body')}</Text>
      </View>
    );
  }

  if (!todays) {
    return (
      <View style={styles.center}>
        <GradientBackdrop variant="night" />
        <Text style={styles.eyebrow}>{t('today.complete.eyebrow')}</Text>
        <Text style={styles.title}>{t('day.complete.title')}</Text>
        <CarvedDivider />
        <Text style={styles.muted}>{t('day.complete.body')}</Text>
      </View>
    );
  }

  if (completedToday) {
    return (
      <View style={styles.center}>
        <GradientBackdrop variant="night" />
        <Text style={styles.eyebrow}>{t('today.rest.eyebrow')}</Text>
        <Text style={styles.title}>{t('day.complete.title')}</Text>
        <CarvedDivider />
        <Text style={styles.muted}>{t('day.complete.body.tomorrow')}</Text>
      </View>
    );
  }

  const heroUri = (todays as { hero_image_url?: string | null }).hero_image_url ?? null;
  const streakDays = streak.data?.current_streak ?? 0;
  const reviewsCount = reviewsDueQ.data ?? 0;

  return (
    <View style={styles.root}>
      <GradientBackdrop variant="night" />
      <ScrollView
        contentContainerStyle={{
          padding: space.xl,
          paddingTop: space.xxl,
          paddingBottom: space.xxxl,
          gap: space.lg,
        }}
      >
        <Animated.Text entering={FadeIn.duration(700)} style={styles.dayBadge}>
          ᛞ {t('today.day_badge')} {String(todays.day_number).padStart(2, '0')} /{' '}
          {course.data.day_count}
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(120).duration(800)}>
          <Pressable style={styles.hero} onPress={() => router.push(`/lesson/${todays.id}`)}>
            {heroUri ? (
              <Image
                source={{ uri: heroUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={400}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.heroFallback]} />
            )}
            <View style={styles.heroOverlay} />
            <View style={styles.heroBody}>
              <Text style={styles.heroEyebrow}>{t('today.hero.eyebrow')}</Text>
              <Text numberOfLines={3} style={styles.heroTitle}>
                {t(todays.title_key)}
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(280).duration(800)} style={styles.chipRow}>
          {streakDays > 0 && (
            <View style={styles.chip}>
              <Text style={styles.chipRune}>ᛗ</Text>
              <Text style={styles.chipText}>
                {t(streakDays === 1 ? 'today.streak.days_one' : 'today.streak.days_other', {
                  count: streakDays,
                })}
              </Text>
            </View>
          )}
          {reviewsCount > 0 && (
            <Pressable
              onPress={() => router.push('/review')}
              style={[styles.chip, styles.chipAccent]}
            >
              <Text style={styles.chipRune}>ᚦ</Text>
              <Text style={styles.chipText}>{t('today.reviews_due', { count: reviewsCount })}</Text>
            </Pressable>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(420).duration(800)}>
          <Pressable style={styles.cta} onPress={() => router.push(`/lesson/${todays.id}`)}>
            <Text style={styles.ctaText}>{t('today.cta.start')}</Text>
            <Text style={styles.ctaRune}> ›</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.bg,
    paddingHorizontal: space.xl,
  },
  wolfRune: { fontSize: 96, marginBottom: space.md },
  dayBadge: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
  eyebrow: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    textAlign: 'center',
  },
  title: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.xxl,
    textAlign: 'center',
    letterSpacing: tracking.tight,
  },
  muted: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: fontSize.md * 1.6,
    maxWidth: 320,
  },
  hero: {
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    backgroundColor: palette.bgElevated,
  },
  heroFallback: { backgroundColor: palette.twilight },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 9, 18, 0.55)',
  },
  heroBody: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    bottom: space.lg,
    gap: space.sm,
  },
  heroEyebrow: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
  heroTitle: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.xl,
    letterSpacing: tracking.tight,
    lineHeight: fontSize.xl * 1.15,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.bgElevated,
    gap: space.sm,
  },
  chipAccent: {
    borderColor: palette.forge,
  },
  chipRune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.md,
  },
  chipText: {
    fontFamily: fontFamily.displayMid,
    color: palette.parchment,
    fontSize: fontSize.xs,
    letterSpacing: tracking.wide,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    borderTopWidth: 1,
    borderTopColor: palette.forge,
    marginTop: space.md,
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

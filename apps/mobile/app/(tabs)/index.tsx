import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useT } from '../../features/i18n';
import { useActiveCourse, useLessons, useUserProgress } from '../../features/lessons/queries';
import { dueCount } from '../../features/sr/queue';
import { palette, fontFamily, fontSize, space } from '../../theme';

export default function Today() {
  const t = useT();
  const course = useActiveCourse();
  const lessons = useLessons(course.data?.id);
  const progress = useUserProgress();
  const reviewsDueQ = useQuery({ queryKey: ['reviews-due'], queryFn: dueCount });

  if (course.isLoading || lessons.isLoading || progress.isLoading) {
    return <View style={styles.center}><ActivityIndicator color={palette.accent} /></View>;
  }
  if (!course.data) {
    return <View style={styles.center}><Text style={styles.muted}>No course available</Text></View>;
  }

  const completed = new Set((progress.data ?? []).filter(p => p.completed_at).map(p => p.lesson_id));
  const todays = (lessons.data ?? []).find(l => !completed.has(l.id));

  if (!todays) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{t('day.complete.title')}</Text>
        <Text style={styles.muted}>{t('day.complete.body')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.dayBadge}>Day {todays.day_number} / {course.data.day_count}</Text>
      {reviewsDueQ.data && reviewsDueQ.data > 0 && (
        <Pressable onPress={() => router.push('/review')} style={styles.reviewBadge}>
          <Text style={styles.reviewBadgeText}>{t('today.reviews_due', { count: reviewsDueQ.data })}</Text>
        </Pressable>
      )}
      <Text style={styles.title}>{t(todays.title_key)}</Text>
      <Pressable
        style={styles.cta}
        onPress={() => router.push(`/lesson/${todays.id}`)}
      >
        <Text style={styles.ctaText}>{t('today.cta.start')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.xl, gap: space.md, backgroundColor: palette.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  dayBadge: { fontFamily: fontFamily.bodyMedium, color: palette.accent, fontSize: fontSize.sm, letterSpacing: 2 },
  title: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.xxl },
  muted: { fontFamily: fontFamily.body, color: palette.textMid, fontSize: fontSize.md, textAlign: 'center', marginTop: space.md },
  cta: { marginTop: space.xl, padding: space.lg, backgroundColor: palette.accent, borderRadius: 12, alignItems: 'center' },
  ctaText: { fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md },
  reviewBadge: { padding: space.sm, backgroundColor: palette.bgElevated, borderRadius: 999, alignSelf: 'flex-start' },
  reviewBadgeText: { fontFamily: fontFamily.bodyMedium, color: palette.accent, fontSize: fontSize.sm },
});

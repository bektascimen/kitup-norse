import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useT } from '../../features/i18n';
import { useActiveCourse, useLessons, useUserProgress } from '../../features/lessons/queries';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';

type Lesson = {
  id: string;
  day_number: number;
  title_key: string;
};

export default function Path() {
  const t = useT();
  const course = useActiveCourse();
  const lessons = useLessons(course.data?.id);
  const progress = useUserProgress();

  if (course.isLoading || lessons.isLoading || progress.isLoading) {
    return (
      <View style={styles.center}>
        <GradientBackdrop variant="night" />
        <ActivityIndicator color={palette.forge} />
      </View>
    );
  }

  // Only consider progress against THIS course. A lesson the user
  // finished on a different path must not lock today's slot here.
  const activeLessonIds = new Set((lessons.data ?? []).map((l) => l.id));
  const completedRows = (progress.data ?? []).filter(
    (p) => p.completed_at && activeLessonIds.has(p.lesson_id),
  );
  const completedDays = new Set(
    completedRows
      .map((p) => (lessons.data ?? []).find((l) => l.id === p.lesson_id)?.day_number)
      .filter((d): d is number => typeof d === 'number'),
  );
  const maxCompletedDay = completedDays.size === 0 ? 0 : Math.max(...completedDays);

  const completedToday = completedRows.some((p) => {
    const done = new Date(p.completed_at!);
    const now = new Date();
    return (
      done.getFullYear() === now.getFullYear() &&
      done.getMonth() === now.getMonth() &&
      done.getDate() === now.getDate()
    );
  });

  // Today's actionable day: if we already finished a lesson today, the
  // next slot is locked until tomorrow's calendar flip.
  const todaysDay = completedToday ? null : maxCompletedDay + 1;

  return (
    <View style={styles.root}>
      <GradientBackdrop variant="night" />
      <FlatList<Lesson>
        style={styles.container}
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingTop: space.xl,
          paddingBottom: space.xxxl,
          gap: space.sm,
        }}
        data={(lessons.data ?? []) as Lesson[]}
        keyExtractor={(l) => l.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>ᛟ {t('tabs.path').toUpperCase()}</Text>
            <Text style={styles.title}>{course.data ? t(course.data.title_key) : ''}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isDone = completedDays.has(item.day_number);
          const isToday = todaysDay !== null && item.day_number === todaysDay;
          const isLocked = !isDone && !isToday;

          return (
            <Pressable
              disabled={isLocked}
              onPress={() => router.push(`/lesson/${item.id}`)}
              style={({ pressed }) => [
                styles.row,
                isDone && styles.rowDone,
                isToday && styles.rowToday,
                isLocked && styles.rowLocked,
                pressed && !isLocked && { opacity: 0.7 },
              ]}
            >
              <View
                style={[
                  styles.dayBadge,
                  isToday && styles.dayBadgeToday,
                  isLocked && styles.dayBadgeLocked,
                ]}
              >
                <Text style={[styles.dayText, isLocked && styles.dayTextLocked]}>
                  {String(item.day_number).padStart(2, '0')}
                </Text>
              </View>
              <View style={styles.body}>
                <Text
                  style={[styles.lessonTitle, isLocked && styles.lessonTitleLocked]}
                  numberOfLines={2}
                >
                  {t(item.title_key)}
                </Text>
                {isToday && <Text style={styles.todayTag}>ᛞ {t('today.day_badge')}</Text>}
              </View>
              <Text
                style={[
                  styles.statusGlyph,
                  isDone && styles.statusGlyphDone,
                  isLocked && styles.statusGlyphLocked,
                ]}
              >
                {isDone ? '✓' : isLocked ? 'ᛜ' : '›'}
              </Text>
            </Pressable>
          );
        }}
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
  header: { paddingBottom: space.lg },
  eyebrow: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
  title: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.xxl,
    letterSpacing: tracking.tight,
    marginTop: space.xs,
    lineHeight: fontSize.xxl * 1.1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'rgba(19, 24, 38, 0.6)',
  },
  rowDone: {
    borderColor: palette.moss,
    backgroundColor: 'rgba(90, 140, 92, 0.06)',
  },
  rowToday: {
    borderColor: palette.forge,
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
  },
  rowLocked: { opacity: 0.42 },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeToday: { borderColor: palette.forge, backgroundColor: 'rgba(201, 169, 110, 0.10)' },
  dayBadgeLocked: { borderColor: palette.shadow },
  dayText: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.md,
    letterSpacing: tracking.tight,
  },
  dayTextLocked: { color: palette.shadow },
  body: { flex: 1, gap: 2 },
  lessonTitle: {
    fontFamily: fontFamily.displayMid,
    color: palette.parchment,
    fontSize: fontSize.md,
    letterSpacing: tracking.normal,
    lineHeight: fontSize.md * 1.25,
  },
  lessonTitleLocked: { color: palette.mist },
  todayTag: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: 10,
    letterSpacing: tracking.rune,
    marginTop: 2,
  },
  statusGlyph: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.lg,
    width: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  statusGlyphDone: { color: palette.moss, opacity: 1 },
  statusGlyphLocked: { color: palette.shadow, opacity: 1 },
});

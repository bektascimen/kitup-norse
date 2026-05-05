import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useT } from '../../features/i18n';
import { useActiveCourse, useLessons, useUserProgress } from '../../features/lessons/queries';
import { palette, fontFamily, fontSize, space } from '../../theme';

export default function Path() {
  const t = useT();
  const course = useActiveCourse();
  const lessons = useLessons(course.data?.id);
  const progress = useUserProgress();

  if (course.isLoading || lessons.isLoading || progress.isLoading) {
    return <View style={styles.center}><ActivityIndicator color={palette.accent} /></View>;
  }
  const done = new Set((progress.data ?? []).filter((p) => p.completed_at).map((p) => p.lesson_id));

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: space.lg, gap: space.sm }}
      data={lessons.data ?? []}
      keyExtractor={(l) => l.id}
      renderItem={({ item }) => {
        const isDone = done.has(item.id);
        return (
          <Pressable
            style={[styles.row, isDone && styles.rowDone]}
            onPress={() => router.push(`/lesson/${item.id}`)}
          >
            <Text style={styles.day}>{item.day_number}</Text>
            <Text style={styles.title} numberOfLines={1}>{t(item.title_key)}</Text>
            <Text style={styles.tick}>{isDone ? '✓' : ''}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: palette.bgElevated, borderRadius: 10, borderWidth: 1, borderColor: palette.border },
  rowDone: { borderColor: palette.success },
  day: { fontFamily: fontFamily.display, color: palette.accent, fontSize: fontSize.lg, width: 32 },
  title: { fontFamily: fontFamily.body, color: palette.textHigh, fontSize: fontSize.md, flex: 1 },
  tick: { fontFamily: fontFamily.bodyMedium, color: palette.success, fontSize: fontSize.lg },
});

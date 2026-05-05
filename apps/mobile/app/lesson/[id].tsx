import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useLesson } from '../../features/lessons/lessonQuery';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space } from '../../theme';
import Body from '../../components/Markdown';

export default function LessonScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = useLesson(id);

  if (lesson.isLoading) return <View style={styles.center}><ActivityIndicator color={palette.accent} /></View>;
  if (!lesson.data) return null;

  const quizId = (lesson.data.quizzes as any)?.[0]?.id ?? (lesson.data.quizzes as any)?.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: space.lg, paddingBottom: space.xxl }}>
      {lesson.data.hero_image_url && (
        <Image source={{ uri: lesson.data.hero_image_url }} style={styles.hero} contentFit="cover" />
      )}
      <Text style={styles.day}>Day {lesson.data.day_number}</Text>
      <Text style={styles.title}>{t(lesson.data.title_key)}</Text>
      <View style={{ height: space.md }} />
      <Body>{t(lesson.data.body_key)}</Body>
      {quizId && (
        <Pressable
          style={styles.cta}
          onPress={() => router.push(`/quiz/${quizId}`)}
        >
          <Text style={styles.ctaText}>{t('lesson.cta.continue_quiz')}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: palette.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  hero: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, marginBottom: space.lg },
  day: { fontFamily: fontFamily.bodyMedium, color: palette.accent, fontSize: fontSize.sm, letterSpacing: 2 },
  title: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.xxl, marginTop: space.xs },
  cta: { marginTop: space.xl, padding: space.lg, backgroundColor: palette.accent, borderRadius: 12, alignItems: 'center' },
  ctaText: { fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md },
});

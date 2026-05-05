import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useLesson } from '../../features/lessons/lessonQuery';
import { useLessonProgress } from '../../features/lessons/lessonProgressQuery';
import { useT, useI18nStore } from '../../features/i18n';
import { palette, fontFamily, fontSize, space, tracking, radius } from '../../theme';
import Body from '../../components/Markdown';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';
import { CarvedDivider } from '../../components/atmospherics/CarvedDivider';
import { HeaderBack } from '../../components/atmospherics/HeaderBack';

export default function LessonScreen() {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = useLesson(id);
  const progress = useLessonProgress(id);

  const T = (tr: string, en: string) => (locale === 'en' ? en : tr);
  const headerOptions = {
    title: lesson.data
      ? `${T('Gün', 'Day')} ${String(lesson.data.day_number).padStart(2, '0')}`
      : T('Ders', 'Lesson'),
    headerLeft: () => <HeaderBack label={T('BUGÜN', 'TODAY')} />,
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
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: space.xxxl }}>
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
              ᛞ {T('GÜN', 'DAY')} {String(lesson.data.day_number).padStart(2, '0')}
            </Animated.Text>
            {completed && (
              <Animated.View entering={FadeIn.duration(700)} style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>
                  ✓ {T('TAMAMLANDI', 'COMPLETED')}
                  {completedScore != null ? ` · ${completedScore}%` : ''}
                </Text>
              </Animated.View>
            )}
          </View>
          <Animated.Text entering={FadeInUp.delay(120).duration(800)} style={styles.title}>
            {t(lesson.data.title_key)}
          </Animated.Text>
          <CarvedDivider />
          <Animated.View entering={FadeInUp.delay(280).duration(800)}>
            <Body>{t(lesson.data.body_key)}</Body>
          </Animated.View>

          {quizId && (
            <>
              <CarvedDivider />
              {completed ? (
                <Pressable
                  style={[styles.cta, styles.ctaCompleted]}
                  onPress={() => router.replace('/(tabs)')}
                >
                  <Text style={[styles.ctaText, { color: palette.moss }]}>
                    ↩ {T('BUGÜNE DÖN', 'BACK TO TODAY')}
                  </Text>
                  <Text style={[styles.ctaRune, { color: palette.moss }]}> ›</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.cta} onPress={() => router.push(`/quiz/${quizId}`)}>
                  <Text style={styles.ctaText}>{t('lesson.cta.continue_quiz')}</Text>
                  <Text style={styles.ctaRune}> ›</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </ScrollView>
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

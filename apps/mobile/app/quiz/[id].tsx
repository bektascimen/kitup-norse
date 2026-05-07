import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useQuiz, useSubmitProgress } from '../../features/quiz/quizQuery';
import { computeQuizResult } from '../../features/quiz/score';
import { enqueueWrong } from '../../features/sr/queue';
import { useLessonProgress } from '../../features/lessons/lessonProgressQuery';
import { clearQuizSession, getQuizSession, saveQuizSession } from '../../features/resume/storage';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';
import { HeaderBack } from '../../components/atmospherics/HeaderBack';

const FILLED_RUNE = 'ᚠ';
const EMPTY_RUNE = '᛫';

export default function QuizScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const quiz = useQuiz(id);
  const submit = useSubmitProgress();
  // Hydrate any in-flight session for this quiz once on mount so the
  // user lands back on the question they were on with their answers
  // intact. The lazy initializer reads MMKV synchronously — no flash
  // of "step 0" before the persisted state arrives.
  const persisted = useRef(getQuizSession(id)).current;
  const [step, setStep] = useState(persisted?.step ?? 0);
  const [answers, setAnswers] = useState<Record<string, string>>(persisted?.answers ?? {});
  const [revealed, setRevealed] = useState(persisted?.revealed ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Mirror the live state into MMKV. Skipped while submitting so a mid-
  // submit unmount doesn't re-save a state we're about to clear anyway.
  useEffect(() => {
    if (submitting) return;
    saveQuizSession(id, { step, answers, revealed });
  }, [id, step, answers, revealed, submitting]);

  // Block re-entry: if this lesson is already completed, jump to the
  // day-complete screen with the saved score instead of letting the user
  // re-take the quiz. (Spaced repetition handles wrong answers separately.)
  const lessonProgress = useLessonProgress(quiz.data?.lesson_id);
  const completedScore = lessonProgress.data?.completed_at
    ? (lessonProgress.data.score ?? 0)
    : null;

  // Once the user starts submitting their first attempt, suppress the
  // "already done" redirect — otherwise lessonProgress refetches mid-
  // submit, the row appears with completed_at, and this effect races
  // the manual router.replace in next() to push the replay variant on
  // top of the legitimate fresh complete screen.
  const justSubmittedRef = useRef(false);

  // Side-effect navigation must live in an effect — calling router.replace
  // inline during render schedules a setState on the navigation container
  // mid-render and React rightly screams about it.
  useEffect(() => {
    if (completedScore === null) return;
    if (justSubmittedRef.current) return;
    router.replace({
      pathname: '/lesson/complete',
      params: {
        score: String(completedScore),
        alreadyDone: '1',
        lessonId: quiz.data?.lesson_id ?? '',
      },
    });
  }, [completedScore]);

  // shake / pulse animation values
  const shake = useSharedValue(0);
  const glow = useSharedValue(0);

  const headerOptions = {
    title: t('quiz.header.title'),
    headerLeft: () => <HeaderBack label={t('quiz.header.back')} />,
    headerStyle: { backgroundColor: palette.bg },
    headerTintColor: palette.parchment,
    headerShadowVisible: false,
    headerTitleStyle: { fontFamily: fontFamily.display, fontSize: 18 },
    headerBackVisible: false,
  };

  if (quiz.isLoading || !quiz.data) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={headerOptions} />
        <GradientBackdrop variant="night" />
        <ActivityIndicator color={palette.forge} />
      </View>
    );
  }

  // Already completed — render an empty backdrop while the effect above
  // pushes us off to /lesson/complete on the next tick.
  if (completedScore !== null) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={headerOptions} />
        <GradientBackdrop variant="night" />
      </View>
    );
  }

  const data = quiz.data;
  const questions = data.questions as {
    id: string;
    stem_key: string;
    explanation_key?: string;
    correctOptionIds: string[];
    options: { id: string; label_key: string }[];
  }[];
  const q = questions[step];
  const isLast = step === questions.length - 1;

  function pick(optionId: string) {
    setAnswers({ ...answers, [q.id]: optionId });
    setRevealed(true);
    const correctSet = new Set(q.correctOptionIds);
    if (correctSet.has(optionId)) {
      Haptics.selectionAsync().catch(() => {});
      glow.value = withSequence(
        withTiming(1, { duration: 250 }),
        withTiming(0.4, { duration: 600 }),
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      shake.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withRepeat(withTiming(8, { duration: 80 }), 4, true),
        withTiming(0, { duration: 60 }),
      );
    }
  }

  async function next() {
    if (!isLast) {
      setRevealed(false);
      glow.value = 0;
      setStep(step + 1);
      return;
    }
    // Last question → finish flow.
    setSubmitting(true);
    setSubmitError(null);
    // Latch this BEFORE the mutation so the redirect-effect can't race
    // the legitimate router.replace below once useLessonProgress refetches.
    justSubmittedRef.current = true;
    const result = computeQuizResult(
      questions.map((qq) => ({ id: qq.id, correctOptionIds: qq.correctOptionIds })),
      Object.entries(answers).map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId,
      })),
    );
    try {
      await submit.mutateAsync({ lessonId: data.lesson_id, score: result.score });
    } catch (e) {
      console.warn('[quiz] submit progress failed', e); // queued in outbox; safe to proceed
    }
    try {
      await enqueueWrong(result.wrongQuestionIds);
    } catch (e) {
      console.warn('[quiz] enqueue wrong failed', e);
    }
    clearQuizSession(id);
    router.replace({
      pathname: '/lesson/complete',
      params: { score: String(result.score), lessonId: data.lesson_id },
    });
  }

  const correctIds = new Set<string>(q.correctOptionIds);
  const selected = answers[q.id];
  const wrongPicked = revealed && selected ? !correctIds.has(selected) : false;

  // progress runes
  const progressRunes = questions.map((_, i) => (i <= step ? FILLED_RUNE : EMPTY_RUNE)).join('  ');

  return (
    <View style={styles.root}>
      <Stack.Screen options={headerOptions} />
      <GradientBackdrop variant="night" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          padding: space.xl,
          paddingTop: space.lg,
          paddingBottom: space.xl,
        }}
      >
        <Text style={styles.progress}>{progressRunes}</Text>
        <Text style={styles.progressLabel}>
          {step + 1} / {questions.length}
        </Text>

        <Animated.Text key={`stem-${q.id}`} entering={FadeInUp.duration(500)} style={styles.stem}>
          {t(q.stem_key)}
        </Animated.Text>

        <ShakeOptionsList
          shake={shake}
          options={q.options}
          revealed={revealed}
          selected={selected}
          correctIds={correctIds}
          glow={glow}
          onPick={pick}
          t={t}
        />

        {revealed && q.explanation_key && (
          <Animated.View
            entering={FadeIn.duration(400)}
            style={[
              styles.explanation,
              wrongPicked && {
                borderColor: palette.clottedBlood,
                backgroundColor: 'rgba(139, 47, 47, 0.12)',
              },
            ]}
          >
            <Text style={[styles.explainTitle, wrongPicked && { color: palette.clottedBlood }]}>
              ᛟ {t('quiz.explanation.title').toUpperCase()}
            </Text>
            <Text style={styles.explainBody}>{t(q.explanation_key)}</Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Sticky footer — verdict + CTA always visible when revealed */}
      {revealed && (
        <Animated.View entering={FadeInUp.duration(300)} style={styles.footer}>
          <View style={styles.footerInner}>
            <Text
              style={[
                styles.verdict,
                wrongPicked ? { color: palette.clottedBlood } : { color: palette.moss },
              ]}
            >
              {wrongPicked
                ? `ᚷ ${t('quiz.incorrect').toUpperCase()}`
                : `ᛟ ${t('quiz.correct').toUpperCase()}`}
            </Text>
            <Pressable style={styles.cta} onPress={next} disabled={submitting}>
              <Text style={styles.ctaText}>
                {submitting
                  ? t('quiz.saving')
                  : isLast
                    ? t('quiz.finish').toUpperCase()
                    : t('quiz.next').toUpperCase()}
              </Text>
              <Text style={styles.ctaRune}> ›</Text>
            </Pressable>
            {submitError && <Text style={styles.errorText}>{submitError}</Text>}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

function ShakeOptionsList({
  shake,
  glow,
  options,
  revealed,
  selected,
  correctIds,
  onPick,
  t,
}: {
  shake: Animated.SharedValue<number>;
  glow: Animated.SharedValue<number>;
  options: { id: string; label_key: string }[];
  revealed: boolean;
  selected: string | undefined;
  correctIds: Set<string>;
  onPick: (id: string) => void;
  t: ReturnType<typeof useT>;
}) {
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  return (
    <Animated.View style={[{ gap: space.sm, marginTop: space.lg }, shakeStyle]}>
      {options.map((o) => (
        <OptionRow
          key={o.id}
          option={o}
          revealed={revealed}
          selected={selected}
          correctIds={correctIds}
          glow={glow}
          onPick={onPick}
          t={t}
        />
      ))}
    </Animated.View>
  );
}

function OptionRow({
  option,
  revealed,
  selected,
  correctIds,
  glow,
  onPick,
  t,
}: {
  option: { id: string; label_key: string };
  revealed: boolean;
  selected: string | undefined;
  correctIds: Set<string>;
  glow: Animated.SharedValue<number>;
  onPick: (id: string) => void;
  t: ReturnType<typeof useT>;
}) {
  const isCorrect = correctIds.has(option.id);
  const isSelected = selected === option.id;
  const showCorrect = revealed && isCorrect;
  const showWrong = revealed && isSelected && !isCorrect;

  const baseBg = showCorrect
    ? 'rgba(90, 140, 92, 0.14)' // moss tint
    : showWrong
      ? 'rgba(139, 47, 47, 0.14)' // clottedBlood tint
      : 'rgba(19, 24, 38, 0.6)';

  const borderColor = showCorrect
    ? palette.moss
    : showWrong
      ? palette.clottedBlood
      : palette.border;

  const animStyle = useAnimatedStyle(() => {
    if (!showCorrect) return {};
    const op = 0.65 + glow.value * 0.35;
    return { opacity: op };
  });

  return (
    <Animated.View
      // Identical entering on every option so they all materialise in
      // the same frame — without this Reanimated worklet init order
      // could let one row land a beat after the others, especially
      // when its label translation hits the i18n cache via realtime
      // a moment later.
      entering={FadeIn.duration(220)}
      style={showCorrect ? animStyle : undefined}
    >
      <Pressable
        disabled={revealed}
        onPress={() => onPick(option.id)}
        style={[
          styles.option,
          { borderColor, backgroundColor: baseBg, borderWidth: showCorrect || showWrong ? 2 : 1 },
        ]}
      >
        <Text
          style={[
            styles.optionRune,
            showCorrect && { color: palette.moss, opacity: 1 },
            showWrong && { color: palette.clottedBlood, opacity: 1 },
          ]}
        >
          {showCorrect ? '✓' : showWrong ? '✕' : 'ᛞ'}
        </Text>
        <Text
          style={[
            styles.optionText,
            showCorrect && { color: palette.parchment },
            showWrong && { color: palette.parchment },
          ]}
        >
          {t(option.label_key)}
        </Text>
      </Pressable>
    </Animated.View>
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
  progress: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.lg,
    letterSpacing: tracking.rune,
    textAlign: 'center',
  },
  progressLabel: {
    fontFamily: fontFamily.displayMid,
    color: palette.mist,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    textAlign: 'center',
    marginTop: space.xs,
    marginBottom: space.lg,
  },
  stem: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.xl,
    letterSpacing: tracking.tight,
    lineHeight: fontSize.xl * 1.2,
    marginTop: space.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.md,
    // Reserve a minimum row height so a missing-then-arriving label
    // translation can't pop the row from 0 to its natural size and
    // make it look like the option "appeared late".
    minHeight: 64,
  },
  optionRune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.lg,
    width: 24,
    textAlign: 'center',
    opacity: 0.5,
  },
  optionText: {
    flex: 1,
    fontFamily: fontFamily.body,
    color: palette.parchment,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.5,
  },
  explanation: {
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.forge,
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
    gap: space.sm,
  },
  explainTitle: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
  explainBody: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.parchment,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.55,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    backgroundColor: palette.bg,
    paddingTop: space.md,
    paddingBottom: space.xxl,
    paddingHorizontal: space.xl,
  },
  footerInner: { gap: space.sm },
  verdict: {
    fontFamily: fontFamily.displayMid,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    textAlign: 'center',
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
  ctaRune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.lg,
  },
  errorText: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.clottedBlood,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: space.xs,
  },
});

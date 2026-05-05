import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
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
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';

const FILLED_RUNE = 'ᚠ';
const EMPTY_RUNE = '᛫';

export default function QuizScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const quiz = useQuiz(id);
  const submit = useSubmitProgress();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);

  // shake / pulse animation values
  const shake = useSharedValue(0);
  const glow = useSharedValue(0);

  if (quiz.isLoading || !quiz.data) {
    return (
      <View style={styles.center}>
        <GradientBackdrop variant="night" />
        <ActivityIndicator color={palette.forge} />
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
    setRevealed(false);
    glow.value = 0;
    if (isLast) {
      const result = computeQuizResult(
        questions.map((qq) => ({ id: qq.id, correctOptionIds: qq.correctOptionIds })),
        Object.entries(answers).map(([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        })),
      );
      await submit.mutateAsync({ lessonId: data.lesson_id, score: result.score });
      await enqueueWrong(result.wrongQuestionIds);
      router.replace({
        pathname: '/lesson/complete',
        params: { score: String(result.score) },
      });
    } else {
      setStep(step + 1);
    }
  }

  const correctIds = new Set<string>(q.correctOptionIds);
  const selected = answers[q.id];
  const wrongPicked = revealed && selected ? !correctIds.has(selected) : false;

  // progress runes
  const progressRunes = questions.map((_, i) => (i <= step ? FILLED_RUNE : EMPTY_RUNE)).join('  ');

  return (
    <View style={styles.root}>
      <GradientBackdrop variant="night" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          padding: space.xl,
          paddingTop: space.xxl,
          paddingBottom: space.xxxl,
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
                backgroundColor: 'rgba(139, 47, 47, 0.08)',
              },
            ]}
          >
            <Text style={[styles.explainTitle, wrongPicked && { color: palette.clottedBlood }]}>
              ᛟ {t('quiz.explanation.title').toUpperCase()}
            </Text>
            <Text style={styles.explainBody}>{t(q.explanation_key)}</Text>
          </Animated.View>
        )}

        {revealed && (
          <Animated.View entering={FadeInUp.delay(200).duration(500)}>
            <Pressable style={styles.cta} onPress={next}>
              <Text style={styles.ctaText}>{isLast ? t('quiz.finish') : t('quiz.next')}</Text>
              <Text style={styles.ctaRune}> ›</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
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

  const tone = revealed
    ? isCorrect
      ? palette.moss
      : isSelected
        ? palette.clottedBlood
        : palette.border
    : palette.border;

  const animStyle = useAnimatedStyle(() => {
    if (!showCorrect) return {};
    const op = 0.5 + glow.value * 0.5;
    return { borderColor: palette.forge, opacity: op };
  });

  return (
    <Animated.View style={showCorrect ? animStyle : undefined}>
      <Pressable
        disabled={revealed}
        onPress={() => onPick(option.id)}
        style={[
          styles.option,
          { borderColor: tone },
          showCorrect && { borderColor: palette.forge },
        ]}
      >
        <Text style={[styles.optionRune, (showCorrect || showWrong) && { opacity: 1 }]}>
          {showCorrect ? 'ᛟ' : showWrong ? 'ᚷ' : 'ᛞ'}
        </Text>
        <Text style={styles.optionText}>{t(option.label_key)}</Text>
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
    backgroundColor: 'rgba(19, 24, 38, 0.6)',
    gap: space.md,
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
    backgroundColor: 'rgba(201, 169, 110, 0.06)',
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
  cta: {
    marginTop: space.xl,
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
});

import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { useQuiz, useSubmitProgress } from '../../features/quiz/quizQuery';
import { computeQuizResult } from '../../features/quiz/score';
import { enqueueWrong } from '../../features/sr/queue';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space } from '../../theme';

export default function QuizScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const quiz = useQuiz(id);
  const submit = useSubmitProgress();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);

  if (quiz.isLoading || !quiz.data) {
    return <View style={styles.center}><ActivityIndicator color={palette.accent} /></View>;
  }

  const data = quiz.data;
  const questions = data.questions as any[];
  const q = questions[step];
  const isLast = step === questions.length - 1;

  function pick(optionId: string) {
    setAnswers({ ...answers, [q.id]: optionId });
    setRevealed(true);
  }

  async function next() {
    setRevealed(false);
    if (isLast) {
      const result = computeQuizResult(
        questions.map((qq) => ({ id: qq.id, correctOptionIds: qq.correctOptionIds })),
        Object.entries(answers).map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId })),
      );
      await submit.mutateAsync({ lessonId: data.lesson_id, score: result.score });
      await enqueueWrong(result.wrongQuestionIds);
      router.replace({ pathname: '/lesson/complete', params: { score: String(result.score) } });
    } else {
      setStep(step + 1);
    }
  }

  const correctIds = new Set<string>(q.correctOptionIds);
  const selected = answers[q.id];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: space.lg }}>
      <Text style={styles.progress}>{step + 1} / {questions.length}</Text>
      <Text style={styles.stem}>{t(q.stem_key)}</Text>
      <View style={{ gap: space.sm, marginTop: space.lg }}>
        {q.options.map((o: any) => {
          const isCorrect = correctIds.has(o.id);
          const isSelected = selected === o.id;
          const tone = revealed
            ? isCorrect ? palette.success : isSelected ? palette.danger : palette.border
            : palette.border;
          return (
            <Pressable
              key={o.id}
              disabled={revealed}
              onPress={() => pick(o.id)}
              style={[styles.option, { borderColor: tone }]}
            >
              <Text style={styles.optionText}>{t(o.label_key)}</Text>
            </Pressable>
          );
        })}
      </View>
      {revealed && q.explanation_key && (
        <View style={styles.explanation}>
          <Text style={styles.explainTitle}>{t('quiz.explanation.title')}</Text>
          <Text style={styles.explainBody}>{t(q.explanation_key)}</Text>
        </View>
      )}
      {revealed && (
        <Pressable style={styles.cta} onPress={next}>
          <Text style={styles.ctaText}>
            {isLast ? t('quiz.finish') : t('quiz.next')}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: palette.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  progress: { fontFamily: fontFamily.bodyMedium, color: palette.accent, fontSize: fontSize.sm, letterSpacing: 2 },
  stem: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.xl, marginTop: space.sm },
  option: { padding: space.md, borderRadius: 10, borderWidth: 1, backgroundColor: palette.bgElevated },
  optionText: { fontFamily: fontFamily.body, color: palette.textHigh, fontSize: fontSize.md },
  explanation: { marginTop: space.lg, padding: space.md, borderLeftWidth: 3, borderLeftColor: palette.accent, backgroundColor: palette.bgElevated },
  explainTitle: { fontFamily: fontFamily.bodyMedium, color: palette.accent, fontSize: fontSize.sm },
  explainBody: { fontFamily: fontFamily.body, color: palette.textHigh, fontSize: fontSize.md, marginTop: space.xs },
  cta: { marginTop: space.xl, padding: space.lg, backgroundColor: palette.accent, borderRadius: 12, alignItems: 'center' },
  ctaText: { fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md },
});

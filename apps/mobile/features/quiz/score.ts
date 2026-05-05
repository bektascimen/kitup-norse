export type QuestionInput = { id: string; correctOptionIds: string[] };
export type AnswerInput = { questionId: string; selectedOptionId: string };

export type QuizResult = {
  score: number; // 0..100, integer
  wrongQuestionIds: string[];
};

export function computeQuizResult(
  questions: QuestionInput[],
  answers: AnswerInput[],
): QuizResult {
  const byQ = new Map(answers.map((a) => [a.questionId, a.selectedOptionId]));
  const wrong: string[] = [];
  let correct = 0;
  for (const q of questions) {
    const sel = byQ.get(q.id);
    if (sel && q.correctOptionIds.includes(sel)) correct++;
    else wrong.push(q.id);
  }
  const score = questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100);
  return { score, wrongQuestionIds: wrong };
}

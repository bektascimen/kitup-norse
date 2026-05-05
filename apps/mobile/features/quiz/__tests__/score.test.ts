import { computeQuizResult, type AnswerInput, type QuestionInput } from '../score';

const q1: QuestionInput = { id: 'q1', correctOptionIds: ['a'] };
const q2: QuestionInput = { id: 'q2', correctOptionIds: ['c'] };
const q3: QuestionInput = { id: 'q3', correctOptionIds: ['t'] };

describe('computeQuizResult', () => {
  it('returns 100 when all correct', () => {
    const answers: AnswerInput[] = [
      { questionId: 'q1', selectedOptionId: 'a' },
      { questionId: 'q2', selectedOptionId: 'c' },
      { questionId: 'q3', selectedOptionId: 't' },
    ];
    const r = computeQuizResult([q1, q2, q3], answers);
    expect(r.score).toBe(100);
    expect(r.wrongQuestionIds).toEqual([]);
  });

  it('returns the correct percentage and lists wrong question ids', () => {
    const answers: AnswerInput[] = [
      { questionId: 'q1', selectedOptionId: 'a' },     // correct
      { questionId: 'q2', selectedOptionId: 'wrong' }, // wrong
      { questionId: 'q3', selectedOptionId: 'wrong' }, // wrong
    ];
    const r = computeQuizResult([q1, q2, q3], answers);
    expect(r.score).toBe(33);
    expect(r.wrongQuestionIds).toEqual(['q2', 'q3']);
  });

  it('treats unanswered questions as wrong', () => {
    const r = computeQuizResult([q1, q2, q3], [{ questionId: 'q1', selectedOptionId: 'a' }]);
    expect(r.score).toBe(33);
    expect(r.wrongQuestionIds).toEqual(['q2', 'q3']);
  });
});

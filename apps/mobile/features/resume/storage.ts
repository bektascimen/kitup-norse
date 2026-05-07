import { mmkv } from '../../lib/storage';

/**
 * Persist enough state for the user to land back where they left off.
 * Lesson screens save their scroll Y; quiz screens save their step,
 * accumulated answers, and whether the current question's verdict is
 * already revealed. Both are scoped per-id so different lessons /
 * quizzes don't collide, and both clear on completion.
 */

const LESSON_SCROLL_PREFIX = 'resume.lesson.scroll.';
const QUIZ_SESSION_PREFIX = 'resume.quiz.session.';

export type QuizSession = {
  step: number;
  answers: Record<string, string>;
  revealed: boolean;
};

export function getLessonScroll(lessonId: string | undefined): number {
  if (!lessonId) return 0;
  const raw = mmkv.getString(LESSON_SCROLL_PREFIX + lessonId);
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function saveLessonScroll(lessonId: string | undefined, y: number): void {
  if (!lessonId) return;
  // Don't persist trivial offsets — most "back to top" gestures land
  // here and we'd just churn writes.
  if (y < 24) {
    mmkv.delete(LESSON_SCROLL_PREFIX + lessonId);
    return;
  }
  mmkv.set(LESSON_SCROLL_PREFIX + lessonId, String(Math.round(y)));
}

export function clearLessonScroll(lessonId: string | undefined): void {
  if (!lessonId) return;
  mmkv.delete(LESSON_SCROLL_PREFIX + lessonId);
}

export function getQuizSession(quizId: string | undefined): QuizSession | null {
  if (!quizId) return null;
  const raw = mmkv.getString(QUIZ_SESSION_PREFIX + quizId);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as QuizSession;
    if (
      typeof parsed?.step === 'number' &&
      typeof parsed?.answers === 'object' &&
      typeof parsed?.revealed === 'boolean'
    ) {
      return parsed;
    }
  } catch {
    /* ignore corrupt blob */
  }
  return null;
}

export function saveQuizSession(quizId: string | undefined, session: QuizSession): void {
  if (!quizId) return;
  mmkv.set(QUIZ_SESSION_PREFIX + quizId, JSON.stringify(session));
}

export function clearQuizSession(quizId: string | undefined): void {
  if (!quizId) return;
  mmkv.delete(QUIZ_SESSION_PREFIX + quizId);
}

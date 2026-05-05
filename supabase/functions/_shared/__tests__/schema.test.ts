import { assertEquals, assertThrows } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { CourseSchema } from '../schema.ts';

Deno.test('valid 2-day course parses', () => {
  const c = {
    title: 'Test',
    description: 'A short course',
    difficulty: 'beginner',
    lessons: [
      { day: 1, title: 'A', body: 'Long enough body text.', est_minutes: 5,
        quiz: { pass_threshold: 60, questions: [
          { type: 'true_false', stem: 'Is Loki a god?', options: [
            { label: 'Yes', is_correct: true }, { label: 'No', is_correct: false }] }
        ]} },
      { day: 2, title: 'B', body: 'Long enough body text.', est_minutes: 5,
        quiz: { pass_threshold: 60, questions: [
          { type: 'true_false', stem: 'Is Thor red?', options: [
            { label: 'Red beard', is_correct: true }, { label: 'Blue', is_correct: false }] }
        ]} },
    ],
  };
  const parsed = CourseSchema.parse(c);
  assertEquals(parsed.lessons.length, 2);
});

Deno.test('non-contiguous days reject', () => {
  assertThrows(() => CourseSchema.parse({
    title: 'X', description: 'short body', difficulty: 'beginner',
    lessons: [
      { day: 1, title: 'A', body: 'long body text', est_minutes: 5,
        quiz: { pass_threshold: 60, questions: [{ type: 'true_false', stem: 'q', options: [
          { label: 'a', is_correct: true }, { label: 'b', is_correct: false }] }] } },
      { day: 3, title: 'B', body: 'long body text', est_minutes: 5,
        quiz: { pass_threshold: 60, questions: [{ type: 'true_false', stem: 'q', options: [
          { label: 'a', is_correct: true }, { label: 'b', is_correct: false }] }] } },
    ],
  }));
});

import { z } from 'zod';

export const QuestionSchema = z.object({
  type: z.enum(['multiple_choice', 'true_false']),
  stem: z.string().min(3),
  options: z.array(z.object({ label: z.string().min(1), is_correct: z.boolean() })).min(2).max(4),
  explanation: z.string().optional(),
});

export const LessonSchema = z.object({
  day: z.number().int().min(1),
  title: z.string().min(1),
  body: z.string().min(20),
  hero_image_prompt: z.string().optional(),
  est_minutes: z.number().int().min(1).max(20).default(5),
  quiz: z.object({
    pass_threshold: z.number().int().min(0).max(100).default(60),
    questions: z.array(QuestionSchema).min(1).max(5),
  }),
});

export const CourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(10),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  lessons: z.array(LessonSchema),
}).refine((c) => {
  const days = c.lessons.map((l) => l.day);
  const set = new Set(days);
  return set.size === days.length && Math.min(...days) === 1 && Math.max(...days) === days.length;
}, { message: 'lesson days must be a contiguous 1..N sequence' });

export type Course = z.infer<typeof CourseSchema>;

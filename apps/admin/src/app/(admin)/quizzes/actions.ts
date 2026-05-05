'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function ensureQuiz(lessonId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('quizzes').select('id').eq('lesson_id', lessonId).maybeSingle();
  if (data) return data.id;
  const { data: created, error } = await supabase
    .from('quizzes').insert({ lesson_id: lessonId, pass_threshold: 60 }).select('id').single();
  if (error) throw error;
  return created.id;
}

const qSchema = z.object({
  id: z.string().uuid().optional(),
  quiz_id: z.string().uuid(),
  type: z.enum(['multiple_choice', 'true_false']),
  stem_key: z.string().min(1),
  explanation_key: z.string().nullish(),
  position: z.coerce.number().int().min(0),
});

export async function upsertQuestion(formData: FormData) {
  const parsed = qSchema.parse(Object.fromEntries(formData));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('quiz_questions').upsert(parsed);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/quizzes');
  return { ok: true };
}

const oSchema = z.object({
  id: z.string().uuid().optional(),
  question_id: z.string().uuid(),
  label_key: z.string().min(1),
  is_correct: z.coerce.boolean(),
  position: z.coerce.number().int().min(0),
});

export async function upsertOption(formData: FormData) {
  const parsed = oSchema.parse(Object.fromEntries(formData));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('quiz_options').upsert(parsed);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/quizzes');
  return { ok: true };
}

export async function deleteQuestion(id: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from('quiz_questions').delete().eq('id', id);
  revalidatePath('/quizzes');
}

export async function deleteOption(id: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from('quiz_options').delete().eq('id', id);
  revalidatePath('/quizzes');
}

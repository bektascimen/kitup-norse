import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from '@supabase/supabase-js';
import { CourseSchema } from '../_shared/schema.ts';
import {
  systemPrompt,
  userPrompt,
  exampleShot,
  type GenerateCourseInput,
} from '../_shared/prompts.ts';
import { geminiGenerate } from './gemini.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
// SUPABASE_ANON_KEY is the auto-injected publishable key for Edge Functions.
// (Supabase rejects custom env names that start with SUPABASE_, and the legacy
// `anon` and modern `publishable` keys are the same credential.)
const publishableKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const geminiKey = Deno.env.get('GEMINI_API_KEY')!;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const auth = req.headers.get('authorization');
  if (!auth) return new Response('Unauthorized', { status: 401 });

  // Per-request client. Acts as the caller. RLS applies to all reads/writes.
  // Note: untyped client (Database generic dropped) — Edge runtime can't reach
  // the workspace shared-types package, and inlining the full type isn't worth it.
  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { authorization: auth } },
  });

  // Decode JWT directly. The Supabase gateway already verified the signature
  // (verify_jwt=true), so trusting the payload here is safe and avoids supabase-js
  // auth-client quirks in the Edge Function runtime.
  const jwt = auth.replace(/^Bearer\s+/i, '');
  let claims: any;
  try {
    claims = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return new Response('Forbidden: bad jwt', { status: 403 });
  }
  if (claims?.app_metadata?.role !== 'admin') {
    return new Response(`Forbidden: role=${claims?.app_metadata?.role ?? 'none'}`, { status: 403 });
  }
  const user = { id: claims.sub as string };

  const input = (await req.json()) as GenerateCourseInput;

  // Insert the job row (RLS policy "admin generation jobs" allows admins to write).
  const { data: job, error: jobErr } = await supabase
    .from('generation_jobs')
    .insert({
      requested_by: user.id,
      type: 'course',
      input_payload: input,
      status: 'pending',
    })
    .select()
    .single();
  if (jobErr) return new Response(jobErr.message, { status: 500 });

  EdgeRuntime.waitUntil(
    (async () => {
      await supabase.from('generation_jobs').update({ status: 'running' }).eq('id', job.id);
      try {
        const model =
          ((
            await supabase
              .from('app_config')
              .select('value')
              .eq('key', 'ai.gemini.model')
              .maybeSingle()
          ).data?.value as string) ?? 'gemini-2.5-flash';
        const raw = await geminiGenerate({
          apiKey: geminiKey,
          model,
          system: systemPrompt({ tone: input.tone }),
          user: userPrompt(input),
          example: exampleShot(),
          responseSchema: courseResponseSchema(input.dayCount),
        });
        const parsed = CourseSchema.parse(raw);
        const courseId = await persistCourse(supabase, parsed, input.locale, input.tone);
        await supabase
          .from('generation_jobs')
          .update({ status: 'done', output_ref: courseId })
          .eq('id', job.id);
      } catch (e) {
        await supabase
          .from('generation_jobs')
          .update({ status: 'failed', error_msg: String(e) })
          .eq('id', job.id);
      }
    })(),
  );

  return new Response(JSON.stringify({ jobId: job.id }), {
    headers: { 'content-type': 'application/json' },
    status: 202,
  });
});

function courseResponseSchema(dayCount: number): object {
  return {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING' },
      description: { type: 'STRING' },
      difficulty: { type: 'STRING', enum: ['beginner', 'intermediate', 'advanced'] },
      lessons: {
        type: 'ARRAY',
        minItems: dayCount,
        maxItems: dayCount,
        items: {
          type: 'OBJECT',
          properties: {
            day: { type: 'INTEGER' },
            title: { type: 'STRING' },
            body: { type: 'STRING' },
            est_minutes: { type: 'INTEGER' },
            quiz: {
              type: 'OBJECT',
              properties: {
                pass_threshold: { type: 'INTEGER' },
                questions: {
                  type: 'ARRAY',
                  minItems: 3,
                  maxItems: 5,
                  items: {
                    type: 'OBJECT',
                    properties: {
                      type: { type: 'STRING', enum: ['multiple_choice', 'true_false'] },
                      stem: { type: 'STRING' },
                      explanation: { type: 'STRING' },
                      options: {
                        type: 'ARRAY',
                        minItems: 2,
                        maxItems: 4,
                        items: {
                          type: 'OBJECT',
                          properties: {
                            label: { type: 'STRING' },
                            is_correct: { type: 'BOOLEAN' },
                          },
                          required: ['label', 'is_correct'],
                        },
                      },
                    },
                    required: ['type', 'stem', 'options'],
                  },
                },
              },
              required: ['pass_threshold', 'questions'],
            },
          },
          required: ['day', 'title', 'body', 'est_minutes', 'quiz'],
        },
      },
    },
    required: ['title', 'description', 'difficulty', 'lessons'],
  };
}

async function persistCourse(
  supabase: any,
  course: any,
  locale: string,
  tone?: string,
): Promise<string> {
  const baseSlug = course.title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 50);
  const slug = tone ? `${baseSlug}-${tone}` : baseSlug;
  const titleKey = `course.${slug}.title`;
  const descKey = `course.${slug}.description`;

  await supabase.from('translations').upsert([
    { key: titleKey, locale, value: course.title },
    { key: descKey, locale, value: course.description },
  ]);

  const { data: c, error: cErr } = await supabase
    .from('courses')
    .insert({
      slug,
      title_key: titleKey,
      description_key: descKey,
      day_count: course.lessons.length,
      difficulty: course.difficulty,
      status: 'draft',
      tone: tone ?? null,
    })
    .select('id')
    .single();
  if (cErr) throw cErr;

  for (const l of course.lessons) {
    const lessonTitleKey = `lesson.${slug}.day${l.day}.title`;
    const lessonBodyKey = `lesson.${slug}.day${l.day}.body`;
    await supabase.from('translations').upsert([
      { key: lessonTitleKey, locale, value: l.title },
      { key: lessonBodyKey, locale, value: l.body },
    ]);
    const { data: lessonRow, error: lErr } = await supabase
      .from('lessons')
      .insert({
        course_id: c.id,
        day_number: l.day,
        title_key: lessonTitleKey,
        body_key: lessonBodyKey,
        est_minutes: l.est_minutes,
      })
      .select('id')
      .single();
    if (lErr) throw lErr;

    const { data: quizRow, error: qErr } = await supabase
      .from('quizzes')
      .insert({ lesson_id: lessonRow.id, pass_threshold: l.quiz.pass_threshold })
      .select('id')
      .single();
    if (qErr) throw qErr;

    for (let qi = 0; qi < l.quiz.questions.length; qi++) {
      const q = l.quiz.questions[qi];
      const stemKey = `quiz.${slug}.day${l.day}.q${qi + 1}.stem`;
      const explKey = q.explanation ? `quiz.${slug}.day${l.day}.q${qi + 1}.expl` : null;
      const upserts = [{ key: stemKey, locale, value: q.stem }];
      if (explKey) upserts.push({ key: explKey, locale, value: q.explanation });
      await supabase.from('translations').upsert(upserts);

      const { data: qRow } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: quizRow.id,
          type: q.type,
          stem_key: stemKey,
          explanation_key: explKey,
          position: qi,
        })
        .select('id')
        .single();

      for (let oi = 0; oi < q.options.length; oi++) {
        const o = q.options[oi];
        const labelKey = `quiz.${slug}.day${l.day}.q${qi + 1}.o${oi + 1}`;
        await supabase.from('translations').upsert([{ key: labelKey, locale, value: o.label }]);
        await supabase.from('quiz_options').insert({
          question_id: qRow.id,
          label_key: labelKey,
          is_correct: o.is_correct,
          position: oi,
        });
      }
    }
  }
  return c.id;
}

// Seeds a 21-day Norse Mythology course by hitting the deployed
// `generate-course` Edge Function and waiting for the AI pipeline to finish.
//
// Prerequisites (the script will fail loudly otherwise):
//   1. Gemini API key is set in Supabase Edge Function secrets (GEMINI_API_KEY).
//   2. An admin user exists (auth.users row with app_metadata.role = 'admin').
//   3. The following env vars are exported when invoking the script:
//        SUPABASE_URL              — https://<ref>.supabase.co
//        SUPABASE_PUBLISHABLE_KEY  — sb_publishable_... (anon-tier publishable key)
//        SEED_ADMIN_EMAIL          — admin user's email
//        SEED_ADMIN_PASSWORD       — admin user's password
//
// Usage:
//   SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... \
//     SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... \
//     pnpm -F @kitup/scripts seed:norse

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
const adminEmail = process.env.SEED_ADMIN_EMAIL!;
const adminPassword = process.env.SEED_ADMIN_PASSWORD!;

if (!url || !publishableKey || !adminEmail || !adminPassword) {
  console.error(
    'Missing env: SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD',
  );
  process.exit(1);
}

// Anonymous client used only for the password sign-in.
const anon = createClient(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function signInAdmin(): Promise<{ token: string; admin: ReturnType<typeof createClient> }> {
  const { data, error } = await anon.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (error || !data.session) throw new Error(error?.message ?? 'admin sign-in failed');
  const token = data.session.access_token;
  const admin = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { authorization: `Bearer ${token}` } },
  });
  return { token, admin };
}

async function startGeneration(token: string): Promise<string> {
  const tone =
    (process.env.SEED_TONE as 'wisdom' | 'warrior' | 'traveler' | undefined) ?? undefined;
  const res = await fetch(`${url}/functions/v1/generate-course`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: publishableKey,
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      topic: 'Norse Mythology',
      difficulty: 'beginner',
      dayCount: 21,
      locale: 'tr',
      tone,
    }),
  });
  if (!res.ok) throw new Error(`generate-course failed: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { jobId: string }).jobId;
}

async function waitForJob(admin: ReturnType<typeof createClient>, jobId: string): Promise<string> {
  while (true) {
    const { data } = await admin.from('generation_jobs').select('*').eq('id', jobId).single();
    if (!data) throw new Error('job vanished');
    if (data.status === 'done') return data.output_ref as string;
    if (data.status === 'failed') throw new Error(`job failed: ${data.error_msg}`);
    process.stdout.write(`. ${data.status}\n`);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

async function publishCourse(admin: ReturnType<typeof createClient>, courseId: string) {
  const { error } = await admin.from('courses').update({ status: 'published' }).eq('id', courseId);
  if (error) throw error;
}

async function translateToEn(token: string) {
  const res = await fetch(`${url}/functions/v1/translate-content`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: publishableKey,
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sourceLocale: 'tr', targetLocale: 'en', batchSize: 500 }),
  });
  if (!res.ok) throw new Error(`translate-content failed: ${await res.text()}`);
  console.log('translate result:', await res.json());
}

async function main() {
  const { token, admin } = await signInAdmin();
  console.log('starting generation…');
  const jobId = await startGeneration(token);
  console.log('jobId:', jobId);
  const courseId = await waitForJob(admin, jobId);
  console.log('courseId:', courseId);
  await publishCourse(admin, courseId);
  console.log('published. translating to EN…');
  await translateToEn(token);
  console.log('done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

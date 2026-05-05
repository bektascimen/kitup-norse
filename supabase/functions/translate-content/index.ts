import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from '@supabase/supabase-js';
import { translateSystem, translateUser } from './translatePrompt.ts';
import { geminiGenerate } from './gemini.ts';

const supabaseUrl    = Deno.env.get('SUPABASE_URL')!;
const publishableKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
const geminiKey      = Deno.env.get('GEMINI_API_KEY')!;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const auth = req.headers.get('authorization');
  if (!auth) return new Response('Unauthorized', { status: 401 });

  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { authorization: auth } },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || (user.app_metadata as any)?.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const { sourceLocale, targetLocale, batchSize = 50 } = await req.json();

  const { data: missing, error } = await supabase.rpc('translations_missing_for', {
    p_source: sourceLocale, p_target: targetLocale, p_limit: batchSize,
  });
  if (error) return new Response(error.message, { status: 500 });
  if (!missing || missing.length === 0) return new Response(JSON.stringify({ translated: 0 }), { status: 200 });

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      translations: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: { key: { type: 'STRING' }, value: { type: 'STRING' } },
          required: ['key', 'value'],
        },
      },
    },
    required: ['translations'],
  };

  const raw = await geminiGenerate({
    apiKey: geminiKey,
    model: 'gemini-2.5-flash',
    system: translateSystem(),
    user: translateUser(missing.map((m: any) => ({ key: m.key, source: m.value })), targetLocale),
    responseSchema,
  }) as { translations: { key: string; value: string }[] };

  const rows = raw.translations.map((t) => ({ key: t.key, locale: targetLocale, value: t.value }));
  const { error: upErr } = await supabase.from('translations').upsert(rows);
  if (upErr) return new Response(upErr.message, { status: 500 });

  return new Response(JSON.stringify({ translated: rows.length }), { status: 200 });
});

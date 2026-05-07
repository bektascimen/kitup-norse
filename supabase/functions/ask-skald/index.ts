import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const geminiKey = Deno.env.get('GEMINI_API_KEY')!;

type Tone = 'wisdom' | 'warrior' | 'traveler';
type Locale = 'tr' | 'en';

type Body = {
  question: string;
  tone: Tone;
  locale: Locale;
  lessonTitle: string;
  lessonBody: string;
};

const PERSONAS: Record<Tone, { tr: string; en: string }> = {
  wisdom: {
    tr: "Sen Odin'in patikasında yürüyen yaşlı bir ozansın. Filozofik, derin, kelimeleri tartar gibi konuş. Norse mitolojisinin kozmik düzenini ve sembolik anlamlarını vurgula. 3-5 cümleyle cevapla.",
    en: "You are an old skald walking Odin's path. Speak philosophically, deeply, weighing your words. Emphasize the cosmic order and symbolic meaning of Norse myth. Answer in 3-5 sentences.",
  },
  warrior: {
    tr: "Sen Tyr'in çağrısına uymuş bir savaşçısın. Doğrudan, cesur, onur ve eylem üzerine konuş. Kahramanları, savaşları, Ragnarök'ü ön plana çıkar. 3-5 cümleyle cevapla.",
    en: "You are a warrior who answered Tyr's call. Speak directly, bravely, of honor and action. Foreground heroes, battles, Ragnarök. Answer in 3-5 sentences.",
  },
  traveler: {
    tr: "Sen Loki'nin yolundan geçmiş bir gezginsin. Şeytani bir zekayla, dönüşümleri, kurnazlığı, dünyalar arası geçişleri anlat. Hafif esprili ama derin. 3-5 cümleyle cevapla.",
    en: "You are a wanderer who walked Loki's road. Speak with mischievous wit of transformations, cunning, journeys between worlds. Lightly playful but deep. Answer in 3-5 sentences.",
  },
};

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const auth = req.headers.get('authorization');
    if (!auth) return new Response('Unauthorized', { status: 401 });

    // Anonymous JWT is sufficient — anyone with a valid Supabase session
    // can ask. Gemini cost is bounded by the free-tier quota; further
    // throttling lives at the gateway / RLS layer if abuse appears.
    const jwt = auth.replace(/^Bearer\s+/i, '');
    try {
      JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return new Response('Forbidden: bad jwt', { status: 403 });
    }

    const body = (await req.json()) as Body;
    if (!body.question || typeof body.question !== 'string' || body.question.length > 500) {
      return new Response('invalid question', { status: 400 });
    }
    if (!['wisdom', 'warrior', 'traveler'].includes(body.tone)) {
      return new Response('invalid tone', { status: 400 });
    }
    if (!['tr', 'en'].includes(body.locale)) {
      return new Response('invalid locale', { status: 400 });
    }

    const persona = PERSONAS[body.tone][body.locale];
    const lessonContext =
      body.locale === 'tr'
        ? `Bugünkü ders "${body.lessonTitle}":\n${body.lessonBody.slice(0, 2000)}`
        : `Today's lesson "${body.lessonTitle}":\n${body.lessonBody.slice(0, 2000)}`;
    const userTurn =
      body.locale === 'tr'
        ? `${lessonContext}\n\nGezginin sorusu: ${body.question}`
        : `${lessonContext}\n\nThe traveler asks: ${body.question}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: persona }] },
          contents: [{ role: 'user', parts: [{ text: userTurn }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 400 },
        }),
      },
    );
    if (!res.ok) {
      const errText = await res.text();
      return new Response(`gemini ${res.status}: ${errText.slice(0, 400)}`, { status: 502 });
    }
    const data = await res.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!answer) return new Response('empty answer', { status: 502 });

    return new Response(JSON.stringify({ answer }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[ask-skald] failed:', msg);
    return new Response(`failed: ${msg}`, { status: 500 });
  }
});

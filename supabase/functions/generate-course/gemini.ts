const ENDPOINT = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

export async function geminiGenerate(args: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  example?: { user: string; assistant: string };
  responseSchema: object;
}): Promise<unknown> {
  const contents: any[] = [];
  if (args.example) {
    contents.push({ role: 'user', parts: [{ text: args.example.user }] });
    contents.push({ role: 'model', parts: [{ text: args.example.assistant }] });
  }
  contents.push({ role: 'user', parts: [{ text: args.user }] });

  const body = {
    systemInstruction: { parts: [{ text: args.system }] },
    contents,
    generationConfig: {
      responseMimeType: 'application/json',
      // responseSchema omitted: Gemini's constraint compiler chokes on our nested
      // enum + min/max array constraints. We rely on the system prompt + the
      // server-side zod validator (CourseSchema) instead, with a single retry.
      temperature: 0.7,
    },
  };

  // Retry with exponential backoff on 429/503/504 (transient).
  const delays = [3_000, 10_000, 25_000, 60_000];
  let lastErr: unknown;
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const res = await fetch(ENDPOINT(args.model, args.apiKey), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('gemini returned empty content');
        return JSON.parse(text);
      }
      const errText = await res.text();
      // Retry on transient errors only.
      if ([429, 500, 502, 503, 504].includes(res.status) && attempt < delays.length) {
        await new Promise((r) => setTimeout(r, delays[attempt]!));
        continue;
      }
      throw new Error(`gemini ${res.status}: ${errText}`);
    } catch (e) {
      lastErr = e;
      if (attempt >= delays.length) break;
      // network errors also benefit from retry
      await new Promise((r) => setTimeout(r, delays[attempt]!));
    }
  }
  throw lastErr ?? new Error('gemini retries exhausted');
}

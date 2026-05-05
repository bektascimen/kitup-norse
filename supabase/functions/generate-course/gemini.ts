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
      responseSchema: args.responseSchema,
      temperature: 0.7,
    },
  };

  const res = await fetch(ENDPOINT(args.model, args.apiKey), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('gemini returned empty content');
  return JSON.parse(text);
}

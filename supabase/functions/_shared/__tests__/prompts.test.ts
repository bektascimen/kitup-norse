import { assert, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { userPrompt, systemPrompt, exampleShot } from '../prompts.ts';

Deno.test('userPrompt includes day count and topic', () => {
  const p = userPrompt({ topic: 'X', difficulty: 'beginner', dayCount: 5, locale: 'en' });
  assertStringIncludes(p, '5-day course on "X"');
  assertStringIncludes(p, 'Language: English');
});

Deno.test('systemPrompt instructs strict JSON', () => {
  assertStringIncludes(systemPrompt(), 'STRICT JSON');
});

Deno.test('exampleShot returns parseable JSON', () => {
  const ex = exampleShot();
  JSON.parse(ex.assistant); // throws if invalid
  assert(true);
});

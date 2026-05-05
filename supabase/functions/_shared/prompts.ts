export type Tone = 'wisdom' | 'warrior' | 'traveler';

export type GenerateCourseInput = {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  dayCount: number;
  locale: 'tr' | 'en';
  tone?: Tone;
};

const TONE_PROMPTS: Record<Tone, string> = {
  wisdom:
    "Voice: a sage at twilight (Odin's path). Emphasize cosmic order, runes and seers, the price of knowledge, the sacrifices of mind. Whenever natural, weave Hávamál maxims into the lesson body. Quizzes test wisdom passages and the ethics of seeking.",
  warrior:
    "Voice: a skald reciting before battle (Tyr's call). Emphasize courage tested, oaths kept, the inevitability of Ragnarök, deeds that survive the doer. Foreground heroes (Sigurd, Beowulf, Þórr) and their trials. Quizzes test bravery, sacrifice, and the cost of glory.",
  traveler:
    "Voice: a wanderer between the nine worlds (Loki's road). Emphasize transformation, cunning, shape-shifting, the seam where worlds meet. Foreground Loki, Heimdall, the Norns at Yggdrasil's roots, the feasts and fights. Quizzes test the trickster's logic and the journey's hidden meanings.",
};

export function systemPrompt(input?: { tone?: Tone }): string {
  const base = `You generate microlearning course content.
Output STRICT JSON matching the schema you receive — no prose, no code fences.
Each lesson body is 120–220 words of Markdown.
Each quiz has 3–5 questions mixing 'multiple_choice' and 'true_false'.
For mythology topics, only use well-attested myths from primary sources (Eddas etc.) — no neo-pagan inventions.`;
  const toneLine = input?.tone
    ? `\n\n${TONE_PROMPTS[input.tone]}`
    : '\n\nVoice: atmospheric, concise, factually accurate.';
  return base + toneLine;
}

export function userPrompt(input: GenerateCourseInput): string {
  return `Generate a ${input.dayCount}-day course on "${input.topic}" at ${input.difficulty} level.
Language: ${input.locale === 'tr' ? 'Turkish' : 'English'}.
Lesson day numbers must be 1..${input.dayCount} contiguous.
Pass threshold per quiz: 60.`;
}

export function exampleShot(): { user: string; assistant: string } {
  return {
    user: 'Generate a 1-day Norse Mythology course at beginner in English.',
    assistant: JSON.stringify({
      title: 'Norse Mythology — Day 0 Sample',
      description: 'A one-day taster.',
      difficulty: 'beginner',
      lessons: [
        {
          day: 1,
          title: 'Yggdrasil: The World Tree',
          body: 'Yggdrasil is the immense ash tree at the center of the cosmos in Norse mythology...',
          est_minutes: 5,
          quiz: {
            pass_threshold: 60,
            questions: [
              {
                type: 'true_false',
                stem: 'Yggdrasil is described as an oak tree.',
                options: [
                  { label: 'True', is_correct: false },
                  { label: 'False', is_correct: true },
                ],
                explanation: 'Yggdrasil is an immense ash tree.',
              },
            ],
          },
        },
      ],
    }),
  };
}

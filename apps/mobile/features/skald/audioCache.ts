import type { Locale } from '@kitup/shared-types';

/**
 * Premium-narrated lessons. Lookup is by lesson_id × locale; missing
 * entries fall back to the on-device TTS engine. We host the MP3s in
 * Supabase Storage's public 'lesson-audio' bucket — generated through
 * ElevenLabs ahead of time, the lookup here is just a thin index.
 *
 * Day 1 of every archetype is covered in both Turkish and English:
 *   - wisdom Day 1 TR  → Antoni (mature, philosophical)
 *   - wisdom Day 1 EN  → George (deep British narrator)
 *   - warrior Day 1 TR → Bill (older male, storyteller)
 *   - warrior Day 1 EN → George
 *   - traveler Day 1 TR → Bill
 *   - traveler Day 1 EN → George
 */
const STORAGE_BASE =
  'https://cqkajygmcgzoselurgvu.supabase.co/storage/v1/object/public/lesson-audio';

const LESSON_AUDIO: Record<string, Partial<Record<Locale, string>>> = {
  // Wisdom path — Day 1
  '03c901c3-1a4a-418e-a106-d2a5a37bb0c7': {
    tr: `${STORAGE_BASE}/wisdom-day1-tr.mp3`,
    en: `${STORAGE_BASE}/wisdom-day1-en.mp3`,
  },
  // Warrior path — Day 1
  'ccba9dba-a6bc-473f-8f8a-83e7c1626b96': {
    tr: `${STORAGE_BASE}/warrior-day1-tr.mp3`,
    en: `${STORAGE_BASE}/warrior-day1-en.mp3`,
  },
  // Traveler path — Day 1
  '1eeac225-9c6a-4bc6-a76c-71f4baab5b65': {
    tr: `${STORAGE_BASE}/traveler-day1-tr.mp3`,
    en: `${STORAGE_BASE}/traveler-day1-en.mp3`,
  },
};

export function getLessonAudioUrl(
  lessonId: string | undefined,
  locale: Locale,
): string | undefined {
  if (!lessonId) return undefined;
  return LESSON_AUDIO[lessonId]?.[locale];
}

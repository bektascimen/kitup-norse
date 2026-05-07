import type { Locale } from '@kitup/shared-types';

/**
 * Premium-narrated lessons. Lookup is by lesson_id × locale; missing
 * entries fall back to the on-device TTS engine. We host the MP3s in
 * Supabase Storage's public 'lesson-audio' bucket — generated through
 * ElevenLabs ahead of time, the lookup here is just a thin index.
 */
const LESSON_AUDIO: Record<string, Partial<Record<Locale, string>>> = {
  // Wisdom path — Day 1: "Yggdrasil: Evrenin Merkezi"
  '03c901c3-1a4a-418e-a106-d2a5a37bb0c7': {
    tr: 'https://cqkajygmcgzoselurgvu.supabase.co/storage/v1/object/public/lesson-audio/wisdom-day1-tr.mp3',
  },
};

export function getLessonAudioUrl(
  lessonId: string | undefined,
  locale: Locale,
): string | undefined {
  if (!lessonId) return undefined;
  return LESSON_AUDIO[lessonId]?.[locale];
}

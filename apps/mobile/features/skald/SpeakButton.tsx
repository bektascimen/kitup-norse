import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import { useT, useI18nStore } from '../i18n';
import { useOnboarding, type Path } from '../onboarding/store';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { getLessonAudioUrl } from './audioCache';

type Props = {
  text: string;
  lessonId?: string;
};

const TONE: Record<Path, { rate: number; pitch: number }> = {
  wisdom: { rate: 0.95, pitch: 0.96 },
  warrior: { rate: 1.0, pitch: 0.94 },
  traveler: { rate: 1.05, pitch: 1.05 },
};

function splitIntoChunks(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+["']?/g);
  if (!matches) return [text.trim()].filter(Boolean);
  return matches.map((s) => s.trim()).filter(Boolean);
}

/**
 * Reads the lesson body aloud. Two playback paths share the same UI:
 *
 * - **Premium MP3** (when getLessonAudioUrl returns a URL): a pre-
 *   generated narration hosted in Supabase Storage, played through
 *   expo-av so pause/resume hits exact byte offsets.
 * - **Device TTS fallback**: AVSpeechSynthesizer driven sentence-by-
 *   sentence, with Speech.pause()/resume() honoring word boundaries.
 *
 * The button's pause/resume contract is identical either way — Stop
 * keeps the position, Listen continues from there, finishing resets.
 */
export function SpeakButton({ text, lessonId }: Props) {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const path = useOnboarding((s) => s.path) ?? 'wisdom';
  const audioUrl = getLessonAudioUrl(lessonId, locale);

  const [speaking, setSpeaking] = useState(false);
  const [voiceId, setVoiceId] = useState<string | undefined>(undefined);

  // TTS chunk-walking state (only used when audioUrl is undefined).
  const cursorRef = useRef(0);
  const pausedRef = useRef(false);
  const chunks = useMemo(() => splitIntoChunks(text), [text]);
  const tone = TONE[path];

  // expo-av Sound for the premium MP3 path. Created lazily on first
  // play, kept across pause/resume, unloaded on unmount.
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioFinishedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await Speech.getAvailableVoicesAsync();
        const wanted = locale === 'tr' ? 'tr' : 'en';
        const matches = all.filter((v) => v.language?.toLowerCase().startsWith(wanted));
        const ranked = matches.sort((a, b) => {
          const aQ = a.quality === Speech.VoiceQuality.Enhanced ? 0 : 1;
          const bQ = b.quality === Speech.VoiceQuality.Enhanced ? 0 : 1;
          if (aQ !== bQ) return aQ - bQ;
          const aId = a.identifier ?? '';
          const bId = b.identifier ?? '';
          const score = (id: string) => (/premium|siri|natural|enhanced/i.test(id) ? 0 : 1);
          return score(aId) - score(bId);
        });
        if (!cancelled) setVoiceId(ranked[0]?.identifier);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  // Reset state when the lesson body changes.
  useEffect(() => {
    cursorRef.current = 0;
    pausedRef.current = false;
    audioFinishedRef.current = false;
    return () => {
      Speech.stop();
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, [text, audioUrl]);

  function onAudioStatus(status: AVPlaybackStatus) {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      audioFinishedRef.current = true;
      setSpeaking(false);
    }
  }

  async function startOrResumeAudio() {
    if (!audioUrl) return;
    if (audioFinishedRef.current) {
      // Replay from the top.
      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      audioFinishedRef.current = false;
    }
    if (!soundRef.current) {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        onAudioStatus,
      );
      soundRef.current = sound;
    } else {
      await soundRef.current.playAsync();
    }
    setSpeaking(true);
  }

  async function pauseAudio() {
    await soundRef.current?.pauseAsync();
    setSpeaking(false);
  }

  function speakFromTts(idx: number) {
    if (idx >= chunks.length) {
      cursorRef.current = 0;
      pausedRef.current = false;
      setSpeaking(false);
      return;
    }
    cursorRef.current = idx;
    pausedRef.current = false;
    setSpeaking(true);
    Speech.speak(chunks[idx]!, {
      language: locale === 'tr' ? 'tr-TR' : 'en-US',
      voice: voiceId,
      rate: tone.rate,
      pitch: tone.pitch,
      onDone: () => {
        if (pausedRef.current) return;
        speakFromTts(cursorRef.current + 1);
      },
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  async function toggle() {
    if (audioUrl) {
      if (speaking) {
        await pauseAudio();
        return;
      }
      await startOrResumeAudio();
      return;
    }
    if (speaking) {
      Speech.pause();
      pausedRef.current = true;
      setSpeaking(false);
      return;
    }
    if (pausedRef.current) {
      Speech.resume();
      pausedRef.current = false;
      setSpeaking(true);
      return;
    }
    speakFromTts(cursorRef.current);
  }

  return (
    <Pressable style={styles.btn} onPress={toggle} hitSlop={12}>
      <Text style={styles.rune} allowFontScaling={false}>
        {speaking ? '■' : '▶'}
      </Text>
      <Text style={styles.label}>{speaking ? t('lesson.speak.stop') : t('lesson.speak.play')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: space.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'rgba(19, 24, 38, 0.6)',
    marginBottom: space.sm,
  },
  rune: {
    color: palette.forge,
    fontSize: 12,
  },
  label: {
    fontFamily: fontFamily.displayMid,
    color: palette.parchment,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
});

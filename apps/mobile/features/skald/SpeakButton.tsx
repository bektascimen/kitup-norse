import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { useT, useI18nStore } from '../i18n';
import { useOnboarding, type Path } from '../onboarding/store';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';

type Props = {
  text: string;
};

/**
 * Path-specific delivery. Each archetype gets its own narrator-feel:
 * wisdom slows down and drops the pitch slightly (an old skald
 * weighing words); warrior stays neutral but a touch lower (steady
 * conviction); traveler nudges up in pitch and pace (mischievous
 * lift). The deltas are small on purpose — large pitch shifts always
 * sound like a chipmunk or a vampire, never a person.
 */
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
 * Reads the lesson body aloud. Stop pauses at the current word
 * (AVSpeechSynthesizer respects word boundaries on iOS); the next tap
 * resumes exactly where it left off, even mid-sentence. Finishing the
 * body resets so a subsequent tap plays from the top.
 *
 * Voice selection prefers Enhanced/Premium quality if the user has
 * downloaded one (Settings → Accessibility → Spoken Content → Voices),
 * since the default "compact" voices on iOS sound noticeably robotic.
 * Path-specific rate/pitch deltas finish the persona.
 */
export function SpeakButton({ text }: Props) {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const path = useOnboarding((s) => s.path) ?? 'wisdom';

  const [speaking, setSpeaking] = useState(false);
  const [voiceId, setVoiceId] = useState<string | undefined>(undefined);

  const cursorRef = useRef(0);
  const pausedRef = useRef(false);
  const chunks = useMemo(() => splitIntoChunks(text), [text]);
  const tone = TONE[path];

  // Resolve the best-available voice for the current locale once. The
  // call is async but the lesson screen mounts long enough before the
  // first tap that we always have a value by the time the user hits
  // Listen.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await Speech.getAvailableVoicesAsync();
        const wanted = locale === 'tr' ? 'tr' : 'en';
        const matches = all.filter((v) => v.language?.toLowerCase().startsWith(wanted));
        // Sort Enhanced > Default. Inside each tier, prefer voices
        // whose identifier hints at a "premium"/"siri"/"natural"
        // pipeline (these IDs vary across iOS versions but the suffix
        // tends to be reliable).
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
        /* ignore — fall back to the engine default */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    cursorRef.current = 0;
    pausedRef.current = false;
    return () => {
      Speech.stop();
    };
  }, [text]);

  function speakFrom(idx: number) {
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
        speakFrom(cursorRef.current + 1);
      },
      onStopped: () => {
        setSpeaking(false);
      },
      onError: () => {
        setSpeaking(false);
      },
    });
  }

  function toggle() {
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
    speakFrom(cursorRef.current);
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

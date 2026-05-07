import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { useT, useI18nStore } from '../i18n';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';

type Props = {
  text: string;
};

/**
 * Split a body of text into sentence-sized chunks so we can chain them
 * one utterance at a time. Each utterance feeds Speech.speak — pausing
 * within an utterance is handled by Speech.pause()/resume() rather
 * than by our own bookkeeping.
 */
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
 */
export function SpeakButton({ text }: Props) {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const [speaking, setSpeaking] = useState(false);
  const cursorRef = useRef(0);
  // Distinguishes "we just paused — resume() the same utterance" from
  // "fresh start at this chunk". Without it, the next tap would replay
  // the chunk from its first word.
  const pausedRef = useRef(false);
  const chunks = useMemo(() => splitIntoChunks(text), [text]);

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
      rate: 0.92,
      pitch: 1.0,
      onDone: () => {
        // Skip the chain hop if we were paused mid-utterance — the
        // engine still fires onDone when the paused utterance finally
        // completes after a resume(); that's the moment we want to
        // advance.
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
      // Pause at the current word; the queued utterance stays alive
      // so resume() picks up at exactly the spot AVSpeechSynthesizer
      // was reading.
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
    // System font — Cinzel doesn't ship the geometric play/stop glyphs
    // and falls back to a tofu box.
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

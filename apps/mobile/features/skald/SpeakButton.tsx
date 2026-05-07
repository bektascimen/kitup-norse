import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { useT, useI18nStore } from '../i18n';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';

type Props = {
  text: string;
};

/**
 * Split a body of text into sentence-sized chunks. expo-speech doesn't
 * expose pause/resume — Speech.stop() throws away all internal state —
 * so we drive playback ourselves by walking these chunks one at a time.
 * Stop on chunk N means we keep N as our cursor; the next play picks
 * up at chunk N rather than starting from the top.
 */
function splitIntoChunks(text: string): string[] {
  // Sentence boundary: ., !, ? optionally followed by closing
  // punctuation, then whitespace. Falls back to one chunk if the text
  // has no sentence enders.
  const matches = text.match(/[^.!?]+[.!?]+["']?/g);
  if (!matches) return [text.trim()].filter(Boolean);
  return matches.map((s) => s.trim()).filter(Boolean);
}

/**
 * Reads the lesson body aloud. Stop preserves the cursor so the next
 * tap resumes at the same sentence; finishing the body resets so a
 * subsequent tap starts again from the beginning.
 */
export function SpeakButton({ text }: Props) {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const [speaking, setSpeaking] = useState(false);
  const cursorRef = useRef(0);
  const chunks = useMemo(() => splitIntoChunks(text), [text]);

  // Reset cursor + stop any in-flight speech when the lesson changes
  // (different body) or the component unmounts.
  useEffect(() => {
    cursorRef.current = 0;
    return () => {
      Speech.stop();
    };
  }, [text]);

  function speakFrom(idx: number) {
    if (idx >= chunks.length) {
      // Finished the body — next play starts from the top.
      cursorRef.current = 0;
      setSpeaking(false);
      return;
    }
    cursorRef.current = idx;
    setSpeaking(true);
    Speech.speak(chunks[idx]!, {
      language: locale === 'tr' ? 'tr-TR' : 'en-US',
      rate: 0.92,
      pitch: 1.0,
      onDone: () => {
        // Only advance if we weren't manually stopped — onStopped
        // fires for that path and shouldn't bump the cursor.
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
      Speech.stop();
      setSpeaking(false);
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

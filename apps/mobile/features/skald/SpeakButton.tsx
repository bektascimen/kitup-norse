import { useEffect, useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { useT, useI18nStore } from '../i18n';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';

type Props = {
  text: string;
};

/**
 * Reads the lesson body aloud using the device's built-in TTS.
 * Atmospheric "Listen to the saga" affordance — turns the lesson
 * screen into a hands-free experience.
 */
export function SpeakButton({ text }: Props) {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const [speaking, setSpeaking] = useState(false);

  // Stop any in-flight speech if this component unmounts (lesson nav).
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  function toggle() {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(text, {
      language: locale === 'tr' ? 'tr-TR' : 'en-US',
      // Slow it down a touch — feels more like an oral telling than a
      // robot reciting bullet points.
      rate: 0.92,
      pitch: 1.0,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }

  return (
    <Pressable style={styles.btn} onPress={toggle} hitSlop={12}>
      <Text style={styles.rune}>{speaking ? '◼' : '▶'}</Text>
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
    fontFamily: fontFamily.displayMid,
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

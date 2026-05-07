import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { useT, useI18nStore } from '../i18n';
import { useOnboarding, type Path } from '../onboarding/store';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';
import { CarvedDivider } from '../../components/atmospherics/CarvedDivider';

const PATH_RUNE: Record<Path, string> = {
  wisdom: 'ᚨ',
  warrior: 'ᛏ',
  traveler: 'ᛚ',
};

type Props = {
  visible: boolean;
  onClose: () => void;
  lessonTitle: string;
  lessonBody: string;
};

export function AskSkaldModal({ visible, onClose, lessonTitle, lessonBody }: Props) {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const path = useOnboarding((s) => s.path) ?? 'wisdom';

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke<{ answer: string }>(
        'ask-skald',
        {
          body: { question: q, tone: path, locale, lessonTitle, lessonBody },
        },
      );
      if (fnErr) throw fnErr;
      if (!data?.answer) throw new Error('empty');
      setAnswer(data.answer);
    } catch {
      setError(t('lesson.ask_skald.error'));
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setQuestion('');
    setAnswer(null);
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <GradientBackdrop variant="night" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
            <Text style={styles.rune}>{PATH_RUNE[path]}</Text>
            <Text style={styles.eyebrow}>ᛟ {t('lesson.ask_skald.cta').replace(/^ᚨ\s*/, '')}</Text>
            <Text style={styles.title}>{t('lesson.ask_skald.title')}</Text>
            <CarvedDivider />
          </Animated.View>

          {!answer && !loading && (
            <Animated.View entering={FadeInUp.delay(120).duration(400)} style={styles.section}>
              <TextInput
                placeholder={t('lesson.ask_skald.placeholder')}
                placeholderTextColor={palette.shadow}
                value={question}
                onChangeText={setQuestion}
                multiline
                maxLength={500}
                style={styles.input}
                autoFocus
              />
              <Pressable
                style={[styles.cta, !question.trim() && styles.ctaDisabled]}
                onPress={send}
                disabled={!question.trim()}
              >
                <Text style={[styles.ctaText, !question.trim() && styles.ctaTextDisabled]}>
                  {t('lesson.ask_skald.send')}
                </Text>
                <Text style={[styles.ctaRune, !question.trim() && styles.ctaTextDisabled]}> ›</Text>
              </Pressable>
            </Animated.View>
          )}

          {loading && (
            <View style={styles.section}>
              <ActivityIndicator color={palette.forge} />
              <Text style={styles.thinking}>{t('lesson.ask_skald.thinking')}</Text>
            </View>
          )}

          {answer && (
            <Animated.View entering={FadeInUp.duration(500)} style={styles.section}>
              <Text style={styles.questionEcho}>"{question}"</Text>
              <Text style={styles.answer}>{answer}</Text>
              <CarvedDivider />
              <Pressable style={styles.cta} onPress={reset}>
                <Text style={styles.ctaText}>{t('lesson.ask_skald.again')}</Text>
                <Text style={styles.ctaRune}> ›</Text>
              </Pressable>
            </Animated.View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
        </ScrollView>

        <Pressable style={styles.closeBtn} onPress={close} hitSlop={16}>
          <Text style={styles.closeText}>✕ {t('lesson.ask_skald.close')}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: palette.bg },
  scroll: {
    flexGrow: 1,
    paddingTop: space.xxxl + space.xl,
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl,
  },
  header: { alignItems: 'center', gap: space.sm, marginBottom: space.lg },
  rune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: 72,
    lineHeight: 78,
    marginBottom: space.sm,
  },
  eyebrow: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
  title: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.xxl,
    letterSpacing: tracking.tight,
    textAlign: 'center',
  },
  section: { gap: space.md, marginTop: space.md },
  input: {
    minHeight: 96,
    backgroundColor: 'rgba(19, 24, 38, 0.6)',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: space.md,
    fontFamily: fontFamily.body,
    color: palette.parchment,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.5,
    textAlignVertical: 'top',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    borderTopWidth: 1,
    borderTopColor: palette.forge,
    marginTop: space.md,
  },
  ctaDisabled: { borderTopColor: palette.shadow },
  ctaText: {
    fontFamily: fontFamily.displayMid,
    color: palette.parchment,
    fontSize: fontSize.md,
    letterSpacing: tracking.wide,
  },
  ctaTextDisabled: { color: palette.shadow },
  ctaRune: { fontFamily: fontFamily.display, color: palette.forge, fontSize: fontSize.lg },
  thinking: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: space.md,
  },
  questionEcho: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: space.sm,
    opacity: 0.85,
  },
  answer: {
    fontFamily: fontFamily.body,
    color: palette.parchment,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.6,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.clottedBlood,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: space.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: space.xxxl + 4,
    right: space.lg,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  closeText: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
});

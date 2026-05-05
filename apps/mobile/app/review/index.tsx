import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../features/auth/store';
import { recordReview } from '../../features/sr/queue';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space } from '../../theme';

export default function ReviewScreen() {
  const t = useT();
  const userId = useAuthStore((s) => s.session?.user.id);
  const [step, setStep] = useState(0);

  const reviewsQ = useQuery({
    enabled: !!userId,
    queryKey: ['reviews-list', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('review_queue')
        .select('id, question_id, quiz_questions(id, type, stem_key, quiz_options(id, label_key, is_correct))')
        .eq('user_id', userId!)
        .lte('due_at', new Date().toISOString());
      return data ?? [];
    },
  });

  if (reviewsQ.isLoading) return <View style={styles.center}><ActivityIndicator color={palette.accent} /></View>;
  const reviews = (reviewsQ.data ?? []) as any[];
  if (reviews.length === 0) {
    return <View style={styles.center}><Text style={styles.muted}>No reviews due. 🌿</Text></View>;
  }
  if (step >= reviews.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Done.</Text>
        <Pressable style={styles.cta} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.ctaText}>{t('onboarding.cta.continue')}</Text>
        </Pressable>
      </View>
    );
  }

  const r = reviews[step];
  const q = r.quiz_questions as any;
  const correctIds = new Set((q.quiz_options ?? []).filter((o: any) => o.is_correct).map((o: any) => o.id));

  async function pick(optionId: string) {
    await recordReview(r.id, correctIds.has(optionId));
    setStep(step + 1);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>{step + 1} / {reviews.length}</Text>
      <Text style={styles.stem}>{t(q.stem_key)}</Text>
      <View style={{ gap: space.sm, marginTop: space.lg }}>
        {(q.quiz_options ?? []).map((o: any) => (
          <Pressable key={o.id} style={styles.option} onPress={() => pick(o.id)}>
            <Text style={styles.optionText}>{t(o.label_key)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.lg, backgroundColor: palette.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg, padding: space.lg },
  progress: { fontFamily: fontFamily.bodyMedium, color: palette.accent, fontSize: fontSize.sm, letterSpacing: 2 },
  stem: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.xl, marginTop: space.sm },
  option: { padding: space.md, borderRadius: 10, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.bgElevated },
  optionText: { fontFamily: fontFamily.body, color: palette.textHigh, fontSize: fontSize.md },
  muted: { fontFamily: fontFamily.body, color: palette.textMid, fontSize: fontSize.md, textAlign: 'center' },
  cta: { marginTop: space.xl, padding: space.lg, backgroundColor: palette.accent, borderRadius: 12 },
  ctaText: { fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md },
});

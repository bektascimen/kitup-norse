import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space } from '../../theme';

export default function Complete() {
  const t = useT();
  const { score } = useLocalSearchParams<{ score: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('day.complete.title')}</Text>
      <Text style={styles.score}>{score}%</Text>
      <Text style={styles.body}>{t('day.complete.body')}</Text>
      <Pressable style={styles.cta} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.ctaText}>{t('onboarding.cta.continue')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xl, gap: space.md, backgroundColor: palette.bg },
  title: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.xxl, textAlign: 'center' },
  score: { fontFamily: fontFamily.display, color: palette.accent, fontSize: fontSize.hero },
  body: { fontFamily: fontFamily.body, color: palette.textMid, fontSize: fontSize.md, textAlign: 'center' },
  cta: { marginTop: space.xl, padding: space.lg, backgroundColor: palette.accent, borderRadius: 12 },
  ctaText: { fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md },
});

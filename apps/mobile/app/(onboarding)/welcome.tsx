import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space } from '../../theme';

export default function Welcome() {
  const t = useT();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('onboarding.welcome.title')}</Text>
      <Text style={styles.body}>{t('onboarding.welcome.body')}</Text>
      <Pressable style={styles.cta} onPress={() => router.push('/(onboarding)/why')}>
        <Text style={styles.ctaText}>{t('onboarding.cta.continue')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.lg, backgroundColor: palette.bg },
  title: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.hero },
  body: { fontFamily: fontFamily.body, color: palette.textMid, fontSize: fontSize.lg, lineHeight: 26 },
  cta: { marginTop: space.xl, padding: space.lg, backgroundColor: palette.accent, borderRadius: 12, alignItems: 'center' },
  ctaText: { fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md },
});

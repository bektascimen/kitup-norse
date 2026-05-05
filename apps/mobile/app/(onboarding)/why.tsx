import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space } from '../../theme';

export default function Why() {
  const t = useT();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>5 dakika · 21 gün</Text>
      <Text style={styles.body}>
        Her gün kısa bir hikaye, hızlı bir quiz. Yanlış bildiklerini sistem sana tekrar sorar — bilim destekli aralıklı tekrar.
      </Text>
      <Pressable style={styles.cta} onPress={() => router.push('/(onboarding)/language')}>
        <Text style={styles.ctaText}>{t('onboarding.cta.continue')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.lg, backgroundColor: palette.bg },
  title: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.xxl },
  body: { fontFamily: fontFamily.body, color: palette.textMid, fontSize: fontSize.md, lineHeight: 24 },
  cta: { marginTop: space.xl, padding: space.lg, backgroundColor: palette.accent, borderRadius: 12, alignItems: 'center' },
  ctaText: { fontFamily: fontFamily.bodyMedium, color: palette.bg, fontSize: fontSize.md },
});

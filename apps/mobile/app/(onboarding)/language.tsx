import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useI18nStore, useT } from '../../features/i18n';
import { useOnboarding } from '../../features/onboarding/store';
import { palette, fontFamily, fontSize, space } from '../../theme';
import { syncTranslations } from '../../features/i18n';

export default function Language() {
  const t = useT();
  const setLocale = useI18nStore((s) => s.setLocale);
  const finish = useOnboarding((s) => s.setCompleted);

  async function pick(locale: 'tr' | 'en') {
    setLocale(locale);
    await syncTranslations(locale);
    finish();
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('onboarding.language.title')}</Text>
      <Pressable style={styles.option} onPress={() => pick('tr')}>
        <Text style={styles.optionText}>Türkçe</Text>
      </Pressable>
      <Pressable style={styles.option} onPress={() => pick('en')}>
        <Text style={styles.optionText}>English</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: space.xl, gap: space.md, backgroundColor: palette.bg, justifyContent: 'center' },
  title: { fontFamily: fontFamily.display, color: palette.textHigh, fontSize: fontSize.xxl, marginBottom: space.lg },
  option: { padding: space.lg, borderWidth: 1, borderColor: palette.border, borderRadius: 12, backgroundColor: palette.bgElevated },
  optionText: { fontFamily: fontFamily.bodyMedium, color: palette.textHigh, fontSize: fontSize.lg },
});

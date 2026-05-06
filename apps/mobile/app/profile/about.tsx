import { Stack } from 'expo-router';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, space, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';
import { CarvedDivider } from '../../components/atmospherics/CarvedDivider';

export default function ProfileAbout() {
  const t = useT();
  const version = Constants.expoConfig?.version ?? '0.1.0';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: space.xxxl }}>
      <Stack.Screen options={{ title: t('profile.about.title') }} />
      <GradientBackdrop variant="night" />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>ᛞ {t('profile.about.eyebrow')}</Text>
        <Text style={styles.title}>kitUP Norse</Text>
        <Text style={styles.subtitle}>{t('profile.about.subtitle')}</Text>
        <CarvedDivider />

        <Text style={styles.sectionLabel}>{t('profile.about.section.version')}</Text>
        <Text style={styles.value}>{version}</Text>

        <Text style={styles.sectionLabel}>{t('profile.about.section.content')}</Text>
        <Text style={styles.value}>Gemini 2.5 Flash Lite · Supabase Edge Functions</Text>

        <Text style={styles.sectionLabel}>{t('profile.about.section.imagery')}</Text>
        <Text style={styles.value}>Wikimedia Commons — public domain Norse art</Text>

        <Text style={styles.sectionLabel}>{t('profile.about.section.built_with')}</Text>
        <Text style={styles.value}>Expo SDK 52 · React Native · Supabase · TypeScript</Text>

        <CarvedDivider />

        <Text style={styles.poem}>
          {
            '“Cattle die, kindred die,\nthou thyself shalt die;\none thing I know that never dies:\nthe fame of a dead man’s deeds.”'
          }
        </Text>
        <Text style={styles.poemAttribution}>— Hávamál, st. 77</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: space.xl, paddingTop: space.lg },
  eyebrow: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    marginBottom: space.xs,
  },
  title: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.xxl,
    letterSpacing: tracking.tight,
  },
  subtitle: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.5,
    marginTop: space.xs,
  },
  sectionLabel: {
    fontFamily: fontFamily.displayMid,
    color: palette.shadow,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    marginTop: space.lg,
    marginBottom: space.xs,
  },
  value: {
    fontFamily: fontFamily.body,
    color: palette.parchment,
    fontSize: fontSize.md,
  },
  poem: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.rune,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.6,
    textAlign: 'center',
    marginTop: space.lg,
  },
  poemAttribution: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.wide,
    textAlign: 'center',
    marginTop: space.sm,
  },
});

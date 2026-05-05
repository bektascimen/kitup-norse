import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useState } from 'react';
import { useI18nStore, useT } from '../../features/i18n';
import { useOnboarding } from '../../features/onboarding/store';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { syncTranslations } from '../../features/i18n';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';
import { CarvedDivider } from '../../components/atmospherics/CarvedDivider';

const LANGS = [
  {
    locale: 'tr' as const,
    name: 'Türkçe',
    native: '"Yolcuyum, hikâye dinlerim"',
    rune: 'ᛏ',
  },
  {
    locale: 'en' as const,
    name: 'English',
    native: '"I am a traveler, I listen to stories"',
    rune: 'ᛖ',
  },
];

export default function Language() {
  const t = useT();
  const setLocale = useI18nStore((s) => s.setLocale);
  const finish = useOnboarding((s) => s.setCompleted);
  const [pressedLocale, setPressedLocale] = useState<string | null>(null);

  async function pick(locale: 'tr' | 'en') {
    setLocale(locale);
    await syncTranslations(locale);
    finish();
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <GradientBackdrop variant="night" />
      <View style={styles.content}>
        <Animated.Text entering={FadeIn.duration(800)} style={styles.eyebrow}>
          ᛟ CHOOSE YOUR TONGUE ᛟ
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(150).duration(800)} style={styles.title}>
          {t('onboarding.language.title')}
        </Animated.Text>
        <CarvedDivider />
        <View style={styles.cards}>
          {LANGS.map((lang, i) => {
            const pressed = pressedLocale === lang.locale;
            return (
              <Animated.View
                key={lang.locale}
                entering={FadeInUp.delay(300 + i * 120).duration(800)}
              >
                <Pressable
                  onPressIn={() => setPressedLocale(lang.locale)}
                  onPressOut={() => setPressedLocale(null)}
                  onPress={() => pick(lang.locale)}
                  style={[
                    styles.card,
                    pressed && {
                      borderColor: palette.forge,
                      backgroundColor: palette.bgElevated,
                    },
                  ]}
                >
                  <Text style={styles.rune}>{lang.rune}</Text>
                  <View style={styles.cardText}>
                    <Text style={styles.name}>{lang.name}</Text>
                    <Text style={styles.native}>{lang.native}</Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  eyebrow: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    marginBottom: space.lg,
    textAlign: 'center',
  },
  title: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.xxl,
    letterSpacing: tracking.tight,
    textAlign: 'center',
  },
  cards: { gap: space.md, marginTop: space.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.lg,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'rgba(19, 24, 38, 0.6)',
    gap: space.lg,
  },
  rune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.xxl,
    width: 40,
    textAlign: 'center',
  },
  cardText: { flex: 1, gap: space.xs },
  name: {
    fontFamily: fontFamily.displayMid,
    color: palette.parchment,
    fontSize: fontSize.lg,
    letterSpacing: tracking.wide,
  },
  native: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.sm,
  },
  arrow: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.xl,
  },
});

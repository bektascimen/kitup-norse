import { Stack, router } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useState } from 'react';
import { useI18nStore, useT, syncTranslations } from '../../features/i18n';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';
import type { Locale } from '@kitup/shared-types';

const LANGS = [
  { locale: 'tr' as const, name: 'Türkçe', native: '"Yolcuyum, hikâye dinlerim"', rune: 'ᛏ' },
  {
    locale: 'en' as const,
    name: 'English',
    native: '"I am a traveler, I listen to stories"',
    rune: 'ᛖ',
  },
];

export default function ProfileLanguage() {
  const t = useT();
  const current = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);
  const [selected, setSelected] = useState<Locale>(current);

  async function save() {
    if (selected === current) {
      router.back();
      return;
    }
    setLocale(selected);
    await syncTranslations(selected);
    router.back();
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('profile.language.title') }} />
      <GradientBackdrop variant="night" />
      <View style={styles.content}>
        <Animated.Text entering={FadeIn.duration(600)} style={styles.eyebrow}>
          {t('profile.language.eyebrow')}
        </Animated.Text>
        <View style={styles.cards}>
          {LANGS.map((lang, i) => {
            const isSelected = selected === lang.locale;
            return (
              <Animated.View
                key={lang.locale}
                entering={FadeInUp.delay(120 + i * 100).duration(700)}
              >
                <Pressable
                  onPress={() => setSelected(lang.locale)}
                  style={[styles.card, isSelected && styles.cardSelected]}
                >
                  <Text style={[styles.rune, isSelected && styles.runeSelected]}>{lang.rune}</Text>
                  <View style={styles.cardText}>
                    <Text style={styles.name}>{lang.name}</Text>
                    <Text style={styles.native}>{lang.native}</Text>
                  </View>
                  <Text style={[styles.check, isSelected && styles.checkActive]}>
                    {isSelected ? '✓' : ''}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </View>
      <View style={styles.ctaWrap}>
        <Pressable style={styles.cta} onPress={save}>
          <Text style={styles.ctaText}>{t('common.cta.save')}</Text>
          <Text style={styles.ctaRune}> ›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: space.xl },
  eyebrow: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    marginBottom: space.xl,
    textAlign: 'center',
  },
  cards: { gap: space.md },
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
  cardSelected: { borderColor: palette.forge, backgroundColor: 'rgba(201, 169, 110, 0.08)' },
  rune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.xxl,
    width: 40,
    textAlign: 'center',
    opacity: 0.55,
  },
  runeSelected: { color: palette.ember, opacity: 1 },
  cardText: { flex: 1, gap: 2 },
  name: {
    fontFamily: fontFamily.displayMid,
    color: palette.parchment,
    fontSize: fontSize.lg,
    letterSpacing: tracking.wide,
  },
  native: { fontFamily: fontFamily.bodyItalic, color: palette.mist, fontSize: fontSize.sm },
  check: {
    fontFamily: fontFamily.display,
    color: palette.shadow,
    fontSize: fontSize.xl,
    width: 24,
    textAlign: 'center',
  },
  checkActive: { color: palette.forge },
  ctaWrap: { paddingHorizontal: space.xl, paddingBottom: space.xxxl },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    borderTopWidth: 1,
    borderTopColor: palette.forge,
  },
  ctaText: {
    fontFamily: fontFamily.displayMid,
    color: palette.parchment,
    fontSize: fontSize.md,
    letterSpacing: tracking.wide,
  },
  ctaRune: { fontFamily: fontFamily.display, color: palette.forge, fontSize: fontSize.lg },
});

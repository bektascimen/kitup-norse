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
import type { Locale } from '@kitup/shared-types';

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
  const detected = useI18nStore.getState().locale; // device-detected default
  const setLocale = useI18nStore((s) => s.setLocale);
  const finish = useOnboarding((s) => s.setCompleted);
  const [selected, setSelected] = useState<Locale>(detected);

  async function confirm() {
    setLocale(selected);
    await syncTranslations(selected);
    finish();
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <GradientBackdrop variant="night" />
      <View style={styles.content}>
        <Animated.Text entering={FadeIn.duration(800)} style={styles.eyebrow}>
          {t('onboarding.language.eyebrow')}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(150).duration(800)} style={styles.title}>
          {t('onboarding.language.title')}
        </Animated.Text>
        <CarvedDivider />
        <View style={styles.cards}>
          {LANGS.map((lang, i) => {
            const isSelected = selected === lang.locale;
            const isDetected = detected === lang.locale;
            return (
              <Animated.View
                key={lang.locale}
                entering={FadeInUp.delay(300 + i * 120).duration(800)}
              >
                <Pressable
                  onPress={() => setSelected(lang.locale)}
                  style={[styles.card, isSelected && styles.cardSelected]}
                >
                  <Text style={[styles.rune, isSelected && styles.runeSelected]}>{lang.rune}</Text>
                  <View style={styles.cardText}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{lang.name}</Text>
                      {isDetected && (
                        <Text style={styles.detectedBadge}>
                          {t('onboarding.language.detected_badge')}
                        </Text>
                      )}
                    </View>
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
      <Animated.View entering={FadeInUp.delay(700).duration(700)} style={styles.ctaWrap}>
        <Pressable style={styles.cta} onPress={confirm}>
          <Text style={styles.ctaText}>{t('onboarding.cta.continue')}</Text>
          <Text style={styles.ctaRune}> ›</Text>
        </Pressable>
      </Animated.View>
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
  cardSelected: {
    borderColor: palette.forge,
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
  },
  rune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.xxl,
    width: 40,
    textAlign: 'center',
    opacity: 0.6,
  },
  runeSelected: {
    color: palette.ember,
    opacity: 1,
  },
  cardText: { flex: 1, gap: space.xs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  name: {
    fontFamily: fontFamily.displayMid,
    color: palette.parchment,
    fontSize: fontSize.lg,
    letterSpacing: tracking.wide,
  },
  detectedBadge: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: 9,
    letterSpacing: tracking.rune,
    opacity: 0.85,
  },
  native: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.sm,
  },
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
  ctaRune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.lg,
  },
});

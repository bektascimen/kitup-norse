import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useState } from 'react';
import { useT, useI18nStore, syncTranslations } from '../../features/i18n';
import { useOnboarding, type Path } from '../../features/onboarding/store';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';
import { CarvedDivider } from '../../components/atmospherics/CarvedDivider';

const COPY = {
  tr: {
    eyebrow: 'ᛟ İLK KARAR',
    title: 'Senin yolun nedir, gezgin?',
    body: 'Verdiğin cevap, 21 günlük yolculuğunu şekillendirir — anlatıcının sesini, mitlerin seçimini, quizin tonunu.',
    cta: 'YOLU SEÇ',
    paths: {
      wisdom: {
        name: 'Bilge',
        sub: 'Odin’in patikası',
        body: 'Filozofik mitler, kozmik düzen, kelimelerin gücü.',
      },
      warrior: {
        name: 'Savaşçı',
        sub: 'Tyr’in çağrısı',
        body: 'Kahramanlar, Ragnarök, cesaretin sınavı.',
      },
      traveler: {
        name: 'Yolcu',
        sub: 'Loki’nin yolu',
        body: 'Dönüşüm, kurnazlık, dünyalar arası geçiş.',
      },
    },
  },
  en: {
    eyebrow: 'ᛟ FIRST CHOICE',
    title: 'Which path do you walk, traveler?',
    body: 'Your answer shapes the 21-day journey — the narrator’s voice, the myths chosen, the tone of the quizzes.',
    cta: 'CHOOSE PATH',
    paths: {
      wisdom: {
        name: 'The Wise',
        sub: 'Odin’s path',
        body: 'Philosophical myths, cosmic order, the power of words.',
      },
      warrior: {
        name: 'The Warrior',
        sub: 'Tyr’s call',
        body: 'Heroes, Ragnarök, the trial of courage.',
      },
      traveler: {
        name: 'The Traveler',
        sub: 'Loki’s road',
        body: 'Transformation, cunning, journeys between worlds.',
      },
    },
  },
} as const;

const PATH_DEFS: { key: Path; rune: string }[] = [
  { key: 'wisdom', rune: 'ᚨ' },
  { key: 'warrior', rune: 'ᛏ' },
  { key: 'traveler', rune: 'ᛚ' },
];

export default function PathPicker() {
  const t = useT();
  const locale = useI18nStore((s) => s.locale);
  const copy = COPY[locale === 'en' ? 'en' : 'tr'];
  const setPath = useOnboarding((s) => s.setPath);
  const finish = useOnboarding((s) => s.setCompleted);
  const [selected, setSelected] = useState<Path | null>(null);

  async function confirm() {
    if (!selected) return;
    setPath(selected);
    // Make sure translations for the chosen locale are fresh before tabs render.
    await syncTranslations(locale);
    finish();
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <GradientBackdrop variant="night" />
      <View style={styles.content}>
        <Animated.Text entering={FadeIn.duration(800)} style={styles.eyebrow}>
          {copy.eyebrow}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(150).duration(800)} style={styles.title}>
          {copy.title}
        </Animated.Text>
        <CarvedDivider />
        <Animated.Text entering={FadeInUp.delay(250).duration(800)} style={styles.bodyHint}>
          {copy.body}
        </Animated.Text>
        <View style={styles.cards}>
          {PATH_DEFS.map((def, i) => {
            const isSelected = selected === def.key;
            const c = copy.paths[def.key];
            return (
              <Animated.View key={def.key} entering={FadeInUp.delay(400 + i * 120).duration(800)}>
                <Pressable
                  onPress={() => setSelected(def.key)}
                  style={[styles.card, isSelected && styles.cardSelected]}
                >
                  <Text style={[styles.rune, isSelected && styles.runeSelected]}>{def.rune}</Text>
                  <View style={styles.cardText}>
                    <View style={styles.headerRow}>
                      <Text style={styles.name}>{c.name}</Text>
                      <Text style={styles.sub}>{c.sub}</Text>
                    </View>
                    <Text style={styles.bodyText}>{c.body}</Text>
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
      <Animated.View entering={FadeInUp.delay(900).duration(700)} style={styles.ctaWrap}>
        <Pressable
          style={[styles.cta, !selected && styles.ctaDisabled]}
          onPress={confirm}
          disabled={!selected}
        >
          <Text style={[styles.ctaText, !selected && styles.ctaTextDisabled]}>
            {selected ? copy.cta : t('onboarding.cta.continue')}
          </Text>
          <Text style={[styles.ctaRune, !selected && styles.ctaRuneDisabled]}> ›</Text>
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
    lineHeight: fontSize.xxl * 1.1,
    letterSpacing: tracking.tight,
    textAlign: 'center',
  },
  bodyHint: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
    textAlign: 'center',
    paddingHorizontal: space.md,
    marginBottom: space.lg,
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
    gap: space.md,
  },
  cardSelected: {
    borderColor: palette.forge,
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
  },
  rune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.xxl + 8,
    width: 44,
    textAlign: 'center',
    opacity: 0.55,
  },
  runeSelected: { color: palette.ember, opacity: 1 },
  cardText: { flex: 1, gap: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, flexWrap: 'wrap' },
  name: {
    fontFamily: fontFamily.displayMid,
    color: palette.parchment,
    fontSize: fontSize.lg,
    letterSpacing: tracking.wide,
  },
  sub: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.forge,
    fontSize: fontSize.xs,
    opacity: 0.85,
  },
  bodyText: {
    fontFamily: fontFamily.body,
    color: palette.mist,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
    marginTop: 2,
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
  ctaDisabled: { borderTopColor: palette.border },
  ctaText: {
    fontFamily: fontFamily.displayMid,
    color: palette.parchment,
    fontSize: fontSize.md,
    letterSpacing: tracking.wide,
  },
  ctaTextDisabled: { color: palette.shadow },
  ctaRune: { fontFamily: fontFamily.display, color: palette.forge, fontSize: fontSize.lg },
  ctaRuneDisabled: { color: palette.shadow },
});

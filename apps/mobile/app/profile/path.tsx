import { Stack, router } from 'expo-router';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useState } from 'react';
import { useI18nStore } from '../../features/i18n';
import { useOnboarding, type Path } from '../../features/onboarding/store';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';

const COPY = {
  tr: {
    eyebrow: 'ᛟ YOLUNU SEÇ',
    body: 'Verdiğin cevap, sonraki kursları şekillendirir — anlatıcının sesini, mitlerin seçimini, quizin tonunu.',
    cta: 'KAYDET',
    paths: {
      wisdom: { name: 'Bilge', sub: 'Odin’in patikası', body: 'Filozofik mitler, kozmik düzen.' },
      warrior: { name: 'Savaşçı', sub: 'Tyr’in çağrısı', body: 'Kahramanlar, Ragnarök, cesaret.' },
      traveler: { name: 'Yolcu', sub: 'Loki’nin yolu', body: 'Dönüşüm, kurnazlık, geçişler.' },
    },
  },
  en: {
    eyebrow: 'ᛟ CHOOSE YOUR PATH',
    body: 'Your answer shapes the courses ahead — the narrator’s voice, the myths chosen, the tone of the quizzes.',
    cta: 'SAVE',
    paths: {
      wisdom: { name: 'The Wise', sub: 'Odin’s path', body: 'Philosophical myths, cosmic order.' },
      warrior: { name: 'The Warrior', sub: 'Tyr’s call', body: 'Heroes, Ragnarök, courage.' },
      traveler: {
        name: 'The Traveler',
        sub: 'Loki’s road',
        body: 'Transformation, cunning, passage.',
      },
    },
  },
} as const;

const PATH_DEFS: { key: Path; rune: string }[] = [
  { key: 'wisdom', rune: 'ᚨ' },
  { key: 'warrior', rune: 'ᛏ' },
  { key: 'traveler', rune: 'ᛚ' },
];

export default function ProfilePath() {
  const locale = useI18nStore((s) => s.locale);
  const copy = COPY[locale === 'en' ? 'en' : 'tr'];
  const current = useOnboarding((s) => s.path);
  const setPath = useOnboarding((s) => s.setPath);
  const [selected, setSelected] = useState<Path | null>(current);

  function save() {
    if (!selected) return router.back();
    setPath(selected);
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: space.xxxl }}>
      <Stack.Screen options={{ title: locale === 'en' ? 'Path' : 'Yol' }} />
      <GradientBackdrop variant="night" />
      <View style={styles.content}>
        <Animated.Text entering={FadeIn.duration(600)} style={styles.eyebrow}>
          {copy.eyebrow}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(120).duration(700)} style={styles.body}>
          {copy.body}
        </Animated.Text>
        <View style={styles.cards}>
          {PATH_DEFS.map((def, i) => {
            const isSelected = selected === def.key;
            const c = copy.paths[def.key];
            return (
              <Animated.View key={def.key} entering={FadeInUp.delay(220 + i * 100).duration(700)}>
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
      <View style={styles.ctaWrap}>
        <Pressable style={styles.cta} onPress={save}>
          <Text style={styles.ctaText}>{copy.cta}</Text>
          <Text style={styles.ctaRune}> ›</Text>
        </Pressable>
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
    marginBottom: space.sm,
    textAlign: 'center',
  },
  body: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
    textAlign: 'center',
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
  cardSelected: { borderColor: palette.forge, backgroundColor: 'rgba(201, 169, 110, 0.08)' },
  rune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.xxl + 6,
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
  },
  check: {
    fontFamily: fontFamily.display,
    color: palette.shadow,
    fontSize: fontSize.xl,
    width: 24,
    textAlign: 'center',
  },
  checkActive: { color: palette.forge },
  ctaWrap: { paddingHorizontal: space.xl, paddingTop: space.lg },
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

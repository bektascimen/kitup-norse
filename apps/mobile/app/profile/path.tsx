import { Stack, router } from 'expo-router';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useState } from 'react';
import { useT } from '../../features/i18n';
import { useOnboarding, type Path } from '../../features/onboarding/store';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';

const PATH_DEFS: { key: Path; rune: string }[] = [
  { key: 'wisdom', rune: 'ᚨ' },
  { key: 'warrior', rune: 'ᛏ' },
  { key: 'traveler', rune: 'ᛚ' },
];

export default function ProfilePath() {
  const t = useT();
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
      <Stack.Screen options={{ title: t('profile.path.title') }} />
      <GradientBackdrop variant="night" />
      <View style={styles.content}>
        <Animated.Text entering={FadeIn.duration(600)} style={styles.eyebrow}>
          {t('profile.path.eyebrow')}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(120).duration(700)} style={styles.body}>
          {t('profile.path.body')}
        </Animated.Text>
        <View style={styles.cards}>
          {PATH_DEFS.map((def, i) => {
            const isSelected = selected === def.key;
            return (
              <Animated.View key={def.key} entering={FadeInUp.delay(220 + i * 100).duration(700)}>
                <Pressable
                  onPress={() => setSelected(def.key)}
                  style={[styles.card, isSelected && styles.cardSelected]}
                >
                  <Text style={[styles.rune, isSelected && styles.runeSelected]}>{def.rune}</Text>
                  <View style={styles.cardText}>
                    <View style={styles.headerRow}>
                      <Text style={styles.name}>{t(`path.${def.key}.name`)}</Text>
                      <Text style={styles.sub}>{t(`path.${def.key}.sub`)}</Text>
                    </View>
                    <Text style={styles.bodyText}>{t(`profile.path.${def.key}.body`)}</Text>
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

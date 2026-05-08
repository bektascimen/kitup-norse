import { useEffect } from 'react';
import { Modal, Pressable, View, Text, StyleSheet } from 'react-native';
import Animated, {
  ZoomIn,
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useT } from '../i18n';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { useBadges } from './useBadges';
import { useBadgesStore } from './store';

/**
 * Full-screen ritual reveal for newly-earned sigils. Mounted at action
 * surfaces where the user just did the thing that earned the badge —
 * primarily the lesson-complete screen. We pop one sigil at a time so
 * each unlock gets its own moment; a counter (1 / N) signals when more
 * are queued. Tap anywhere to acknowledge → marks the badge `seen`,
 * which both advances to the next unlock and fades the new-dot pulse
 * on the Profile sigil grid.
 */
export function SigilUnlockModal() {
  const t = useT();
  const { badges, newlyEarned } = useBadges();
  const markSeen = useBadgesStore((s) => s.markSeen);

  const nextId = newlyEarned[0];
  const badge = nextId ? badges.find((b) => b.id === nextId) : null;

  const halo = useSharedValue(0);

  useEffect(() => {
    if (!badge) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    halo.value = 0;
    halo.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [badge?.id, halo]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + halo.value * 0.55,
    transform: [{ scale: 1 + halo.value * 0.18 }],
  }));

  if (!badge) return null;

  const total = newlyEarned.length;
  const showCounter = total > 1;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={() => markSeen(badge.id)}>
        <Animated.View
          // Re-key on badge id so ZoomIn replays for each unlock.
          key={badge.id}
          entering={ZoomIn.springify().damping(14).mass(0.8)}
          style={styles.card}
        >
          <Animated.Text entering={FadeIn.delay(150).duration(700)} style={styles.eyebrow}>
            ᛞ {t('badge.unlocked.eyebrow').toUpperCase()}
            {showCounter ? `  ·  ${total}` : ''}
          </Animated.Text>

          <View style={styles.runeWrap}>
            <Animated.View style={[styles.runeHalo, haloStyle]} pointerEvents="none" />
            <Animated.Text
              entering={FadeIn.delay(120).duration(900)}
              style={styles.rune}
              allowFontScaling={false}
            >
              {badge.rune}
            </Animated.Text>
          </View>

          <Animated.Text entering={FadeInUp.delay(280).duration(700)} style={styles.title}>
            {t(`${badge.keyPrefix}.title`)}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(420).duration(700)} style={styles.condition}>
            {t(`${badge.keyPrefix}.condition`)}
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(560).duration(800)} style={styles.lore}>
            {t(`${badge.keyPrefix}.lore`)}
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(820).duration(600)} style={styles.ctaRow}>
            <Pressable
              style={({ pressed }) => [styles.cta, pressed && { opacity: 0.7 }]}
              onPress={() => markSeen(badge.id)}
            >
              <Text style={styles.ctaLabel}>{t('onboarding.cta.continue')}</Text>
              <Text style={styles.ctaRune}> ›</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const HALO_SIZE = 180;

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    paddingVertical: space.xxxl,
    paddingHorizontal: space.xl,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.forge,
    backgroundColor: palette.bg,
    alignItems: 'center',
  },
  eyebrow: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    marginBottom: space.lg,
  },
  runeWrap: {
    width: HALO_SIZE,
    height: HALO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  runeHalo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    backgroundColor: 'rgba(201, 169, 110, 0.16)',
    shadowColor: palette.forge,
    shadowOpacity: 0.6,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
  },
  rune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: 96,
    lineHeight: 112,
    textAlign: 'center',
  },
  title: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.xxl,
    letterSpacing: tracking.tight,
    textAlign: 'center',
  },
  condition: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    textAlign: 'center',
    marginTop: space.sm,
  },
  lore: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.55,
    marginTop: space.md,
    marginBottom: space.lg,
  },
  ctaRow: {
    width: '100%',
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 169, 110, 0.25)',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.md,
  },
  ctaLabel: {
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

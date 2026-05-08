import { Modal, Pressable, Text, StyleSheet } from 'react-native';
import { useT } from '../i18n';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import type { BadgeView } from './useBadges';
import { useBadgesStore } from './store';

type Props = {
  badge: BadgeView | null;
  onClose: () => void;
};

export function BadgeDetailSheet({ badge, onClose }: Props) {
  const t = useT();
  const markSeen = useBadgesStore((s) => s.markSeen);

  function close() {
    // Acknowledge a newly-earned badge when the user tap-dismisses the
    // detail sheet. Profile flow consumes the unlock here; quiz flow
    // consumes it in SigilUnlockModal — either path clears `newDot`.
    if (badge?.newlyEarned) markSeen(badge.id);
    onClose();
  }
  return (
    <Modal
      visible={!!badge}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
    >
      <Pressable style={styles.scrim} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {badge && (
            <>
              <Text
                style={[styles.rune, !badge.earned && styles.runeLocked]}
                allowFontScaling={false}
              >
                {badge.rune}
              </Text>
              <Text style={styles.title}>{t(`${badge.keyPrefix}.title`)}</Text>
              <Text style={styles.condition}>{t(`${badge.keyPrefix}.condition`)}</Text>
              <Text style={styles.lore}>{t(`${badge.keyPrefix}.lore`)}</Text>
              <Pressable style={styles.cta} onPress={close}>
                <Text style={styles.ctaLabel}>{t('badge.detail.close')}</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  sheet: {
    backgroundColor: palette.bg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.forge,
    padding: space.xl,
    alignItems: 'center',
    gap: space.sm,
  },
  rune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: 56,
  },
  runeLocked: { color: palette.mist, opacity: 0.5 },
  title: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.xl,
    letterSpacing: tracking.tight,
    textAlign: 'center',
  },
  condition: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    textAlign: 'center',
  },
  lore: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.5,
    marginTop: space.sm,
  },
  cta: {
    marginTop: space.lg,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: palette.forge,
  },
  ctaLabel: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
  },
});

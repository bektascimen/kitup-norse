import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useT } from '../i18n';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import type { BadgeView } from './useBadges';

type Props = {
  badge: BadgeView;
  onPress: (id: BadgeView['id']) => void;
};

export function BadgeCard({ badge, onPress }: Props) {
  const t = useT();
  const title = t(`${badge.keyPrefix}.title`);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        badge.earned ? styles.cardEarned : styles.cardLocked,
        badge.newlyEarned && styles.cardNew,
        pressed && { opacity: 0.7 },
      ]}
      onPress={() => onPress(badge.id)}
      hitSlop={4}
    >
      <Text
        style={[styles.rune, badge.earned ? styles.runeEarned : styles.runeLocked]}
        allowFontScaling={false}
      >
        {badge.rune}
      </Text>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {badge.newlyEarned && <View style={styles.newDot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 110,
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: space.xs,
  },
  cardEarned: {
    borderColor: palette.forge,
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
  },
  cardLocked: {
    borderColor: palette.border,
    backgroundColor: 'rgba(19, 24, 38, 0.4)',
  },
  cardNew: {
    borderColor: palette.forge,
    backgroundColor: 'rgba(201, 169, 110, 0.16)',
  },
  rune: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    marginTop: 2,
  },
  runeEarned: { color: palette.forge },
  runeLocked: { color: palette.mist, opacity: 0.5 },
  title: {
    fontFamily: fontFamily.displayMid,
    color: palette.parchment,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    textAlign: 'center',
    minHeight: 28,
  },
  newDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.forge,
  },
});

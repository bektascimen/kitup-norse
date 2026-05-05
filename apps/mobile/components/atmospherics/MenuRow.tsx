import { View, Text, Pressable, StyleSheet } from 'react-native';
import { palette, fontFamily, fontSize, space, tracking } from '../../theme';

export type MenuRowProps = {
  rune: string;
  title: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
};

export function MenuRow({ rune, title, value, onPress, destructive }: MenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={[styles.rune, destructive && styles.runeDestructive]}>{rune}</Text>
      <View style={styles.text}>
        <Text style={[styles.title, destructive && styles.titleDestructive]}>{title}</Text>
        {value !== undefined && <Text style={styles.value}>{value}</Text>}
      </View>
      {!destructive && <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

export function MenuSectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md + 2,
    paddingHorizontal: space.lg,
    gap: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  rowPressed: { backgroundColor: 'rgba(201, 169, 110, 0.06)' },
  rune: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.xl,
    width: 28,
    textAlign: 'center',
    opacity: 0.9,
  },
  runeDestructive: { color: palette.clottedBlood, opacity: 1 },
  text: { flex: 1, gap: 2 },
  title: {
    fontFamily: fontFamily.displayMid,
    color: palette.parchment,
    fontSize: fontSize.md,
    letterSpacing: tracking.wide,
  },
  titleDestructive: { color: palette.clottedBlood },
  value: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.sm,
  },
  chevron: {
    fontFamily: fontFamily.display,
    color: palette.mist,
    fontSize: fontSize.lg,
    opacity: 0.5,
  },
  sectionLabel: {
    fontFamily: fontFamily.displayMid,
    color: palette.shadow,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.sm,
  },
});

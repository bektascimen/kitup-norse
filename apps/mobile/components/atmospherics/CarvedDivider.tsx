import { View, Text, StyleSheet } from 'react-native';
import { fontFamily, fontSize, palette, space } from '../../theme';

export function CarvedDivider({ rune = 'ᛞ' }: { rune?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rune}>{rune}</Text>
      <View style={styles.line} />
      <Text style={styles.rune}>{rune}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  rune: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.md,
    color: palette.forge,
    opacity: 0.5,
  },
  line: { flex: 1, height: 1, backgroundColor: palette.border, opacity: 0.7 },
});

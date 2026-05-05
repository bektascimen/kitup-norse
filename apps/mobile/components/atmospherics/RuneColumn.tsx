import { View, Text, StyleSheet } from 'react-native';
import { fontFamily, fontSize, palette, space } from '../../theme';

const DEFAULT = ['ᚦ', 'ᚱ', 'ᚨ', 'ᚷ', 'ᛚ'] as const;

export function RuneColumn({
  runes = DEFAULT,
  opacity = 0.35,
}: {
  runes?: readonly string[];
  opacity?: number;
}) {
  return (
    <View style={styles.col} pointerEvents="none">
      {runes.map((r, i) => (
        <Text key={`${r}-${i}`} style={[styles.rune, { opacity }]}>
          {r}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  col: { gap: space.lg, alignItems: 'center' },
  rune: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.lg,
    color: palette.forge,
    letterSpacing: 4,
  },
});

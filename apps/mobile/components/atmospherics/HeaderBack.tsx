import { Pressable, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { palette, fontFamily, fontSize, space, tracking } from '../../theme';

/**
 * Shared back button for stack screen headers across the app.
 *
 * The chevron is wrapped in a fixed-size box so its tall lineBox doesn't
 * push the row out of vertical alignment with the centered Stack.Screen
 * title. Same Cinzel-caps treatment as the title keeps the header rhythm
 * cohesive.
 */
export function HeaderBack({ label, fallback = '/(tabs)' }: { label: string; fallback?: string }) {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback as never))}
      hitSlop={16}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.55 }]}
    >
      <View style={styles.chevronWrap}>
        <Text style={styles.chevron}>‹</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    gap: 6,
  },
  chevronWrap: {
    width: 14,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: 24,
    lineHeight: 24,
    includeFontPadding: false,
  },
  label: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.sm,
    letterSpacing: tracking.wide,
    includeFontPadding: false,
  },
});

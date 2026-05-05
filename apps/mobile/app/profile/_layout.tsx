import { Stack, router } from 'expo-router';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useI18nStore } from '../../features/i18n';
import { palette, fontFamily, fontSize, space, tracking } from '../../theme';

function BackButton() {
  const locale = useI18nStore((s) => s.locale);
  const label = locale === 'en' ? 'PROFILE' : 'PROFİL';

  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
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

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.bg },
        headerTintColor: palette.parchment,
        headerTitleStyle: {
          fontFamily: fontFamily.display,
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerBackVisible: false,
        headerLeft: () => <BackButton />,
        contentStyle: { backgroundColor: palette.bg },
      }}
    />
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
  // Bake the chevron into a fixed-size box so its tall lineBox doesn't
  // throw the rest of the row out of vertical alignment.
  chevronWrap: {
    width: 14,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: 26,
    lineHeight: 26,
    includeFontPadding: false,
  },
  label: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.sm,
    letterSpacing: tracking.wide,
  },
});

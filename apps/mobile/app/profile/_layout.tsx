import { Stack, router } from 'expo-router';
import { Pressable, Text, StyleSheet } from 'react-native';
import { palette, fontFamily, fontSize, space } from '../../theme';

function BackButton() {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
      hitSlop={12}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.55 }]}
    >
      <Text style={styles.chevron}>‹</Text>
      <Text style={styles.label}>Profil</Text>
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
        headerBackVisible: false, // we render our own
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
    gap: 2,
  },
  chevron: {
    fontFamily: fontFamily.display,
    color: palette.forge,
    fontSize: fontSize.xxl,
    lineHeight: fontSize.xxl,
    marginTop: -2,
  },
  label: {
    fontFamily: fontFamily.bodyMedium,
    color: palette.forge,
    fontSize: fontSize.md,
  },
});

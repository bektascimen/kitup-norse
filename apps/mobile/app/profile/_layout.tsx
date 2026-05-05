import { Stack } from 'expo-router';
import { palette, fontFamily } from '../../theme';

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
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: palette.bg },
      }}
    />
  );
}

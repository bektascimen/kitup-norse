import { Stack } from 'expo-router';
import { useI18nStore } from '../../features/i18n';
import { palette, fontFamily } from '../../theme';
import { HeaderBack } from '../../components/atmospherics/HeaderBack';

function ProfileBack() {
  const locale = useI18nStore((s) => s.locale);
  return <HeaderBack label={locale === 'en' ? 'PROFILE' : 'PROFİL'} fallback="/(tabs)/profile" />;
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
        headerLeft: () => <ProfileBack />,
        contentStyle: { backgroundColor: palette.bg },
      }}
    />
  );
}

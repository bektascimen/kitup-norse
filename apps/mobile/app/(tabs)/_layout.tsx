import { Tabs } from 'expo-router';
import { useT } from '../../features/i18n';
import { palette } from '../../theme';

export default function TabsLayout() {
  const t = useT();
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: palette.bgElevated, borderTopColor: palette.border },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textMid,
        headerStyle: { backgroundColor: palette.bg },
        headerTintColor: palette.textHigh,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.today') }} />
      <Tabs.Screen name="path" options={{ title: t('tabs.path') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}

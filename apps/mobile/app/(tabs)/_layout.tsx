import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useT } from '../../features/i18n';
import { palette, fontFamily, fontSize, tracking } from '../../theme';

// Rune iconography for each tab — keeps the Skaldic Twilight aesthetic.
//   Dagaz (ᛞ) — day, dawn, the breakthrough that begins each session.
//   Raidho (ᚱ) — journey, the road; perfect anchor for the path tab.
//   Othala (ᛟ) — heritage, hearth, self; the inward turn for profile.
const RUNES = {
  today: 'ᛞ',
  path: 'ᚱ',
  profile: 'ᛟ',
} as const;

function RuneIcon({ rune, focused }: { rune: string; focused: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.rune, focused ? styles.runeActive : styles.runeIdle]}>{rune}</Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

export default function TabsLayout() {
  const t = useT();
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: palette.bgElevated,
          borderTopColor: palette.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 78,
          paddingTop: 8,
          paddingBottom: 18,
        },
        tabBarActiveTintColor: palette.ember,
        tabBarInactiveTintColor: palette.mist,
        tabBarLabelStyle: {
          fontFamily: fontFamily.displayMid,
          fontSize: fontSize.xs,
          letterSpacing: tracking.wide,
          marginTop: 2,
        },
        headerStyle: { backgroundColor: palette.bg },
        headerTintColor: palette.textHigh,
        headerTitleStyle: {
          fontFamily: fontFamily.display,
          letterSpacing: tracking.wide,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ focused }) => <RuneIcon rune={RUNES.today} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="path"
        options={{
          title: t('tabs.path'),
          tabBarIcon: ({ focused }) => <RuneIcon rune={RUNES.path} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused }) => <RuneIcon rune={RUNES.profile} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', height: 28 },
  rune: {
    fontFamily: fontFamily.display,
    fontSize: 22,
  },
  runeIdle: { color: palette.mist, opacity: 0.55 },
  runeActive: { color: palette.ember },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.forge,
    marginTop: 3,
  },
});

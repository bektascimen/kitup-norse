import { Stack } from 'expo-router';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { useT } from '../../features/i18n';
import { ensurePermissions, scheduleDailyReminder } from '../../features/notifications/schedule';
import { mmkv } from '../../lib/storage';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';

const TIME_KEY = 'notifications.time';

const TIMES = [
  { label: '07:00', hour: 7, minute: 0, eyebrowKey: 'profile.notifications.time.dawn' },
  { label: '12:00', hour: 12, minute: 0, eyebrowKey: 'profile.notifications.time.midday' },
  { label: '19:00', hour: 19, minute: 0, eyebrowKey: 'profile.notifications.time.twilight' },
  { label: '21:00', hour: 21, minute: 0, eyebrowKey: 'profile.notifications.time.night' },
];

type Status = 'unknown' | 'granted' | 'denied';

export default function ProfileNotifications() {
  const t = useT();
  const [status, setStatus] = useState<Status>('unknown');
  const [selectedLabel, setSelectedLabel] = useState<string>(
    () => mmkv.getString(TIME_KEY) ?? '19:00',
  );
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    Notifications.getPermissionsAsync().then((s) => setStatus(s.granted ? 'granted' : 'denied'));
  }, []);

  async function requestPermission() {
    const ok = await ensurePermissions();
    setStatus(ok ? 'granted' : 'denied');
  }

  async function pickTime(label: string, hour: number, minute: number) {
    setSelectedLabel(label);
    mmkv.set(TIME_KEY, label);
    if (status !== 'granted') return;
    if (Platform.OS === 'web') return;
    await scheduleDailyReminder({ hour, minute });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('profile.notifications.title') }} />
      <GradientBackdrop variant="night" />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>ᛒ {t('profile.notifications.eyebrow')}</Text>
        <Text style={styles.body}>{t('profile.notifications.body')}</Text>

        <View style={styles.permissionBlock}>
          <Text style={styles.sectionLabel}>{t('profile.notifications.section.permission')}</Text>
          {status === 'granted' ? (
            <View style={styles.permissionRow}>
              <Text style={styles.permissionGranted}>✓ {t('profile.notifications.granted')}</Text>
              <Text style={styles.permissionHint}>{t('profile.notifications.granted_hint')}</Text>
            </View>
          ) : (
            <Pressable style={styles.permissionAsk} onPress={requestPermission}>
              <Text style={styles.permissionAskText}>{t('profile.notifications.request')}</Text>
              <Text style={styles.permissionHint}>{t('profile.notifications.request_hint')}</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionLabel}>{t('profile.notifications.section.time')}</Text>
        <View style={styles.times}>
          {TIMES.map((time) => {
            const active = selectedLabel === time.label;
            return (
              <Pressable
                key={time.label}
                onPress={() => pickTime(time.label, time.hour, time.minute)}
                style={[styles.timeCard, active && styles.timeCardActive]}
              >
                <Text style={[styles.timeRune, active && styles.timeRuneActive]}>
                  {t(time.eyebrowKey)}
                </Text>
                <Text style={[styles.timeLabel, active && styles.timeLabelActive]}>
                  {time.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {savedToast && (
          <Text style={styles.savedToast}>ᛞ {t('profile.notifications.saved_toast')}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  content: { flex: 1, paddingHorizontal: space.xl, paddingTop: space.lg },
  eyebrow: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    marginBottom: space.sm,
  },
  body: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.5,
    marginBottom: space.xl,
  },
  permissionBlock: { marginBottom: space.xl },
  sectionLabel: {
    fontFamily: fontFamily.displayMid,
    color: palette.shadow,
    fontSize: fontSize.xs,
    letterSpacing: tracking.rune,
    marginBottom: space.sm,
  },
  permissionRow: {
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.moss,
    backgroundColor: 'rgba(90, 140, 92, 0.08)',
  },
  permissionGranted: {
    fontFamily: fontFamily.displayMid,
    color: palette.moss,
    fontSize: fontSize.md,
    letterSpacing: tracking.wide,
  },
  permissionHint: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  permissionAsk: {
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.forge,
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
  },
  permissionAskText: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.md,
    letterSpacing: tracking.wide,
  },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  timeCard: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'rgba(19, 24, 38, 0.6)',
    alignItems: 'flex-start',
    gap: 2,
  },
  timeCardActive: {
    borderColor: palette.forge,
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
  },
  timeRune: {
    fontFamily: fontFamily.bodyItalic,
    color: palette.mist,
    fontSize: fontSize.sm,
    opacity: 0.85,
  },
  timeRuneActive: { color: palette.ember, opacity: 1 },
  timeLabel: {
    fontFamily: fontFamily.display,
    color: palette.parchment,
    fontSize: fontSize.xl,
    letterSpacing: tracking.tight,
  },
  timeLabelActive: { color: palette.parchment },
  savedToast: {
    fontFamily: fontFamily.displayMid,
    color: palette.forge,
    fontSize: fontSize.sm,
    letterSpacing: tracking.wide,
    marginTop: space.lg,
    textAlign: 'center',
  },
});

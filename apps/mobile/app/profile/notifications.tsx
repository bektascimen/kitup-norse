import { Stack } from 'expo-router';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { useI18nStore } from '../../features/i18n';
import { ensurePermissions, scheduleDailyReminder } from '../../features/notifications/schedule';
import { mmkv } from '../../lib/storage';
import { palette, fontFamily, fontSize, space, radius, tracking } from '../../theme';
import { GradientBackdrop } from '../../components/atmospherics/GradientBackdrop';

const TIME_KEY = 'notifications.time';

const TIMES = [
  { label: '07:00', hour: 7, minute: 0, eyebrowTr: 'Şafak', eyebrowEn: 'Dawn' },
  { label: '12:00', hour: 12, minute: 0, eyebrowTr: 'Öğle', eyebrowEn: 'Midday' },
  { label: '19:00', hour: 19, minute: 0, eyebrowTr: 'Alacakaranlık', eyebrowEn: 'Twilight' },
  { label: '21:00', hour: 21, minute: 0, eyebrowTr: 'Gece', eyebrowEn: 'Night' },
];

type Status = 'unknown' | 'granted' | 'denied';

export default function ProfileNotifications() {
  const locale = useI18nStore((s) => s.locale);
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

  const T = (tr: string, en: string) => (locale === 'en' ? en : tr);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: T('Bildirimler', 'Notifications') }} />
      <GradientBackdrop variant="night" />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>ᛒ {T('GÜNLÜK ÇAĞRI', 'DAILY CALL')}</Text>
        <Text style={styles.body}>
          {T(
            'Yggdrasil seni hangi saatte çağırsın? Her gün yumuşak bir hatırlatma gelir.',
            'When should Yggdrasil call you? A soft reminder lands each day at this hour.',
          )}
        </Text>

        <View style={styles.permissionBlock}>
          <Text style={styles.sectionLabel}>{T('İZİN', 'PERMISSION')}</Text>
          {status === 'granted' ? (
            <View style={styles.permissionRow}>
              <Text style={styles.permissionGranted}>
                ✓ {T('İzin verildi', 'Permission granted')}
              </Text>
              <Text style={styles.permissionHint}>
                {T('iOS Ayarlar’dan istediğin zaman değiştir.', 'Change anytime in iOS Settings.')}
              </Text>
            </View>
          ) : (
            <Pressable style={styles.permissionAsk} onPress={requestPermission}>
              <Text style={styles.permissionAskText}>{T('İZİN İSTE', 'REQUEST PERMISSION')}</Text>
              <Text style={styles.permissionHint}>
                {T(
                  'Bildirim göndermek için iOS izni gerekiyor.',
                  'iOS permission is required to send notifications.',
                )}
              </Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionLabel}>{T('SAAT', 'TIME')}</Text>
        <View style={styles.times}>
          {TIMES.map((t) => {
            const active = selectedLabel === t.label;
            return (
              <Pressable
                key={t.label}
                onPress={() => pickTime(t.label, t.hour, t.minute)}
                style={[styles.timeCard, active && styles.timeCardActive]}
              >
                <Text style={[styles.timeRune, active && styles.timeRuneActive]}>
                  {locale === 'en' ? t.eyebrowEn : t.eyebrowTr}
                </Text>
                <Text style={[styles.timeLabel, active && styles.timeLabelActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {savedToast && (
          <Text style={styles.savedToast}>ᛞ {T('Hatırlatma kaydedildi', 'Reminder saved')}</Text>
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

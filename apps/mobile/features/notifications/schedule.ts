import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { i18nCache, useI18nStore } from '../i18n';

export async function ensurePermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return !!req.granted;
}

export async function scheduleDailyReminder(time: { hour: number; minute: number }) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const locale = useI18nStore.getState().locale;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18nCache.get('notifications.daily.title', locale),
      body: i18nCache.get('notifications.daily.body', locale),
    },
    trigger: { hour: time.hour, minute: time.minute, repeats: true } as any,
  });
}

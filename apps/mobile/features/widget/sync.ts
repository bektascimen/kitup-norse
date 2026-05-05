import { Platform } from 'react-native';

/**
 * Writes today's lesson summary to the shared App Group container so the iOS
 * home-screen widget can read it.
 *
 * NOTE: this is a no-op until the project includes a native module that bridges
 * to UserDefaults(suiteName:). Options: `react-native-shared-group-preferences`
 * (requires dev-client build) OR a small Swift helper added by the same Apple
 * Targets prebuild step. For the case-study scaffold we keep this as a typed
 * stub so callers compile and the widget reads its placeholder content.
 */
export async function syncTodayWidget(args: { title: string; day: number; totalDays: number }): Promise<void> {
  if (Platform.OS !== 'ios') return;
  // TODO: call native module to write `args` as JSON to UserDefaults(suiteName: "group.com.kitup.norse"),
  // key "today.json". Until then the widget shows its placeholder.
  // eslint-disable-next-line no-console
  console.log('[widget] (stub) would persist', args);
}

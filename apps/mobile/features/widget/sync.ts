import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import WidgetCenter from 'react-native-widget-center';

const APP_GROUP = 'group.com.kitup.norse';
const KEY = 'today.json';

/**
 * Persists today's lesson summary to the shared App Group container so
 * the iOS home-screen widget (`apps/mobile/targets/TodayWidget/index.swift`)
 * can read it.
 *
 * Storage format note: `react-native-shared-group-preferences` expects
 * an NSString as the value (its setItem signature casts via `setValue:`
 * which only handles strings). If we pass a JS object the bridge stores
 * an empty/garbled value and the widget falls back to its placeholder
 * (DAY 00 / "kitUP Norse"). The fix is to JSON-stringify on this side
 * and JSON-decode on the Swift side.
 *
 * Best-effort: any error is swallowed (widget retains its previous
 * payload, or its Swift placeholder until the next successful sync).
 * Android no-ops.
 */
export async function syncTodayWidget(args: {
  title: string;
  day: number;
  totalDays: number;
  /** Current streak (consecutive days). Hidden when 0 or absent. */
  streak?: number;
  /** Today's lesson row id — drives the deep link target. */
  lessonId?: string;
}): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    await SharedGroupPreferences.setItem(KEY, JSON.stringify(args), APP_GROUP);
    // Force the widget to re-pull the timeline now. Without this iOS
    // may serve cached entries for up to ~15 minutes (or longer under
    // its system rate-limit), so DB-state changes — like switching
    // paths or wiping progress — only show up after a delay.
    WidgetCenter.reloadAllTimelines();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[widget] sync failed', err);
  }
}

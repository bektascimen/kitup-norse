import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const dsn =
  (Constants.expoConfig?.extra as { SENTRY_DSN_MOBILE?: string } | undefined)?.SENTRY_DSN_MOBILE ??
  process.env.SENTRY_DSN_MOBILE;

export function initSentry() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    enableAutoSessionTracking: true,
    tracesSampleRate: 0.2,
  });
}

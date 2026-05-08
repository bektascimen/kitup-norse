import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'kitUP Norse',
  slug: 'kitup-norse',
  scheme: 'kitup',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0B0B0F',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.kitup.norse',
    appleTeamId: '8PVDZ6B99N',
    usesAppleSignIn: true,
    entitlements: { 'com.apple.security.application-groups': ['group.com.kitup.norse'] },
  },
  android: {
    package: 'com.kitup.norse',
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#0B0B0F',
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-apple-authentication',
    '@react-native-community/datetimepicker',
    // '@sentry/react-native' build-time plugin removed: it injects a
    // PhaseScriptExecution that uploads source maps to Sentry, which
    // requires SENTRY_AUTH_TOKEN/ORG/PROJECT in env. Personal-team
    // device builds don't have those and the script fails the whole
    // build. Runtime crash reporting still works through initSentry()
    // + the DSN env var; only the source-map upload is skipped.
    // Widget extension. v4 API: target Swift + entitlements live under
    // `targets/widget/` with an `expo-target.config.js`. The plugin
    // reads that folder during prebuild and links it as a separate
    // Xcode target signed under `ios.appleTeamId`. App Group is mirrored
    // from the host app's `ios.entitlements` so widget and app share
    // the same `group.com.kitup.norse` UserDefaults suite.
    '@bacons/apple-targets',
  ],
  experiments: { typedRoutes: true },
  extra: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    SENTRY_DSN_MOBILE: process.env.SENTRY_DSN_MOBILE,
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
    POSTHOG_HOST: process.env.POSTHOG_HOST,
  },
};

export default config;

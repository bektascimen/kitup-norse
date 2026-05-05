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
    '@sentry/react-native',
    // Widget extension plugin disabled until appleTeamId is set + signing configured.
    // Re-enable after replacing 'TEAMID' with your real Apple Developer team id.
    // [
    //   '@bacons/apple-targets',
    //   {
    //     appleTeamId: 'TEAMID',
    //     extensions: [
    //       {
    //         name: 'TodayWidget',
    //         bundleIdentifier: 'com.kitup.norse.TodayWidget',
    //         entitlements: { 'com.apple.security.application-groups': ['group.com.kitup.norse'] },
    //       },
    //     ],
    //   },
    // ],
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

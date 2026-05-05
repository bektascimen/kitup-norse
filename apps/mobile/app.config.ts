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
  ios: { supportsTablet: false, bundleIdentifier: 'com.kitup.norse', usesAppleSignIn: true },
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
  plugins: ['expo-router', 'expo-font', 'expo-secure-store', 'expo-apple-authentication'],
  experiments: { typedRoutes: true },
  extra: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  },
};

export default config;

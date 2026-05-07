import { initSentry } from '../lib/sentry';
initSentry(); // module-load side effect — runs once on app start

import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ThemeProvider, fontMap, palette } from '../theme';
import { queryClient } from '../lib/queryClient';
import { mmkvPersister } from '../lib/queryPersist';
import { bootstrapAuth } from '../features/auth/bootstrap';
import { syncTranslations, subscribeTranslations, useI18nStore } from '../features/i18n';
import { ensurePermissions } from '../features/notifications/schedule';
import { startOutboxListener } from '../features/quiz/outbox';
import { subscribeContent } from '../features/realtime/subscribe';
import { LoadingScreen } from '../components/atmospherics/LoadingScreen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontMap);

  useEffect(() => {
    if (fontsLoaded) {
      // Hand the screen off to JS as soon as fonts are in. The
      // i18n sync may still be in flight; the JS-side LoadingScreen
      // takes over until both are ready, keeping the brand presence
      // alive instead of flashing through a null frame.
      SplashScreen.hideAsync();
      bootstrapAuth();
    }
  }, [fontsLoaded]);

  // Skip permission prompt during demo screenshot pass — re-enable after.
  // useEffect(() => {
  //   ensurePermissions();
  // }, []);

  useEffect(() => {
    return startOutboxListener();
  }, []);

  useEffect(() => {
    return subscribeContent();
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    let unsub: (() => void) | undefined;
    (async () => {
      const locale = useI18nStore.getState().locale;
      try {
        await syncTranslations(locale);
      } finally {
        // Always release the splash gate — a network outage shouldn't
        // trap the user. The cache still has the last good payload.
        useI18nStore.getState().setReady(true);
      }
      unsub = subscribeTranslations(locale);
    })();
    return () => unsub?.();
  }, [fontsLoaded]);

  const i18nReady = useI18nStore((s) => s.ready);

  // While fonts arrive, the native splash is still up. Once the JS
  // bridge is alive but i18n is still warming, render the on-brand
  // LoadingScreen so the boot sequence reads as a single continuous
  // beat rather than splash → black → app.
  if (!fontsLoaded) return null;
  if (!i18nReady) return <LoadingScreen />;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: mmkvPersister, maxAge: 1000 * 60 * 60 * 24 * 30 }}
    >
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: palette.bg },
              headerTintColor: palette.textHigh,
              contentStyle: { backgroundColor: palette.bg },
            }}
          >
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}

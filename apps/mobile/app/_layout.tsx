import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, fontMap, palette } from '../theme';
import { queryClient } from '../lib/queryClient';
import { bootstrapAuth } from '../features/auth/bootstrap';
import { syncTranslations, subscribeTranslations, useI18nStore } from '../features/i18n';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontMap);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      bootstrapAuth();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!fontsLoaded) return;
    let unsub: (() => void) | undefined;
    (async () => {
      const locale = useI18nStore.getState().locale;
      await syncTranslations(locale);
      useI18nStore.getState().setReady(true);
      unsub = subscribeTranslations(locale);
    })();
    return () => unsub?.();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: palette.bg },
              headerTintColor: palette.textHigh,
              contentStyle: { backgroundColor: palette.bg },
            }}
          />
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

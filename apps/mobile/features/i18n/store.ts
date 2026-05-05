import { create } from 'zustand';
import { NativeModules, Platform } from 'react-native';
import type { Locale } from '@kitup/shared-types';
import { I18nCache } from './cache';
import { mmkv } from '../../lib/storage';

const cache = new I18nCache(mmkv);
const LOCALE_KEY = 'i18n.locale';

/** Read the device language without any native module — works on iOS, Android, web. */
function deviceLanguageCode(): string {
  // 1) Intl is available in Hermes/JSC and resolves to OS locale
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale;
    if (tag) return tag.split('-')[0]!.toLowerCase();
  } catch {
    /* ignore */
  }
  // 2) iOS fallback — RN exposes the system settings bag
  if (Platform.OS === 'ios') {
    const settings = NativeModules.SettingsManager?.settings;
    const tag: string | undefined = settings?.AppleLocale ?? settings?.AppleLanguages?.[0];
    if (tag) return tag.split(/[-_]/)[0]!.toLowerCase();
  }
  // 3) Android fallback
  if (Platform.OS === 'android') {
    const tag: string | undefined = NativeModules.I18nManager?.localeIdentifier;
    if (tag) return tag.split(/[-_]/)[0]!.toLowerCase();
  }
  return 'en';
}

/** Resolve initial locale: persisted choice → device language → 'en' fallback. */
function detectInitialLocale(): Locale {
  const stored = mmkv.getString(LOCALE_KEY);
  if (stored === 'tr' || stored === 'en') return stored;
  return deviceLanguageCode() === 'tr' ? 'tr' : 'en';
}

type State = {
  locale: Locale;
  ready: boolean;
  bump: number; // re-render trigger when cache updates
  setLocale: (l: Locale) => void;
  setReady: (r: boolean) => void;
  triggerRender: () => void;
};

export const useI18nStore = create<State>((set) => ({
  locale: detectInitialLocale(),
  ready: false,
  bump: 0,
  setLocale: (locale) => {
    mmkv.set(LOCALE_KEY, locale);
    set({ locale });
  },
  setReady: (ready) => set({ ready }),
  triggerRender: () => set((s) => ({ bump: s.bump + 1 })),
}));

export const i18nCache = cache;

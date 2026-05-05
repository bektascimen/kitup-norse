import { create } from 'zustand';
import * as Localization from 'expo-localization';
import type { Locale } from '@kitup/shared-types';
import { I18nCache } from './cache';
import { mmkv } from '../../lib/storage';

const cache = new I18nCache(mmkv);
const LOCALE_KEY = 'i18n.locale';

/** Resolve initial locale: persisted choice → device language → 'en' fallback. */
function detectInitialLocale(): Locale {
  const stored = mmkv.getString(LOCALE_KEY);
  if (stored === 'tr' || stored === 'en') return stored;
  const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';
  return deviceLang === 'tr' ? 'tr' : 'en';
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

import { create } from 'zustand';
import type { Locale } from '@kitup/shared-types';
import { I18nCache } from './cache';
import { mmkv } from '../../lib/storage';

const cache = new I18nCache(mmkv);

type State = {
  locale: Locale;
  ready: boolean;
  bump: number; // re-render trigger when cache updates
  setLocale: (l: Locale) => void;
  setReady: (r: boolean) => void;
  triggerRender: () => void;
};

export const useI18nStore = create<State>((set) => ({
  locale: 'tr',
  ready: false,
  bump: 0,
  setLocale: (locale) => set({ locale }),
  setReady: (ready) => set({ ready }),
  triggerRender: () => set((s) => ({ bump: s.bump + 1 })),
}));

export const i18nCache = cache;

import { useCallback } from 'react';
import { useI18nStore, i18nCache } from './store';

export function useT() {
  const locale = useI18nStore((s) => s.locale);
  // bump dependency forces re-render when cache mutates
  useI18nStore((s) => s.bump);

  return useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const raw = i18nCache.get(key, locale);
      if (!vars) return raw;
      return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''));
    },
    [locale],
  );
}

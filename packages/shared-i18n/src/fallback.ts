import { DEFAULT_LOCALE, type Locale } from '@kitup/shared-types';

export type Dictionary = Partial<Record<Locale, Record<string, string>>>;

export type Resolution = {
  value: string;
  source: 'requested' | 'fallback' | 'missing';
};

export function resolveTranslation(
  key: string,
  locale: Locale,
  dict: Dictionary,
): Resolution {
  const requested = dict[locale]?.[key];
  if (requested !== undefined) return { value: requested, source: 'requested' };

  if (locale !== DEFAULT_LOCALE) {
    const fallback = dict[DEFAULT_LOCALE]?.[key];
    if (fallback !== undefined) return { value: fallback, source: 'fallback' };
  }
  return { value: key, source: 'missing' };
}

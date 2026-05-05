import type { Locale } from '@kitup/shared-types';
import { resolveTranslation, type Dictionary } from '@kitup/shared-i18n';

type StorageLike = {
  getString: (k: string) => string | undefined;
  set: (k: string, v: string) => void;
  delete: (k: string) => void;
};

type Row = { key: string; value: string; updated_at: string };
type LocaleData = { entries: Record<string, string>; lastUpdated: string };

const KEY_PREFIX = 'i18n.v1.';

export class I18nCache {
  private memo: Partial<Record<Locale, LocaleData>> = {};

  constructor(private storage: StorageLike) {}

  private read(locale: Locale): LocaleData {
    if (this.memo[locale]) return this.memo[locale]!;
    const raw = this.storage.getString(`${KEY_PREFIX}${locale}`);
    const data: LocaleData = raw ? JSON.parse(raw) : { entries: {}, lastUpdated: '1970-01-01T00:00:00Z' };
    this.memo[locale] = data;
    return data;
  }

  private write(locale: Locale, data: LocaleData) {
    this.memo[locale] = data;
    this.storage.set(`${KEY_PREFIX}${locale}`, JSON.stringify(data));
  }

  upsert(locale: Locale, rows: Row[]): void {
    const cur = this.read(locale);
    let lastUpdated = cur.lastUpdated;
    for (const r of rows) {
      cur.entries[r.key] = r.value;
      if (r.updated_at > lastUpdated) lastUpdated = r.updated_at;
    }
    this.write(locale, { entries: cur.entries, lastUpdated });
  }

  get(key: string, locale: Locale): string {
    const dict: Dictionary = {
      tr: this.read('tr').entries,
      en: this.read('en').entries,
    };
    return resolveTranslation(key, locale, dict).value;
  }

  lastSyncedAt(locale: Locale): string {
    return this.read(locale).lastUpdated;
  }

  clear(): void {
    this.memo = {};
    (['tr', 'en'] as const).forEach((l) => this.storage.delete(`${KEY_PREFIX}${l}`));
  }
}

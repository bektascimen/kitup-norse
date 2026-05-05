import { describe, it, expect, beforeEach } from '@jest/globals';
import { I18nCache } from '../cache';

const STORAGE: Record<string, string> = {};
const fakeStorage = {
  getString: (k: string) => STORAGE[k],
  set: (k: string, v: string) => { STORAGE[k] = v; },
  delete: (k: string) => { delete STORAGE[k]; },
};

describe('I18nCache', () => {
  beforeEach(() => Object.keys(STORAGE).forEach((k) => delete STORAGE[k]));

  it('returns the cached value when present', () => {
    const cache = new I18nCache(fakeStorage as any);
    cache.upsert('tr', [{ key: 'a', value: 'A', updated_at: '2026-01-01T00:00:00Z' }]);
    expect(cache.get('a', 'tr')).toBe('A');
  });

  it('falls back to default locale (tr) when missing in requested locale', () => {
    const cache = new I18nCache(fakeStorage as any);
    cache.upsert('tr', [{ key: 'x', value: 'XTR', updated_at: '2026-01-01T00:00:00Z' }]);
    expect(cache.get('x', 'en')).toBe('XTR');
  });

  it('returns the key itself when missing in both locales', () => {
    const cache = new I18nCache(fakeStorage as any);
    expect(cache.get('missing.key', 'en')).toBe('missing.key');
  });

  it('returns the latest updated_at across cached locales', () => {
    const cache = new I18nCache(fakeStorage as any);
    cache.upsert('tr', [{ key: 'a', value: 'A', updated_at: '2026-01-01T00:00:00Z' }]);
    cache.upsert('en', [{ key: 'a', value: 'A', updated_at: '2026-02-01T00:00:00Z' }]);
    expect(cache.lastSyncedAt('en')).toBe('2026-02-01T00:00:00Z');
  });

  it('persists across new instances using the same storage', () => {
    const c1 = new I18nCache(fakeStorage as any);
    c1.upsert('tr', [{ key: 'a', value: 'A', updated_at: '2026-01-01T00:00:00Z' }]);
    const c2 = new I18nCache(fakeStorage as any);
    expect(c2.get('a', 'tr')).toBe('A');
  });
});

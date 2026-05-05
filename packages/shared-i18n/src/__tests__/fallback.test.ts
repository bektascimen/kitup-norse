import { describe, expect, it } from 'vitest';
import { resolveTranslation } from '../fallback';

const dict = {
  tr: { 'tabs.today': 'Bugün', 'tabs.path': 'Yol' },
  en: { 'tabs.today': 'Today' },
};

describe('resolveTranslation', () => {
  it('returns the value for the requested locale', () => {
    expect(resolveTranslation('tabs.today', 'tr', dict)).toEqual({
      value: 'Bugün',
      source: 'requested',
    });
  });

  it('falls back to the default locale (tr) if requested locale missing', () => {
    expect(resolveTranslation('tabs.path', 'en', dict)).toEqual({
      value: 'Yol',
      source: 'fallback',
    });
  });

  it('returns the key itself with source=missing if both locales lack it', () => {
    expect(resolveTranslation('tabs.unknown', 'en', dict)).toEqual({
      value: 'tabs.unknown',
      source: 'missing',
    });
  });

  it('returns missing if dict has no fallback locale entry', () => {
    expect(resolveTranslation('foo', 'en', { en: {} })).toEqual({
      value: 'foo',
      source: 'missing',
    });
  });
});

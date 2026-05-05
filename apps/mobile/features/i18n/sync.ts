import type { Locale } from '@kitup/shared-types';
import { supabase } from '../../lib/supabase';
import { i18nCache, useI18nStore } from './store';

export async function syncTranslations(locale: Locale): Promise<void> {
  const since = i18nCache.lastSyncedAt(locale);
  const { data, error } = await supabase
    .from('translations')
    .select('key,value,updated_at')
    .eq('locale', locale)
    .gt('updated_at', since);
  if (error) {
    console.warn('[i18n sync] failed', error.message);
    return;
  }
  if (data && data.length > 0) {
    i18nCache.upsert(locale, data);
    useI18nStore.getState().triggerRender();
  }
}

export function subscribeTranslations(locale: Locale): () => void {
  const channel = supabase
    .channel(`translations:${locale}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'translations', filter: `locale=eq.${locale}` },
      (payload) => {
        const row = (payload.new ?? payload.old) as { key: string; value: string; updated_at: string };
        if (row && payload.new) {
          i18nCache.upsert(locale, [row]);
          useI18nStore.getState().triggerRender();
        }
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

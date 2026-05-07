import type { Locale } from '@kitup/shared-types';
import { supabase } from '../../lib/supabase';
import { i18nCache, useI18nStore } from './store';

// PostgREST caps a single response at the project's max-rows limit
// (1000 by default). The translations table is bigger than that — pull
// in pages until we've drained everything newer than the local cursor.
const PAGE_SIZE = 1000;

export async function syncTranslations(locale: Locale): Promise<void> {
  let cursor = i18nCache.lastSyncedAt(locale);
  let bumped = false;

  while (true) {
    const { data, error } = await supabase
      .from('translations')
      .select('key,value,updated_at')
      .eq('locale', locale)
      .gt('updated_at', cursor)
      .order('updated_at', { ascending: true })
      .limit(PAGE_SIZE);

    if (error) {
      console.warn('[i18n sync] failed', error.message);
      return;
    }
    if (!data || data.length === 0) break;

    i18nCache.upsert(locale, data);
    bumped = true;
    cursor = data[data.length - 1]!.updated_at;
    if (data.length < PAGE_SIZE) break;
  }

  if (bumped) useI18nStore.getState().triggerRender();
}

export function subscribeTranslations(locale: Locale): () => void {
  const channel = supabase
    .channel(`translations:${locale}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'translations', filter: `locale=eq.${locale}` },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const row = payload.old as { key?: string };
          if (row?.key) {
            i18nCache.remove(locale, row.key);
            useI18nStore.getState().triggerRender();
          }
          return;
        }
        const row = payload.new as { key: string; value: string; updated_at: string };
        if (row?.key) {
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

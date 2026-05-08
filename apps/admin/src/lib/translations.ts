import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@kitup/shared-types';

export type Locale = 'tr' | 'en';

export type TDict = (key: string | null | undefined) => string;

const PAGE = 1000;

/**
 * Load every (key, value) pair for the given locale and return a
 * `t(key)` lookup that falls back to the raw key when missing. Used
 * by server components to render human-readable copy for `*_key`
 * columns (lesson titles, question stems, option labels, etc.).
 *
 * Paginates in 1000-row chunks to bypass Supabase's default
 * `db-max-rows` cap — without this, locales with > 1000 keys (and
 * the codex already has 1258 TR rows) get silently truncated and
 * those keys render as raw mono strings in the UI.
 */
export async function loadDict(
  supabase: SupabaseClient<Database>,
  locale: Locale = 'tr',
): Promise<TDict> {
  const map: Record<string, string> = {};
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('translations')
      .select('key, value')
      .eq('locale', locale)
      .range(from, from + PAGE - 1);
    if (error) break;
    const rows = data ?? [];
    for (const row of rows) map[row.key] = row.value;
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return (key) => {
    if (!key) return '';
    return map[key] ?? key;
  };
}

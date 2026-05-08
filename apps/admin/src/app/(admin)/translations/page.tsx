import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Row } from './Row';
import { Panel } from '@/components/dash/Panel';

const PAGE = 1000;

type TranslationRow = { key: string; locale: string; value: string };

/**
 * Pull every translations row in 1000-row chunks. The default Supabase
 * `db-max-rows` cap silently truncates `select('*')` so a single fetch
 * misses ~half of the codex (currently 2516 total rows across TR + EN).
 */
async function fetchAllTranslations(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
): Promise<TranslationRow[]> {
  const all: TranslationRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('translations')
      .select('key, locale, value')
      .order('key')
      .order('locale')
      .range(from, from + PAGE - 1);
    if (error) break;
    const rows = (data ?? []) as TranslationRow[];
    all.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export default async function TranslationsPage() {
  const supabase = await createServerSupabaseClient();
  const rows = await fetchAllTranslations(supabase);

  const byKey = new Map<string, { tr?: string; en?: string }>();
  for (const r of rows) {
    const cur = byKey.get(r.key) ?? {};
    cur[r.locale as 'tr' | 'en'] = r.value;
    byKey.set(r.key, cur);
  }
  const list = Array.from(byKey.entries()).map(([key, v]) => ({ key, ...v }));
  const missingTr = list.filter((r) => !r.tr).length;
  const missingEn = list.filter((r) => !r.en).length;

  return (
    <div className="reveal-stack space-y-6">
      <header data-reveal>
        <div className="flex items-baseline gap-3 mb-1">
          <span
            className="font-display text-accent text-base leading-none translate-y-[1px]"
            aria-hidden
          >
            ᚷ
          </span>
          <span className="font-display text-[10px] tracking-carved uppercase text-textLow">
            The gift of words
          </span>
        </div>
        <h1 className="font-display text-3xl tracking-tight text-textHigh">Translations</h1>
        <p className="mt-1 font-serif italic text-[13px] text-textMid">
          {list.length} {list.length === 1 ? 'key' : 'keys'}
          {missingTr > 0 || missingEn > 0
            ? ` · ${missingTr} missing TR · ${missingEn} missing EN`
            : ' · TR + EN complete'}
        </p>
      </header>

      <div data-reveal>
        <Panel
          rune="ᛞ"
          title="All keys"
          hint="Edits save on blur — Realtime pushes to mobile clients"
        >
          <div className="px-4 py-3 grid grid-cols-[2fr_3fr_3fr] gap-3 border-b border-border/70">
            <span className="font-display text-[10px] tracking-carved uppercase text-textLow">
              Key
            </span>
            <span className="font-display text-[10px] tracking-carved uppercase text-textLow">
              TR
            </span>
            <span className="font-display text-[10px] tracking-carved uppercase text-textLow">
              EN
            </span>
          </div>
          {list.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-serif italic text-textMid text-sm">No translations yet.</p>
            </div>
          ) : (
            <div className="px-4 py-2">
              {list.map((r) => (
                <Row key={r.key} k={r.key} tr={r.tr ?? ''} en={r.en ?? ''} />
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

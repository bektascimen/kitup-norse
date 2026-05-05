import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Row } from './Row';

export default async function TranslationsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: rows } = await supabase
    .from('translations').select('*').order('key, locale');

  // Group by key
  const byKey = new Map<string, { tr?: string; en?: string }>();
  for (const r of rows ?? []) {
    const cur = byKey.get(r.key) ?? {};
    cur[r.locale as 'tr' | 'en'] = r.value;
    byKey.set(r.key, cur);
  }
  const list = Array.from(byKey.entries()).map(([key, v]) => ({ key, ...v }));

  return (
    <div>
      <h2 className="text-xl font-display mb-4">Translations</h2>
      <div className="grid grid-cols-[2fr_3fr_3fr] gap-2 text-textMid text-sm border-b border-border pb-2">
        <span>Key</span><span>TR</span><span>EN</span>
      </div>
      {list.map((r) => (
        <Row key={r.key} k={r.key} tr={r.tr ?? ''} en={r.en ?? ''} />
      ))}
    </div>
  );
}

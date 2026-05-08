import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Row } from './Row';
import { upsertConfig } from './actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/dash/Panel';

export default async function AppConfigPage() {
  const supabase = await createServerSupabaseClient();
  const { data: rows } = await supabase.from('app_config').select('*').order('key');
  const list = rows ?? [];

  return (
    <div className="reveal-stack space-y-6">
      <header data-reveal>
        <div className="flex items-baseline gap-3 mb-1">
          <span
            className="font-display text-accent text-base leading-none translate-y-[1px]"
            aria-hidden
          >
            ᛏ
          </span>
          <span className="font-display text-[10px] tracking-carved uppercase text-textLow">
            Runes of order
          </span>
        </div>
        <h1 className="font-display text-3xl tracking-tight text-textHigh">App config</h1>
        <p className="mt-1 font-serif italic text-[13px] text-textMid max-w-2xl">
          Feature flags and JSON-shaped knobs read by the mobile and admin apps. Keys are global;
          values are JSON.
        </p>
      </header>

      <div data-reveal className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Panel
          rune="ᛞ"
          title="Existing keys"
          hint={`${list.length} ${list.length === 1 ? 'key' : 'keys'}`}
        >
          {list.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-serif italic text-textMid text-sm">
                No keys yet. Add the first below.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {list.map((r) => (
                <Row key={r.key} k={r.key} value={r.value} />
              ))}
            </div>
          )}
        </Panel>

        <Panel rune="ᚱ" title="New key" hint="Add or update a config entry">
          <form
            action={async (fd) => {
              'use server';
              await upsertConfig(fd);
            }}
            className="p-4 space-y-3"
          >
            <Input name="key" placeholder="feature.x.enabled" required />
            <textarea
              name="value_json"
              rows={4}
              placeholder="true"
              required
              className="w-full bg-bgDeep border border-border rounded-md px-3 py-2 font-mono text-[12px] text-textHigh focus:outline-none focus:border-accent/60 transition-colors"
            />
            <Button type="submit">Add key</Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}

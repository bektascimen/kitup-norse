import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Row } from './Row';
import { upsertConfig } from './actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function AppConfigPage() {
  const supabase = await createServerSupabaseClient();
  const { data: rows } = await supabase.from('app_config').select('*').order('key');

  return (
    <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
      <section className="space-y-3">
        <h2 className="text-xl font-display">App config</h2>
        {(rows ?? []).map((r) => (
          <Row key={r.key} k={r.key} value={r.value} />
        ))}
      </section>
      <section>
        <h2 className="text-xl font-display mb-3">New key</h2>
        <form action={async (fd) => { 'use server'; await upsertConfig(fd); }} className="space-y-2">
          <Input name="key" placeholder="feature.x.enabled" required />
          <textarea name="value_json" rows={4} placeholder="true" required className="w-full bg-bgElevated border border-border rounded-md p-2 font-mono text-xs" />
          <Button type="submit">Add</Button>
        </form>
      </section>
    </div>
  );
}

'use client';
import { useState, useTransition } from 'react';
import { upsertConfig, deleteConfig } from './actions';
import { Button } from '@/components/ui/button';

export function Row({ k, value }: { k: string; value: unknown }) {
  const [pending, start] = useTransition();
  const [json, setJson] = useState(JSON.stringify(value, null, 2));
  const [err, setErr] = useState<string | null>(null);

  function save() {
    setErr(null);
    const fd = new FormData();
    fd.set('key', k); fd.set('value_json', json);
    start(async () => {
      const r = await upsertConfig(fd);
      if (!r.ok) setErr(r.error ?? 'failed');
    });
  }

  return (
    <div className="p-3 bg-bgElevated rounded-md border border-border space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-mono text-sm">{k}</span>
        <form action={async () => { 'use server'; await deleteConfig(k); }}>
          <button className="text-danger text-xs">delete</button>
        </form>
      </div>
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={Math.min(8, json.split('\n').length + 1)}
        className="w-full bg-bg border border-border rounded-md p-2 font-mono text-xs"
      />
      <div className="flex gap-2">
        <Button onClick={save} disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
        {err && <span className="text-danger text-xs self-center">{err}</span>}
      </div>
    </div>
  );
}

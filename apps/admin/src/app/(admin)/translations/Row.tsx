'use client';
import { useState, useTransition } from 'react';
import { upsertTranslation } from './actions';
import { cn } from '@/lib/utils';

export function Row({ k, tr, en }: { k: string; tr: string; en: string }) {
  const [, start] = useTransition();
  const [trVal, setTrVal] = useState(tr);
  const [enVal, setEnVal] = useState(en);

  function save(locale: 'tr' | 'en', value: string) {
    if ((locale === 'tr' ? tr : en) === value) return;
    const fd = new FormData();
    fd.set('key', k); fd.set('locale', locale); fd.set('value', value);
    start(() => { upsertTranslation(fd); });
  }

  return (
    <div className="grid grid-cols-[2fr_3fr_3fr] gap-2 py-1.5 border-b border-border items-center">
      <span className="text-xs text-textMid font-mono truncate" title={k}>{k}</span>
      <input
        value={trVal}
        onChange={(e) => setTrVal(e.target.value)}
        onBlur={(e) => save('tr', e.target.value)}
        className={cn(
          'bg-bgElevated border rounded-md px-2 py-1 text-sm',
          trVal ? 'border-border' : 'border-danger',
        )}
      />
      <input
        value={enVal}
        onChange={(e) => setEnVal(e.target.value)}
        onBlur={(e) => save('en', e.target.value)}
        className={cn(
          'bg-bgElevated border rounded-md px-2 py-1 text-sm',
          enVal ? 'border-border' : 'border-danger',
        )}
      />
    </div>
  );
}

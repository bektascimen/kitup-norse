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
    fd.set('key', k);
    fd.set('locale', locale);
    fd.set('value', value);
    start(() => {
      upsertTranslation(fd);
    });
  }

  return (
    <div className="grid grid-cols-[2fr_3fr_3fr] gap-3 py-1.5 border-b border-border/40 last:border-b-0 items-center">
      <span className="font-mono text-[11px] text-textLow truncate" title={k}>
        {k}
      </span>
      <input
        value={trVal}
        onChange={(e) => setTrVal(e.target.value)}
        onBlur={(e) => save('tr', e.target.value)}
        className={cn(
          'bg-bgDeep/60 border rounded-md px-2 py-1.5 text-[13px] text-textHigh placeholder-textLow focus:outline-none focus:border-accent/60 transition-colors',
          trVal ? 'border-border' : 'border-danger/60',
        )}
      />
      <input
        value={enVal}
        onChange={(e) => setEnVal(e.target.value)}
        onBlur={(e) => save('en', e.target.value)}
        className={cn(
          'bg-bgDeep/60 border rounded-md px-2 py-1.5 text-[13px] text-textHigh placeholder-textLow focus:outline-none focus:border-accent/60 transition-colors',
          enVal ? 'border-border' : 'border-danger/60',
        )}
      />
    </div>
  );
}

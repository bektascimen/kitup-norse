'use client';
import { useState, useTransition } from 'react';
import { upsertConfig, deleteConfig } from './actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Row({ k, value }: { k: string; value: unknown }) {
  return typeof value === 'boolean' ? (
    <BooleanRow k={k} initial={value} />
  ) : (
    <JsonRow k={k} value={value} />
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Derive a human-readable label from a dotted config key.
 *
 * Examples:
 *   `feature.ai_generation.enabled`   → "AI generation"
 *   `feature.spaced_repetition.enabled` → "Spaced repetition"
 *   `ai.gemini.model`                 → "Gemini · model"
 *   `content.daily_reminder.default_time` → "Daily reminder · default time"
 *
 * Strategy: drop the leading namespace (`feature` / `content` / `ai`),
 * drop the trailing `enabled` boolean suffix, then turn underscores
 * into spaces and join the remaining segments with " · ". Sentence-
 * cases the very first letter so it reads as a phrase, not a slug.
 */
function humanize(key: string): string {
  const NAMESPACES = new Set(['feature', 'content', 'ai', 'app', 'ui']);
  const SUFFIXES = new Set(['enabled', 'disabled']);
  const parts = key.split('.');
  let segs = parts.length > 1 && NAMESPACES.has(parts[0]!) ? parts.slice(1) : parts.slice();
  if (segs.length > 1 && SUFFIXES.has(segs[segs.length - 1]!)) {
    segs = segs.slice(0, -1);
  }
  const friendly = segs
    .map((s) => s.replace(/_/g, ' '))
    .join(' · ')
    .toLowerCase();
  return friendly.charAt(0).toUpperCase() + friendly.slice(1);
}

function DeleteButton({ k }: { k: string }) {
  const [deleting, startDelete] = useTransition();
  function remove() {
    if (!confirm(`Delete "${k}"?`)) return;
    startDelete(() => {
      deleteConfig(k);
    });
  }
  return (
    <button
      type="button"
      onClick={remove}
      disabled={deleting}
      className="font-display text-[10px] tracking-rune uppercase text-danger/80 hover:text-danger disabled:opacity-50 transition-colors"
    >
      {deleting ? 'Deleting…' : 'Delete'}
    </button>
  );
}

function KeyHeader({ k }: { k: string }) {
  return (
    <div className="min-w-0">
      <p className="font-display text-[14px] tracking-tight text-textHigh truncate">
        {humanize(k)}
      </p>
      <p className="font-mono text-[10px] text-textLow truncate" title={k}>
        {k}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function BooleanRow({ k, initial }: { k: string; initial: boolean }) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function toggle() {
    const next = !value;
    setValue(next); // optimistic
    setErr(null);
    const fd = new FormData();
    fd.set('key', k);
    fd.set('value_json', JSON.stringify(next));
    start(async () => {
      const r = await upsertConfig(fd);
      if (!r.ok) {
        setValue(!next); // rollback
        setErr(r.error ?? 'failed');
      }
    });
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border bg-bgElevated/40 hover:border-borderStrong transition-colors">
      <div className="flex-1 min-w-0">
        <KeyHeader k={k} />
        {err && <p className="font-mono text-[11px] text-danger mt-1 truncate">{err}</p>}
      </div>
      <span
        aria-hidden
        className={cn(
          'font-display text-[10px] tracking-carved uppercase',
          value ? 'text-accent' : 'text-textLow',
          pending && 'opacity-60',
        )}
      >
        {value ? 'On' : 'Off'}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={`Toggle ${k}`}
        onClick={toggle}
        disabled={pending}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
          value
            ? 'bg-accent shadow-[0_0_0_1px_rgba(201,169,110,0.6),0_0_18px_-4px_rgba(201,169,110,0.5)]'
            : 'bg-bgDeep border border-border',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 rounded-full transition-transform duration-200 shadow-card-rest',
            value ? 'translate-x-[22px] bg-bg' : 'translate-x-1 bg-textMid',
          )}
        />
      </button>
      <DeleteButton k={k} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function JsonRow({ k, value }: { k: string; value: unknown }) {
  const [pending, start] = useTransition();
  const [json, setJson] = useState(JSON.stringify(value, null, 2));
  const [err, setErr] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function save() {
    setErr(null);
    const fd = new FormData();
    fd.set('key', k);
    fd.set('value_json', json);
    start(async () => {
      const r = await upsertConfig(fd);
      if (!r.ok) setErr(r.error ?? 'failed');
      else setSavedAt(Date.now());
    });
  }

  return (
    <div className="rounded-lg border border-border bg-bgElevated/40 p-4 space-y-3 hover:border-borderStrong transition-colors">
      <div className="flex items-start justify-between gap-3">
        <KeyHeader k={k} />
        <DeleteButton k={k} />
      </div>
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={Math.min(8, json.split('\n').length + 1)}
        className="w-full bg-bgDeep border border-border rounded-md px-3 py-2 font-mono text-[12px] text-textHigh focus:outline-none focus:border-accent/60 transition-colors resize-y"
      />
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending} size="sm">
          {pending ? 'Saving…' : 'Save'}
        </Button>
        {err && <span className="font-mono text-[11px] text-danger">{err}</span>}
        {!err && savedAt && (
          <span className="font-display text-[10px] tracking-rune uppercase text-moss/80">
            Saved
          </span>
        )}
      </div>
    </div>
  );
}

import Link from 'next/link';
import { cn } from '@/lib/utils';

type Props = {
  rune: string;
  label: string;
  value: string | number | null | undefined;
  hint?: string;
  href?: string;
  /** Visual emphasis — `forge` wraps the number in gold, default is parchment. */
  tone?: 'default' | 'forge';
};

export function StatCard({ rune, label, value, hint, href, tone = 'default' }: Props) {
  const display = value === null || value === undefined ? '—' : String(value);
  const inner = (
    <div
      className={cn(
        'group relative h-full rounded-lg border border-border bg-bgElevated/40 px-5 py-5',
        'transition-all duration-200 hover:border-accent/50 hover:bg-bgElevated/70 hover:shadow-card-rest',
        href && 'cursor-pointer',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="font-display text-2xl text-accent leading-none transition-transform duration-200 group-hover:-translate-y-0.5"
          aria-hidden
        >
          {rune}
        </span>
        <span className="font-display text-[10px] tracking-carved uppercase text-textLow">
          {label}
        </span>
      </div>
      <div
        className={cn(
          'font-mono tabular-nums leading-none',
          tone === 'forge' ? 'text-accent' : 'text-textHigh',
          'text-[34px] tracking-tight',
        )}
      >
        {display}
      </div>
      {hint && (
        <p className="mt-2 font-serif italic text-[12px] text-textMid leading-snug">{hint}</p>
      )}
      {href && (
        <span className="absolute bottom-4 right-5 font-display text-textLow text-sm transition-colors group-hover:text-accent">
          ›
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {inner}
      </Link>
    );
  }
  return inner;
}

import { cn } from '@/lib/utils';

type Props = {
  rune?: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Panel({ rune, title, hint, action, children, className }: Props) {
  return (
    <section
      className={cn(
        'rounded-lg border border-border bg-bgElevated/40 backdrop-blur-[1px] overflow-hidden',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex items-baseline gap-3 min-w-0">
          {rune && (
            <span
              className="font-display text-xl text-accent leading-none translate-y-[2px]"
              aria-hidden
            >
              {rune}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="font-display text-base text-textHigh tracking-tight truncate">
              {title}
            </h3>
            {hint && (
              <p className="font-serif italic text-[11px] text-textMid mt-0.5 leading-snug">
                {hint}
              </p>
            )}
          </div>
        </div>
        {action}
      </header>
      <div className="border-t border-border/60">{children}</div>
    </section>
  );
}

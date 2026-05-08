import { cn } from '@/lib/utils';

export type JobStatus = 'pending' | 'running' | 'done' | 'failed' | string;

const TONE: Record<string, { dot: string; text: string; ring: string; pulse?: boolean }> = {
  pending: {
    dot: 'bg-textLow',
    text: 'text-textMid',
    ring: 'border-border',
  },
  running: {
    dot: 'bg-accent',
    text: 'text-accent',
    ring: 'border-accent/40',
    pulse: true,
  },
  done: {
    dot: 'bg-moss',
    text: 'text-moss',
    ring: 'border-moss/40',
  },
  failed: {
    dot: 'bg-danger',
    text: 'text-danger',
    ring: 'border-danger/40',
  },
};

export function StatusPill({ status }: { status: JobStatus }) {
  const tone = TONE[status] ?? TONE['pending']!;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-bg/50',
        tone.ring,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'inline-block w-1.5 h-1.5 rounded-full',
          tone.dot,
          tone.pulse && 'animate-pulse-rune',
        )}
      />
      <span
        className={cn('font-display text-[9px] tracking-carved uppercase leading-none', tone.text)}
      >
        {status}
      </span>
    </span>
  );
}

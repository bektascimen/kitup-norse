import { signOutAction } from '@/lib/auth/signOutAction';

type Props = {
  email: string | null;
};

function initialsOf(email: string | null): string {
  if (!email) return '·';
  const [local] = email.split('@');
  const parts = (local ?? '').split(/[._-]/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function TopBar({ email }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="flex items-center justify-between px-6 lg:px-10 h-14">
        <div className="flex items-center gap-3">
          <span className="font-display text-[10px] tracking-carved text-textLow uppercase">
            {todayLabel()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-border bg-bgElevated/40">
            <span className="grid place-items-center w-6 h-6 rounded-full bg-accent text-bg font-display text-[10px] tracking-tight">
              {initialsOf(email)}
            </span>
            <span className="font-mono text-[11px] text-textMid truncate max-w-[180px]">
              {email ?? 'anonymous'}
            </span>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="font-display text-[10px] tracking-rune uppercase text-textMid hover:text-accent transition-colors px-2 py-1.5"
            >
              Sign out ›
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

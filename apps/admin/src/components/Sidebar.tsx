'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  rune: string;
  label: string;
  /** Match exactly (true) instead of by `startsWith` (default). */
  exact?: boolean;
};

const NAV: readonly NavItem[] = [
  { href: '/', rune: 'ᛟ', label: 'Overview', exact: true },
  { href: '/courses', rune: 'ᛞ', label: 'Courses' },
  { href: '/lessons', rune: 'ᛒ', label: 'Lessons' },
  { href: '/quizzes', rune: 'ᛗ', label: 'Quizzes' },
  { href: '/translations', rune: 'ᚷ', label: 'Translations' },
  { href: '/app-config', rune: 'ᛏ', label: 'App Config' },
  { href: '/generate', rune: 'ᚱ', label: 'Generate' },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + '/');
}

export function Sidebar() {
  const path = usePathname() ?? '/';
  return (
    <aside className="hidden md:flex md:w-[232px] lg:w-[244px] shrink-0 flex-col border-r border-border bg-bgDeep/60 backdrop-blur-sm">
      <div className="px-6 pt-7 pb-5">
        <Link href="/" className="group inline-flex items-baseline gap-2.5">
          <span className="font-display text-3xl text-accent leading-none translate-y-[1px] group-hover:animate-pulse-rune">
            ᛟ
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[15px] text-textHigh tracking-tight">kitUP</span>
            <span className="font-display text-[9px] text-textLow tracking-carved uppercase mt-1">
              Skald · Codex
            </span>
          </span>
        </Link>
      </div>

      <div className="px-6">
        <div className="rune-rule mb-2">
          <span>ᛞ</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map((item) => {
          const active = isActive(path, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
                'hover:bg-accentSoft/60',
                active ? 'bg-accentSoft text-textHigh' : 'text-textMid hover:text-textHigh',
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-r bg-accent shadow-[0_0_8px_rgba(201,169,110,0.6)]"
                />
              )}
              <span
                className={cn(
                  'font-display text-lg w-5 text-center leading-none',
                  active ? 'text-accent' : 'text-textLow group-hover:text-accent',
                )}
              >
                {item.rune}
              </span>
              <span
                className={cn(
                  'font-display tracking-rune text-[12px] uppercase',
                  active ? 'text-textHigh' : '',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 pb-6">
        <div className="rune-rule mb-4">
          <span>ᛒ</span>
        </div>
        <p className="font-serif italic text-[11px] text-textLow leading-snug">
          “The well of Mimir keeps no secrets from those who tend it.”
        </p>
      </div>
    </aside>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const items = [
  { href: '/courses', label: 'Courses' },
  { href: '/lessons', label: 'Lessons' },
  { href: '/quizzes', label: 'Quizzes' },
  { href: '/translations', label: 'Translations' },
  { href: '/app-config', label: 'App Config' },
  { href: '/generate', label: 'Generate' },
];

export function AppNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-2 border-b border-border px-6 py-3">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm hover:bg-bgElevated',
            path?.startsWith(i.href) && 'bg-bgElevated text-accent'
          )}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

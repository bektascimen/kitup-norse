import { requireAdmin } from '@/lib/auth/requireAdmin';
import { AppNav } from '@/components/AppNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="px-6 py-4 border-b border-border">
        <h1 className="font-display text-2xl">kitUP Admin</h1>
      </header>
      <AppNav />
      <main className="p-6">{children}</main>
    </div>
  );
}

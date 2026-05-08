import { requireAdmin } from '@/lib/auth/requireAdmin';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar email={user.email ?? null} />
        <main className="flex-1 px-6 lg:px-10 py-8 w-full max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}

// =====================================================
// Admin Layout Component
// Wrapper for all admin pages with header and sidebar
// =====================================================

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { SessionUser } from '@/types/database';

interface AdminLayoutProps {
  children: React.ReactNode;
  user: SessionUser | null;
}

export function AdminLayout({ children, user }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 border-r lg:block">
          <Sidebar />
        </aside>
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

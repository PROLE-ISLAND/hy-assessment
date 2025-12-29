'use client';

// =====================================================
// Sidebar Component
// Navigation sidebar for admin pages
// =====================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  UserCheck,
  Settings,
  BarChart3,
  MessageSquareCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  onNavigate?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: (NavItem & { testId: string })[] = [
  {
    href: '/admin',
    label: 'ダッシュボード',
    icon: LayoutDashboard,
    testId: 'nav-dashboard',
  },
  {
    href: '/admin/candidates',
    label: '候補者',
    icon: Users,
    testId: 'nav-candidates',
  },
  {
    href: '/admin/compare',
    label: '比較',
    icon: UserCheck,
    testId: 'nav-compare',
  },
  {
    href: '/admin/reports',
    label: 'レポート',
    icon: BarChart3,
    testId: 'nav-reports',
  },
];

const settingsNavItems: (NavItem & { testId: string })[] = [
  {
    href: '/admin/templates',
    label: 'テンプレート',
    icon: FileText,
    testId: 'nav-templates',
  },
  {
    href: '/admin/prompts',
    label: 'プロンプト',
    icon: MessageSquareCode,
    testId: 'nav-prompts',
  },
];

const bottomNavItems: (NavItem & { testId: string })[] = [
  {
    href: '/settings',
    label: '設定',
    icon: Settings,
    testId: 'nav-settings',
  },
];

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const NavLink = ({ item }: { item: NavItem & { testId: string } }) => (
    <Link
      href={item.href}
      onClick={onNavigate}
      data-testid={item.testId}
      aria-current={isActive(item.href) ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive(item.href)
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Link>
  );

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Logo Section (mobile only) */}
      <div className="flex h-14 items-center border-b px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">HY</span>
          <span className="text-muted-foreground">Assessment</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {mainNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Settings Navigation */}
      <div className="px-4 pb-2">
        <Separator className="mb-4" />
        <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          設定
        </p>
        <div className="mt-1 space-y-1">
          {settingsNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

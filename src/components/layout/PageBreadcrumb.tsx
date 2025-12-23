'use client';

// =====================================================
// Page Breadcrumb Component
// Dynamic breadcrumb navigation based on current route
// =====================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Fragment } from 'react';

interface BreadcrumbConfig {
  label: string;
  href?: string;
}

// Route to breadcrumb mapping
const routeConfig: Record<string, BreadcrumbConfig> = {
  '/admin': { label: 'ダッシュボード' },
  '/admin/candidates': { label: '候補者', href: '/admin/candidates' },
  '/admin/candidates/new': { label: '新規登録' },
  '/admin/assessments': { label: '検査結果', href: '/admin/assessments' },
  '/admin/compare': { label: '比較' },
  '/admin/reports': { label: 'レポート' },
  '/admin/templates': { label: 'テンプレート', href: '/admin/templates' },
};

interface PageBreadcrumbProps {
  items?: { label: string; href?: string }[];
  currentPage?: string;
}

export function PageBreadcrumb({ items, currentPage }: PageBreadcrumbProps) {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname if not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(pathname);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {/* Home */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/admin" className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Dynamic items */}
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1 && !currentPage;

          return (
            <Fragment key={item.label}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-3.5 w-3.5" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}

        {/* Current page (if provided separately) */}
        {currentPage && (
          <>
            <BreadcrumbSeparator>
              <ChevronRight className="h-3.5 w-3.5" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPage}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function generateBreadcrumbsFromPath(pathname: string): { label: string; href?: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; href?: string }[] = [];

  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip the first segment if it's 'admin' and we're at the dashboard
    if (segment === 'admin' && i === 0) {
      continue;
    }

    // Check if we have a config for this path
    const config = routeConfig[currentPath];
    if (config) {
      breadcrumbs.push({
        label: config.label,
        href: config.href,
      });
    } else {
      // For dynamic segments (IDs), skip them - they'll be handled by currentPage prop
      if (isUUID(segment)) {
        continue;
      }
    }
  }

  return breadcrumbs;
}

function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

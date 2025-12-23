// =====================================================
// Version Badge Component
// Displays analysis version with optional "latest" indicator
// =====================================================

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VersionBadgeProps {
  version: number;
  isLatest?: boolean;
  className?: string;
}

export function VersionBadge({
  version,
  isLatest = false,
  className,
}: VersionBadgeProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Badge variant="outline" className="font-mono text-xs">
        v{version}
      </Badge>
      {isLatest && (
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 text-xs">
          最新
        </Badge>
      )}
    </div>
  );
}

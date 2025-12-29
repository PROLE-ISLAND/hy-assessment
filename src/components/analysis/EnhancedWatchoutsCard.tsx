'use client';

// =====================================================
// Enhanced Watchouts Card Component
// Displays watchouts with evidence (v2 format)
// =====================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { stateColors } from '@/lib/design-system';
import type { EnhancedWatchout } from '@/types/database';

interface EnhancedWatchoutsCardProps {
  watchouts: EnhancedWatchout[];
}

export function EnhancedWatchoutsCard({ watchouts }: EnhancedWatchoutsCardProps) {
  if (!watchouts || watchouts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${stateColors.warning.light.text} ${stateColors.warning.dark.text}`} />
          注意点
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {watchouts.map((watchout, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-2">
              <div className={`font-semibold ${stateColors.warning.light.text} ${stateColors.warning.dark.text}`}>
                {watchout.title}
              </div>
              <p className="text-sm">
                {watchout.risk}
              </p>
              <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 inline-block">
                根拠: {watchout.evidence}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

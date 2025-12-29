'use client';

// =====================================================
// Enhanced Strengths Card Component
// Displays strengths with evidence (v2 format)
// =====================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { stateColors } from '@/lib/design-system';
import type { EnhancedStrength } from '@/types/database';

interface EnhancedStrengthsCardProps {
  strengths: EnhancedStrength[];
}

export function EnhancedStrengthsCard({ strengths }: EnhancedStrengthsCardProps) {
  if (!strengths || strengths.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className={`h-5 w-5 ${stateColors.success.light.text} ${stateColors.success.dark.text}`} />
          強み
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {strengths.map((strength, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-2">
              <div className={`font-semibold ${stateColors.success.light.text} ${stateColors.success.dark.text}`}>
                {strength.title}
              </div>
              <p className="text-sm">
                {strength.behavior}
              </p>
              <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 inline-block">
                根拠: {strength.evidence}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

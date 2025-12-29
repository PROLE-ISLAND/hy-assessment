'use client';

// =====================================================
// Interview Checks Card Component
// Displays AI-generated interview questions with intent
// =====================================================

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Target, Eye } from 'lucide-react';
import { stateColors } from '@/lib/design-system';
import type { InterviewCheck } from '@/types/database';

interface InterviewChecksCardProps {
  checks: InterviewCheck[];
}

export function InterviewChecksCard({ checks }: InterviewChecksCardProps) {
  if (!checks || checks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className={`h-5 w-5 ${stateColors.info.light.text} ${stateColors.info.dark.text}`} />
          面接確認項目
        </CardTitle>
        <CardDescription>
          Gate判定に直結する確認ポイントと質問例
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checks.map((check, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              {/* Question */}
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="flex-shrink-0 mt-0.5">
                  Q{index + 1}
                </Badge>
                <p className="text-sm font-medium leading-relaxed">
                  「{check.question}」
                </p>
              </div>

              {/* Intent & Look For */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-10">
                <div className={`flex items-start gap-2 rounded-lg p-3 ${stateColors.info.light.bg} ${stateColors.info.dark.bg}`}>
                  <Target className={`h-4 w-4 flex-shrink-0 mt-0.5 ${stateColors.info.light.text} ${stateColors.info.dark.text}`} />
                  <div>
                    <div className={`text-xs font-medium mb-1 ${stateColors.info.light.text} ${stateColors.info.dark.text}`}>確認意図</div>
                    <p className={`text-sm ${stateColors.info.light.text} ${stateColors.info.dark.text}`}>{check.intent}</p>
                  </div>
                </div>
                <div className={`flex items-start gap-2 rounded-lg p-3 ${stateColors.accent.light.bg} ${stateColors.accent.dark.bg}`}>
                  <Eye className={`h-4 w-4 flex-shrink-0 mt-0.5 ${stateColors.accent.light.text} ${stateColors.accent.dark.text}`} />
                  <div>
                    <div className={`text-xs font-medium mb-1 ${stateColors.accent.light.text} ${stateColors.accent.dark.text}`}>回答で見るべきポイント</div>
                    <p className={`text-sm ${stateColors.accent.light.text} ${stateColors.accent.dark.text}`}>{check.look_for}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

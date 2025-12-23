// =====================================================
// Interview Points Component
// Shows strengths and areas to confirm in interview
// =====================================================

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, HelpCircle, MessageSquare } from 'lucide-react';
import type { InterviewPoint } from '@/lib/analysis/judgment';

interface InterviewPointsProps {
  points: InterviewPoint[];
}

export function InterviewPoints({ points }: InterviewPointsProps) {
  const strengths = points.filter(p => p.type === 'strength');
  const confirms = points.filter(p => p.type === 'confirm');

  if (points.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          面接確認ポイント
        </CardTitle>
        <CardDescription>
          検査結果に基づく面接時の確認事項
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strengths */}
        {strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 mb-3">
              <CheckCircle className="h-4 w-4" />
              強み
            </div>
            <div className="space-y-2">
              {strengths.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-green-50 rounded-lg"
                >
                  <Badge variant="outline" className="mt-0.5 text-xs shrink-0">
                    {point.domainLabel}
                  </Badge>
                  <p className="text-sm text-green-800">{point.point}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirm Points */}
        {confirms.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-orange-600 mb-3">
              <HelpCircle className="h-4 w-4" />
              確認すべき点
            </div>
            <div className="space-y-3">
              {confirms.map((point, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-orange-50 rounded-lg space-y-2"
                >
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 text-xs shrink-0 border-orange-200">
                      {point.domainLabel}
                    </Badge>
                    <p className="text-sm text-orange-800">{point.point}</p>
                  </div>
                  {point.suggestedQuestion && (
                    <div className="ml-[60px] text-sm text-muted-foreground">
                      <span className="font-medium">質問例:</span> {point.suggestedQuestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

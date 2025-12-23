'use client';

// =====================================================
// Action Required Section
// Shows expiring assessments and pending analyses
// =====================================================

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { stateColors } from '@/lib/design-system';

interface ExpiringItem {
  assessmentId: string;
  candidateId: string;
  candidateName: string;
  daysRemaining: number;
}

interface NeedsAnalysisItem {
  assessmentId: string;
  candidateId: string;
  candidateName: string;
  completedAt: string;
}

interface ActionRequiredSectionProps {
  expiringItems: ExpiringItem[];
  needsAnalysisItems: NeedsAnalysisItem[];
}

export function ActionRequiredSection({
  expiringItems,
  needsAnalysisItems,
}: ActionRequiredSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());

  const totalCount = expiringItems.length + needsAnalysisItems.length;

  if (totalCount === 0) {
    return null;
  }

  const handleRunAnalysis = async (assessmentId: string) => {
    setAnalyzingIds(prev => new Set(prev).add(assessmentId));

    try {
      const response = await fetch(`/api/analysis/${assessmentId}`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh the page to update the list
        window.location.reload();
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(assessmentId);
        return next;
      });
    }
  };

  const formatCompletedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} 完了`;
  };

  return (
    <Card className={`${stateColors.warning.light.border} ${stateColors.warning.light.bg}/50`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 ${stateColors.warning.light.text}`}>
            <AlertTriangle className="h-5 w-5" />
            アクション必要
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {totalCount}件
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/30"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Expiring Soon */}
          {expiringItems.length > 0 && (
            <div>
              <div className={`flex items-center gap-2 text-sm font-medium mb-2 ${stateColors.warning.light.text}`}>
                <Clock className="h-4 w-4" />
                期限切れ間近 ({expiringItems.length}件)
              </div>
              <div className="space-y-2">
                {expiringItems.map((item) => (
                  <div
                    key={item.assessmentId}
                    className={`flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border ${stateColors.warning.light.border}`}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">{item.candidateName}</div>
                        <div className="text-sm text-muted-foreground">
                          残り{item.daysRemaining}日
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/candidates/${item.candidateId}`}>
                          詳細
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Needs Analysis */}
          {needsAnalysisItems.length > 0 && (
            <div>
              <div className={`flex items-center gap-2 text-sm font-medium mb-2 ${stateColors.info.light.text}`}>
                <BarChart3 className="h-4 w-4" />
                分析待ち ({needsAnalysisItems.length}件)
              </div>
              <div className="space-y-2">
                {needsAnalysisItems.map((item) => (
                  <div
                    key={item.assessmentId}
                    className={`flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border ${stateColors.info.light.border}`}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">{item.candidateName}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCompletedDate(item.completedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/assessments/${item.assessmentId}`}>
                          詳細
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRunAnalysis(item.assessmentId)}
                        disabled={analyzingIds.has(item.assessmentId)}
                      >
                        {analyzingIds.has(item.assessmentId) ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            分析中...
                          </>
                        ) : (
                          '分析実行'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

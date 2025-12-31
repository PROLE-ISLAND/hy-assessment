'use client';

/**
 * BehavioralAnalysisCard
 *
 * Generated with v0: https://v0.app/chat/cW3dnjrv7uN
 * Issue: #148
 *
 * Variants:
 * - Default: DISC理論ベースの行動特性表示
 * - Loading: スケルトンUI
 * - Empty: データなし状態
 * - Error: エラー + 再試行
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import {
  PersonalityCardSkeleton,
  PersonalityCardError,
  PersonalityCardEmpty,
  ProgressBar,
} from './shared';
import {
  type BehavioralAnalysisData,
  type PersonalityCardProps,
  getScoreColorClass,
  getScoreBadgeClass,
  getProgressColorClass,
} from './types';

type BehavioralAnalysisCardProps = PersonalityCardProps<BehavioralAnalysisData>;

/**
 * 行動特性分析カード
 * DISC理論に基づく行動スタイル診断結果を表示
 */
export function BehavioralAnalysisCard({
  data,
  isLoading,
  error,
  onRetry,
}: BehavioralAnalysisCardProps) {
  // Loading状態
  if (isLoading) {
    return <PersonalityCardSkeleton data-testid="behavioral-analysis-card-skeleton" />;
  }

  // Error状態
  if (error) {
    return (
      <PersonalityCardError
        error={error}
        onRetry={onRetry}
        data-testid="behavioral-analysis-card-error"
      />
    );
  }

  // Empty状態
  if (!data) {
    return (
      <PersonalityCardEmpty
        title="行動特性分析"
        message="行動特性データがありません"
        data-testid="behavioral-analysis-card-empty"
      />
    );
  }

  // Default状態
  const discMetrics = [
    { name: '主導性 (D)', score: data.dominance, description: '目標達成への推進力' },
    { name: '影響性 (I)', score: data.influence, description: '他者への働きかけ' },
    { name: '安定性 (S)', score: data.steadiness, description: '一貫性と協調性' },
    { name: '慎重性 (C)', score: data.conscientiousness, description: '正確性と品質へのこだわり' },
  ];

  return (
    <Card data-testid="behavioral-analysis-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          行動特性分析
          {data.overallType && (
            <Badge variant="secondary" className="ml-auto">
              {data.overallType}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* DISCメトリクス */}
        <div className="space-y-3">
          {discMetrics.map((metric) => (
            <div key={metric.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{metric.name}</span>
                <span className={`text-sm font-bold ${getScoreColorClass(metric.score)}`}>
                  {metric.score}%
                </span>
              </div>
              <ProgressBar value={metric.score} colorClass={getProgressColorClass(metric.score)} />
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </div>
          ))}
        </div>

        {/* 特性リスト */}
        {data.traits && data.traits.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">主な特性</h4>
            <div className="flex flex-wrap gap-2">
              {data.traits.map((trait, index) => (
                <Badge
                  key={index}
                  className={getScoreBadgeClass(trait.score)}
                >
                  {trait.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

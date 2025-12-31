'use client';

/**
 * StressResilienceCard
 *
 * Generated with v0: https://v0.app/chat/puNofuGgfSU
 * Issue: #148
 *
 * Variants:
 * - Default: ストレス耐性スコア表示
 * - Loading: スケルトンUI
 * - Empty: データなし状態
 * - Error: エラー + 再試行
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import {
  PersonalityCardSkeleton,
  PersonalityCardError,
  PersonalityCardEmpty,
  ProgressBar,
} from './shared';
import {
  type StressResilienceData,
  type PersonalityCardProps,
  getScoreColorClass,
  getProgressColorClass,
} from './types';

type StressResilienceCardProps = PersonalityCardProps<StressResilienceData>;

/**
 * リスクレベルに応じたバッジスタイル
 */
function getRiskLevelBadge(level: 'low' | 'medium' | 'high') {
  switch (level) {
    case 'low':
      return {
        label: '低リスク',
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      };
    case 'medium':
      return {
        label: '中リスク',
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      };
    case 'high':
      return {
        label: '高リスク',
        className: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
      };
  }
}

/**
 * ストレス耐性分析カード
 * ストレス反応パターン・回復力評価を表示
 */
export function StressResilienceCard({
  data,
  isLoading,
  error,
  onRetry,
}: StressResilienceCardProps) {
  // Loading状態
  if (isLoading) {
    return <PersonalityCardSkeleton data-testid="stress-resilience-card-skeleton" />;
  }

  // Error状態
  if (error) {
    return (
      <PersonalityCardError
        error={error}
        onRetry={onRetry}
        data-testid="stress-resilience-card-error"
      />
    );
  }

  // Empty状態
  if (!data) {
    return (
      <PersonalityCardEmpty
        title="ストレス耐性分析"
        message="ストレス耐性データがありません"
        data-testid="stress-resilience-card-empty"
      />
    );
  }

  // Default状態
  const stressMetrics = [
    { name: 'プレッシャー対応', score: data.pressureHandling, description: '高負荷環境での対処力' },
    { name: '回復力', score: data.recoverySpeed, description: 'ストレスからの回復速度' },
    { name: '感情安定性', score: data.emotionalStability, description: '感情のコントロール力' },
    { name: '適応力', score: data.adaptability, description: '変化への対応力' },
  ];

  const riskBadge = getRiskLevelBadge(data.riskLevel);

  return (
    <Card data-testid="stress-resilience-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-purple-500" />
          ストレス耐性分析
          <Badge className={`ml-auto ${riskBadge.className}`}>
            {riskBadge.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 総合スコア */}
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">総合ストレス耐性スコア</p>
          <p className={`text-3xl font-bold ${getScoreColorClass(data.overallScore)}`}>
            {data.overallScore}
            <span className="text-lg font-normal text-muted-foreground">/100</span>
          </p>
        </div>

        {/* 詳細メトリクス */}
        <div className="space-y-3">
          {stressMetrics.map((metric) => (
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

        {/* 追加メトリクス */}
        {data.metrics && data.metrics.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">詳細指標</h4>
            <div className="grid grid-cols-2 gap-2">
              {data.metrics.map((metric, index) => (
                <div
                  key={index}
                  className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-center"
                >
                  <p className="text-xs text-muted-foreground">{metric.name}</p>
                  <p className={`text-lg font-bold ${getScoreColorClass(metric.score)}`}>
                    {metric.score}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

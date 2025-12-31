'use client';

/**
 * ValuesAnalysisCard
 *
 * Generated with v0: https://v0.app/chat/cqizeGEs0r1
 * Issue: #148
 *
 * Variants:
 * - Default: 価値観プロファイル表示
 * - Loading: スケルトンUI
 * - Empty: データなし状態
 * - Error: エラー + 再試行
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Compass } from 'lucide-react';
import {
  PersonalityCardSkeleton,
  PersonalityCardError,
  PersonalityCardEmpty,
  ProgressBar,
} from './shared';
import {
  type ValuesAnalysisData,
  type PersonalityCardProps,
  getScoreColorClass,
  getScoreBadgeClass,
  getProgressColorClass,
} from './types';

type ValuesAnalysisCardProps = PersonalityCardProps<ValuesAnalysisData>;

/**
 * 価値観分析カード
 * 仕事価値観・組織文化適合度を評価
 */
export function ValuesAnalysisCard({
  data,
  isLoading,
  error,
  onRetry,
}: ValuesAnalysisCardProps) {
  // Loading状態
  if (isLoading) {
    return <PersonalityCardSkeleton data-testid="values-analysis-card-skeleton" />;
  }

  // Error状態
  if (error) {
    return (
      <PersonalityCardError
        error={error}
        onRetry={onRetry}
        data-testid="values-analysis-card-error"
      />
    );
  }

  // Empty状態
  if (!data) {
    return (
      <PersonalityCardEmpty
        title="価値観分析"
        message="価値観データがありません"
        data-testid="values-analysis-card-empty"
      />
    );
  }

  // Default状態
  const valueDimensions = [
    { name: '達成志向', score: data.achievement, description: '目標達成・成果への意欲', icon: '🎯' },
    { name: '安定志向', score: data.stability, description: '安定した環境・予測可能性', icon: '🏠' },
    { name: '成長志向', score: data.growth, description: '学習・自己成長への意欲', icon: '🌱' },
    { name: '社会貢献志向', score: data.socialContribution, description: '社会・他者への貢献意識', icon: '🤝' },
    { name: '自律志向', score: data.autonomy, description: '自主性・独立性への欲求', icon: '🦅' },
  ];

  // 最高スコアの価値観を特定
  const topValue = valueDimensions.reduce((prev, current) =>
    current.score > prev.score ? current : prev
  );

  return (
    <Card data-testid="values-analysis-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-indigo-500" />
          価値観分析
          {data.primaryValue && (
            <Badge variant="secondary" className="ml-auto">
              {data.primaryValue}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 主要価値観ハイライト */}
        <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">最も強い価値観</p>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {topValue.icon} {topValue.name}
          </p>
          <p className={`text-2xl font-bold ${getScoreColorClass(topValue.score)}`}>
            {topValue.score}%
          </p>
        </div>

        {/* 全価値観スコア */}
        <div className="space-y-3">
          {valueDimensions.map((dimension) => (
            <div key={dimension.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {dimension.icon} {dimension.name}
                </span>
                <span className={`text-sm font-bold ${getScoreColorClass(dimension.score)}`}>
                  {dimension.score}%
                </span>
              </div>
              <ProgressBar value={dimension.score} colorClass={getProgressColorClass(dimension.score)} />
              <p className="text-xs text-muted-foreground">{dimension.description}</p>
            </div>
          ))}
        </div>

        {/* 追加の次元（もしあれば） */}
        {data.dimensions && data.dimensions.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">詳細価値観</h4>
            <div className="flex flex-wrap gap-2">
              {data.dimensions.map((dim, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={getScoreBadgeClass(dim.score)}
                >
                  {dim.name}: {dim.score}%
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

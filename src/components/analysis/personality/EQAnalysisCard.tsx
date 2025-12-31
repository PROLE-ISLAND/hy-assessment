'use client';

/**
 * EQAnalysisCard
 *
 * Generated with v0: https://v0.app/chat/hMFXyEhHkCB
 * Issue: #148
 *
 * Variants:
 * - Default: EQ（感情知性）4領域スコア表示
 * - Loading: スケルトンUI
 * - Empty: データなし状態
 * - Error: エラー + 再試行
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';
import {
  PersonalityCardSkeleton,
  PersonalityCardError,
  PersonalityCardEmpty,
  ProgressBar,
} from './shared';
import {
  type EQAnalysisData,
  type PersonalityCardProps,
  getScoreColorClass,
  getScoreBadgeClass,
  getProgressColorClass,
} from './types';

type EQAnalysisCardProps = PersonalityCardProps<EQAnalysisData>;

/**
 * EQ分析カード
 * 感情知性の4領域を評価
 */
export function EQAnalysisCard({
  data,
  isLoading,
  error,
  onRetry,
}: EQAnalysisCardProps) {
  // Loading状態
  if (isLoading) {
    return <PersonalityCardSkeleton data-testid="eq-analysis-card-skeleton" />;
  }

  // Error状態
  if (error) {
    return (
      <PersonalityCardError
        error={error}
        onRetry={onRetry}
        data-testid="eq-analysis-card-error"
      />
    );
  }

  // Empty状態
  if (!data) {
    return (
      <PersonalityCardEmpty
        title="EQ分析"
        message="EQデータがありません"
        data-testid="eq-analysis-card-empty"
      />
    );
  }

  // Default状態
  const eqDimensions = [
    { name: '自己認識', score: data.selfAwareness, description: '自分の感情を正確に把握する力' },
    { name: '自己管理', score: data.selfManagement, description: '感情をコントロールする力' },
    { name: '社会認識', score: data.socialAwareness, description: '他者の感情を理解する力' },
    { name: '関係管理', score: data.relationshipManagement, description: '人間関係を構築・維持する力' },
  ];

  return (
    <Card data-testid="eq-analysis-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          EQ（感情知性）分析
          <Badge className={`ml-auto ${getScoreBadgeClass(data.overallScore)}`}>
            総合 {data.overallScore}点
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 総合スコア */}
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">EQ総合スコア</p>
          <p className={`text-3xl font-bold ${getScoreColorClass(data.overallScore)}`}>
            {data.overallScore}
            <span className="text-lg font-normal text-muted-foreground">/100</span>
          </p>
        </div>

        {/* 4領域スコア */}
        <div className="space-y-3">
          {eqDimensions.map((dimension) => (
            <div key={dimension.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{dimension.name}</span>
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
            <h4 className="text-sm font-semibold mb-2">詳細能力</h4>
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

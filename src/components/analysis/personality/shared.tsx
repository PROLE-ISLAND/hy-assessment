'use client';

// =====================================================
// Shared Components for Personality Cards
// Skeleton, Error, Empty states
// =====================================================

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Inbox } from 'lucide-react';
import { stateColors } from '@/lib/design-system';

interface CardSkeletonProps {
  'data-testid'?: string;
}

/**
 * カードのスケルトンUI
 */
export function PersonalityCardSkeleton({ 'data-testid': testId }: CardSkeletonProps) {
  return (
    <Card data-testid={testId}>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

interface CardErrorProps {
  error: Error;
  onRetry?: () => void;
  'data-testid'?: string;
}

/**
 * エラー状態のカード
 */
export function PersonalityCardError({ error, onRetry, 'data-testid': testId }: CardErrorProps) {
  return (
    <Card data-testid={testId}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle
          className={`h-12 w-12 mb-4 ${stateColors.error.light.text} ${stateColors.error.dark.text}`}
        />
        <p className={`mb-2 font-medium ${stateColors.error.light.text} ${stateColors.error.dark.text}`}>
          読み込みに失敗しました
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          {error.message || 'データの取得中にエラーが発生しました'}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            data-testid={testId ? `${testId.replace('-error', '')}-retry-button` : undefined}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            再試行
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface CardEmptyProps {
  title: string;
  message?: string;
  'data-testid'?: string;
}

/**
 * データなし状態のカード
 */
export function PersonalityCardEmpty({ title, message, 'data-testid': testId }: CardEmptyProps) {
  return (
    <Card data-testid={testId}>
      <CardHeader>
        <h3 className="text-lg font-semibold">{title}</h3>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <Inbox className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">
          {message || 'データがありません'}
        </p>
      </CardContent>
    </Card>
  );
}

interface ProgressBarProps {
  value: number;
  colorClass: string;
}

/**
 * プログレスバーコンポーネント
 */
export function ProgressBar({ value, colorClass }: ProgressBarProps) {
  return (
    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

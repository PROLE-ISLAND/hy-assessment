'use client';

// =====================================================
// Values Analysis Card
// Displays achievement, stability, growth, social contribution, autonomy
// Variants: Default, Loading (skeleton), Empty, Error
// =====================================================

import { Trophy, Home, TrendingUp, Heart, Compass, AlertCircle, RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { PersonalityValues, PersonalityCardBaseProps } from './types';
import { cn } from '@/lib/utils';

interface ValuesCardProps extends PersonalityCardBaseProps {
  data: PersonalityValues | null;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

const VALUES_CONFIG = {
  achievement: {
    label: '達成志向',
    icon: Trophy,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: '目標達成・成果へのこだわり',
  },
  stability: {
    label: '安定志向',
    icon: Home,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: '安定した環境・予測可能性の重視',
  },
  growth: {
    label: '成長志向',
    icon: TrendingUp,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    description: '学習・自己成長への意欲',
  },
  socialContribution: {
    label: '社会貢献',
    icon: Heart,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    description: '他者への貢献・社会的意義の追求',
  },
  autonomy: {
    label: '自律志向',
    icon: Compass,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: '独立性・自己決定の重視',
  },
} as const;

// Skeleton variant for loading state
function ValuesCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('', className)} data-testid="values-card-skeleton">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-28 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-3/4 mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Error variant
function ValuesCardError({
  className,
  error,
  onRetry,
}: {
  className?: string;
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <Card className={cn('', className)} data-testid="values-card-error">
      <CardHeader>
        <CardTitle>価値観分析</CardTitle>
        <CardDescription>読み込みに失敗しました</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          {error.message || 'データの取得中にエラーが発生しました'}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            再試行
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ValuesCard({ data, className, isLoading, error, onRetry }: ValuesCardProps) {
  // Loading state
  if (isLoading) {
    return <ValuesCardSkeleton className={className} />;
  }

  // Error state
  if (error) {
    return <ValuesCardError className={className} error={error} onRetry={onRetry} />;
  }

  // Empty state
  if (!data) {
    return (
      <Card className={cn('', className)} data-testid="values-card-empty">
        <CardHeader>
          <CardTitle>価値観分析</CardTitle>
          <CardDescription>分析データがありません</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Find the highest value for visual emphasis
  const scores = {
    achievement: data.achievement,
    stability: data.stability,
    growth: data.growth,
    socialContribution: data.socialContribution,
    autonomy: data.autonomy,
  };
  const maxScore = Math.max(...Object.values(scores));

  return (
    <Card className={cn('', className)} data-testid="values-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>価値観分析</CardTitle>
            <CardDescription>重視する価値観の傾向</CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {data.primaryValue}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Values Bars */}
        <div className="space-y-4">
          {(Object.keys(VALUES_CONFIG) as Array<keyof typeof VALUES_CONFIG>).map((key) => {
            const config = VALUES_CONFIG[key];
            const score = scores[key];
            const Icon = config.icon;
            const isHighest = score === maxScore;

            return (
              <div
                key={key}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  isHighest ? config.bgColor : 'hover:bg-muted/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded', config.bgColor)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn('text-sm font-medium', isHighest && 'font-bold')}>
                        {config.label}
                      </span>
                      <span className={cn('text-sm font-bold', isHighest && config.color)}>
                        {score}%
                      </span>
                    </div>
                    <Progress value={score} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dimensions */}
        {data.dimensions && data.dimensions.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">詳細分析</h4>
            <div className="space-y-3">
              {data.dimensions.map((dimension, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{dimension.score}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{dimension.name}</p>
                    <p className="text-sm text-muted-foreground">{dimension.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

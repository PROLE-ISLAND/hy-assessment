'use client';

// =====================================================
// Behavioral Analysis Card (DISC-based)
// Displays dominance, influence, steadiness, conscientiousness
// Variants: Default, Loading (skeleton), Empty, Error
// =====================================================

import { Activity, User, Heart, Shield, AlertCircle, RefreshCw } from 'lucide-react';
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
import type { PersonalityBehavioral, PersonalityCardBaseProps } from './types';
import { cn } from '@/lib/utils';

interface BehavioralCardProps extends PersonalityCardBaseProps {
  data: PersonalityBehavioral | null;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

const DISC_CONFIG = {
  dominance: {
    label: '主導性 (D)',
    icon: Activity,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    progressColor: 'bg-red-500',
    description: '目標達成志向、決断力、競争心',
  },
  influence: {
    label: '影響力 (I)',
    icon: User,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    progressColor: 'bg-yellow-500',
    description: '社交性、説得力、楽観性',
  },
  steadiness: {
    label: '安定性 (S)',
    icon: Heart,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    progressColor: 'bg-green-500',
    description: '協調性、忍耐力、支援志向',
  },
  conscientiousness: {
    label: '慎重性 (C)',
    icon: Shield,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    progressColor: 'bg-blue-500',
    description: '分析力、正確性、質への拘り',
  },
} as const;

// Skeleton variant for loading state
function BehavioralCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('', className)} data-testid="behavioral-card-skeleton">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Error variant
function BehavioralCardError({
  className,
  error,
  onRetry,
}: {
  className?: string;
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <Card className={cn('', className)} data-testid="behavioral-card-error">
      <CardHeader>
        <CardTitle>行動特性分析</CardTitle>
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

export function BehavioralCard({ data, className, isLoading, error, onRetry }: BehavioralCardProps) {
  // Loading state
  if (isLoading) {
    return <BehavioralCardSkeleton className={className} />;
  }

  // Error state
  if (error) {
    return <BehavioralCardError className={className} error={error} onRetry={onRetry} />;
  }

  // Empty state
  if (!data) {
    return (
      <Card className={cn('', className)} data-testid="behavioral-card-empty">
        <CardHeader>
          <CardTitle>行動特性分析</CardTitle>
          <CardDescription>分析データがありません</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)} data-testid="behavioral-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>行動特性分析</CardTitle>
            <CardDescription>DISC理論に基づく行動傾向</CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {data.overallType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* DISC Scores */}
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(DISC_CONFIG) as Array<keyof typeof DISC_CONFIG>).map((key) => {
            const config = DISC_CONFIG[key];
            const score = data[key];
            const Icon = config.icon;

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={cn('p-1.5 rounded', config.bgColor)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{config.label}</span>
                      <span className="text-sm font-bold">{score}%</span>
                    </div>
                  </div>
                </div>
                <Progress value={score} className={cn('h-2', config.progressColor)} />
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            );
          })}
        </div>

        {/* Traits */}
        {data.traits && data.traits.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">特性詳細</h4>
            <div className="space-y-3">
              {data.traits.map((trait, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{trait.score}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{trait.name}</p>
                    <p className="text-sm text-muted-foreground">{trait.description}</p>
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

'use client';

// =====================================================
// Stress Resilience Card
// Displays pressure handling, recovery, stability, adaptability
// =====================================================

import { Zap, RefreshCw, Anchor, Shuffle, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { PersonalityStress, PersonalityCardBaseProps } from './types';
import { cn } from '@/lib/utils';

interface StressCardProps extends PersonalityCardBaseProps {
  data: PersonalityStress | null;
}

const STRESS_DIMENSIONS = {
  pressureHandling: {
    label: 'プレッシャー対処',
    icon: Zap,
    description: 'プレッシャー下でのパフォーマンス維持能力',
  },
  recoverySpeed: {
    label: '回復速度',
    icon: RefreshCw,
    description: 'ストレスからの回復速度',
  },
  emotionalStability: {
    label: '感情安定性',
    icon: Anchor,
    description: '感情の安定性',
  },
  adaptability: {
    label: '適応力',
    icon: Shuffle,
    description: '変化への適応力',
  },
} as const;

const RISK_CONFIG = {
  low: {
    label: '低リスク',
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  medium: {
    label: '中リスク',
    icon: Info,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  },
  high: {
    label: '高リスク',
    icon: AlertTriangle,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
  },
} as const;

export function StressCard({ data, className }: StressCardProps) {
  if (!data) {
    return (
      <Card className={cn('', className)} data-testid="stress-card-empty">
        <CardHeader>
          <CardTitle>ストレス耐性分析</CardTitle>
          <CardDescription>分析データがありません</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const riskConfig = RISK_CONFIG[data.riskLevel];
  const RiskIcon = riskConfig.icon;

  return (
    <Card className={cn('', className)} data-testid="stress-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>ストレス耐性分析</CardTitle>
            <CardDescription>プレッシャー下での行動傾向</CardDescription>
          </div>
          <Badge className={riskConfig.badgeClass}>
            <RiskIcon className="h-3 w-3 mr-1" />
            {riskConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className={cn('p-4 rounded-lg', riskConfig.bgColor)}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">総合ストレス耐性スコア</span>
            <span className={cn('text-2xl font-bold', riskConfig.color)}>
              {data.overallScore}%
            </span>
          </div>
          <Progress value={data.overallScore} className="h-2" />
        </div>

        {/* Dimension Scores */}
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(STRESS_DIMENSIONS) as Array<keyof typeof STRESS_DIMENSIONS>).map((key) => {
            const config = STRESS_DIMENSIONS[key];
            const score = data[key];
            const Icon = config.icon;

            return (
              <div key={key} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Progress value={score} className="flex-1 mr-3 h-2" />
                  <span className="text-sm font-bold">{score}%</span>
                </div>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            );
          })}
        </div>

        {/* Metrics */}
        {data.metrics && data.metrics.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">詳細指標</h4>
            <div className="space-y-3">
              {data.metrics.map((metric, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{metric.score}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{metric.name}</p>
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
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

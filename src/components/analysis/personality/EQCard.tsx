'use client';

// =====================================================
// EQ (Emotional Intelligence) Card
// Displays self-awareness, self-management, social awareness, relationship management
// =====================================================

import { Eye, Brain, Users, Handshake } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { PersonalityEQ, PersonalityCardBaseProps } from './types';
import { cn } from '@/lib/utils';

interface EQCardProps extends PersonalityCardBaseProps {
  data: PersonalityEQ | null;
}

const EQ_DIMENSIONS = {
  selfAwareness: {
    label: '自己認識',
    icon: Eye,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    description: '自己の感情認識',
  },
  selfManagement: {
    label: '自己管理',
    icon: Brain,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    description: '感情のコントロール',
  },
  socialAwareness: {
    label: '社会認識',
    icon: Users,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    description: '他者の感情理解',
  },
  relationshipManagement: {
    label: '関係管理',
    icon: Handshake,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    description: '対人関係構築力',
  },
} as const;

function getScoreLevel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: '高い', color: 'text-emerald-600 dark:text-emerald-400' };
  if (score >= 40) return { label: '標準', color: 'text-amber-600 dark:text-amber-400' };
  return { label: '要注意', color: 'text-rose-600 dark:text-rose-400' };
}

export function EQCard({ data, className }: EQCardProps) {
  if (!data) {
    return (
      <Card className={cn('', className)} data-testid="eq-card-empty">
        <CardHeader>
          <CardTitle>感情知性 (EQ) 分析</CardTitle>
          <CardDescription>分析データがありません</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const overallLevel = getScoreLevel(data.overallScore);

  return (
    <Card className={cn('', className)} data-testid="eq-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>感情知性 (EQ) 分析</CardTitle>
            <CardDescription>感情認識・管理能力の傾向</CardDescription>
          </div>
          <div className="text-right">
            <div className={cn('text-2xl font-bold', overallLevel.color)}>
              {data.overallScore}%
            </div>
            <div className="text-xs text-muted-foreground">{overallLevel.label}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* EQ Quadrant */}
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(EQ_DIMENSIONS) as Array<keyof typeof EQ_DIMENSIONS>).map((key) => {
            const config = EQ_DIMENSIONS[key];
            const score = data[key];
            const Icon = config.icon;

            return (
              <div key={key} className={cn('p-4 rounded-lg border', config.bgColor)}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn('h-5 w-5', config.color)} />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <Progress value={score} className="flex-1 mr-3 h-2" />
                  <span className="text-lg font-bold">{score}%</span>
                </div>
                <p className="text-xs text-muted-foreground">{config.description}</p>
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

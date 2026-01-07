'use client';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Brain,
  ClipboardList,
  Heart,
  RefreshCw,
  Shield,
  Target,
} from 'lucide-react';

// 型定義
export interface PersonalityAssessment {
  id: string;
  candidate_id: string;
  // DISC
  disc_dominance: number;
  disc_influence: number;
  disc_steadiness: number;
  disc_conscientiousness: number;
  disc_primary_factor: 'D' | 'I' | 'S' | 'C';
  disc_profile_pattern: string;
  // ストレス耐性
  stress_overall: number;
  stress_risk_level: 'low' | 'medium' | 'high';
  stress_details?: {
    pressureHandling?: number;
    recoverySpeed?: number;
    emotionalStability?: number;
    adaptability?: number;
  };
  // EQ
  eq_overall: number;
  eq_details?: {
    selfAwareness?: number;
    selfManagement?: number;
    socialAwareness?: number;
    relationshipManagement?: number;
  };
  // 価値観
  values_achievement: number;
  values_stability: number;
  values_growth: number;
  values_social_contribution: number;
  values_autonomy: number;
  values_primary: string;
  // メタデータ
  completed_at: string;
  duration_seconds?: number;
}

interface PersonalityResultsTabProps {
  assessment?: PersonalityAssessment | null;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

// DISCファクター説明
const discDescriptions: Record<string, { name: string; desc: string }> = {
  D: { name: '主導性', desc: '結果志向、決断力、競争心が強い' },
  I: { name: '影響力', desc: '社交的、説得力があり、楽観的' },
  S: { name: '安定性', desc: '協調性、忍耐力、支援志向が強い' },
  C: { name: '慎重性', desc: '分析力、正確性、質への拘りが強い' },
};

// ストレスリスクレベルのスタイル
const stressRiskStyles: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-emerald-500', label: '低リスク' },
  medium: { color: 'bg-amber-500', label: '中リスク' },
  high: { color: 'bg-rose-500', label: '高リスク' },
};

// スコアバー
function ScoreBar({
  label,
  value,
  maxValue = 100,
}: {
  label: string;
  value: number;
  maxValue?: number;
}) {
  const percentage = (value / maxValue) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

// スケルトンUI
function PersonalityResultsSkeleton() {
  return (
    <div data-testid="personality-results-skeleton" className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// 空状態UI
function PersonalityResultsEmpty() {
  return (
    <Card data-testid="personality-results-empty">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">パーソナリティ検査未実施</h3>
        <p className="text-muted-foreground">
          この候補者はまだパーソナリティ検査を受験していません
        </p>
      </CardContent>
    </Card>
  );
}

// エラーUI
function PersonalityResultsError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <Card data-testid="personality-results-error">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">結果の読み込みに失敗しました</h3>
        <p className="text-muted-foreground mb-6">
          {error.message || 'エラーが発生しました'}
        </p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          再読み込み
        </Button>
      </CardContent>
    </Card>
  );
}

// デフォルトUI（結果表示）
function PersonalityResultsDefault({
  assessment,
}: {
  assessment: PersonalityAssessment;
}) {
  const primaryDisc = discDescriptions[assessment.disc_primary_factor];
  const stressStyle = stressRiskStyles[assessment.stress_risk_level];

  return (
    <div data-testid="personality-results" className="space-y-4">
      {/* サマリーカード */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            パーソナリティ概要
          </CardTitle>
          <CardDescription>
            検査完了日:{' '}
            {new Date(assessment.completed_at).toLocaleDateString('ja-JP')}
            {assessment.duration_seconds && (
              <> / 所要時間: {Math.round(assessment.duration_seconds / 60)}分</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* DISC */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">DISC</span>
              </div>
              <div className="text-2xl font-bold">
                {assessment.disc_primary_factor}
              </div>
              <p className="text-xs text-muted-foreground">{primaryDisc?.name}</p>
            </div>
            {/* ストレス */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">ストレス耐性</span>
              </div>
              <div className="text-2xl font-bold">{assessment.stress_overall}</div>
              <Badge className={stressStyle.color}>{stressStyle.label}</Badge>
            </div>
            {/* EQ */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">EQ</span>
              </div>
              <div className="text-2xl font-bold">{assessment.eq_overall}</div>
              <p className="text-xs text-muted-foreground">感情知性</p>
            </div>
            {/* 価値観 */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">主要価値観</span>
              </div>
              <div className="text-lg font-bold capitalize">
                {assessment.values_primary}
              </div>
              <p className="text-xs text-muted-foreground">最も重視する価値</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 詳細タブ */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="disc">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="disc" data-testid="disc-profile-tab">
                DISC
              </TabsTrigger>
              <TabsTrigger value="stress" data-testid="stress-profile-tab">
                ストレス
              </TabsTrigger>
              <TabsTrigger value="eq" data-testid="eq-profile-tab">
                EQ
              </TabsTrigger>
              <TabsTrigger value="values" data-testid="values-profile-tab">
                価値観
              </TabsTrigger>
            </TabsList>

            {/* DISC詳細 */}
            <TabsContent value="disc" className="mt-4 space-y-4">
              <div data-testid="disc-profile-chart" className="space-y-3">
                <ScoreBar label="D（主導性）" value={assessment.disc_dominance} />
                <ScoreBar label="I（影響力）" value={assessment.disc_influence} />
                <ScoreBar label="S（安定性）" value={assessment.disc_steadiness} />
                <ScoreBar
                  label="C（慎重性）"
                  value={assessment.disc_conscientiousness}
                />
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>プロファイルパターン:</strong>{' '}
                  {assessment.disc_profile_pattern}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {primaryDisc?.desc}
                </p>
              </div>
            </TabsContent>

            {/* ストレス詳細 */}
            <TabsContent value="stress" className="mt-4 space-y-4">
              <div data-testid="stress-score-display" className="space-y-3">
                <ScoreBar label="総合スコア" value={assessment.stress_overall} />
                {assessment.stress_details && (
                  <>
                    <ScoreBar
                      label="プレッシャー耐性"
                      value={assessment.stress_details.pressureHandling ?? 0}
                    />
                    <ScoreBar
                      label="回復速度"
                      value={assessment.stress_details.recoverySpeed ?? 0}
                    />
                    <ScoreBar
                      label="感情安定性"
                      value={assessment.stress_details.emotionalStability ?? 0}
                    />
                    <ScoreBar
                      label="適応力"
                      value={assessment.stress_details.adaptability ?? 0}
                    />
                  </>
                )}
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">リスクレベル:</span>
                  <Badge className={stressStyle.color}>{stressStyle.label}</Badge>
                </div>
              </div>
            </TabsContent>

            {/* EQ詳細 */}
            <TabsContent value="eq" className="mt-4 space-y-4">
              <div data-testid="eq-score-display" className="space-y-3">
                <ScoreBar label="総合スコア" value={assessment.eq_overall} />
                {assessment.eq_details && (
                  <>
                    <ScoreBar
                      label="自己認識"
                      value={assessment.eq_details.selfAwareness ?? 0}
                    />
                    <ScoreBar
                      label="自己管理"
                      value={assessment.eq_details.selfManagement ?? 0}
                    />
                    <ScoreBar
                      label="社会的認識"
                      value={assessment.eq_details.socialAwareness ?? 0}
                    />
                    <ScoreBar
                      label="関係管理"
                      value={assessment.eq_details.relationshipManagement ?? 0}
                    />
                  </>
                )}
              </div>
            </TabsContent>

            {/* 価値観詳細 */}
            <TabsContent value="values" className="mt-4 space-y-4">
              <div data-testid="values-profile-chart" className="space-y-3">
                <ScoreBar label="達成志向" value={assessment.values_achievement} />
                <ScoreBar label="安定志向" value={assessment.values_stability} />
                <ScoreBar label="成長志向" value={assessment.values_growth} />
                <ScoreBar
                  label="社会貢献志向"
                  value={assessment.values_social_contribution}
                />
                <ScoreBar label="自律志向" value={assessment.values_autonomy} />
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>最も重視する価値観:</strong>{' '}
                  <span className="capitalize">{assessment.values_primary}</span>
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// メインコンポーネント
export function PersonalityResultsTab({
  assessment,
  isLoading,
  error,
  onRetry,
}: PersonalityResultsTabProps) {
  // 早期リターンパターン
  if (isLoading) {
    return <PersonalityResultsSkeleton />;
  }

  if (error) {
    return <PersonalityResultsError error={error} onRetry={onRetry} />;
  }

  if (!assessment) {
    return <PersonalityResultsEmpty />;
  }

  return <PersonalityResultsDefault assessment={assessment} />;
}

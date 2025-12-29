// =====================================================
// Reports & Analytics Page
// Domain-wise and position-wise analysis with date filtering
// =====================================================

import { Suspense } from 'react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Target, Users, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { DOMAIN_LABELS } from '@/lib/analysis';
import { POSITIONS } from '@/lib/constants/positions';
import { getScoreTextClass, getProgressColor, stateColors } from '@/lib/design-system';
import { ReportsDateFilter } from '@/components/dashboard/reports-date-filter';
import { ExportButtons } from '@/components/reports/ExportButtons';

// Type for analysis data
interface AnalysisWithCandidate {
  scores: Record<string, number>;
  created_at: string;
  assessments: {
    candidates: {
      position: string;
      desired_positions: string[] | null;
    };
  };
}

// Props type for searchParams
interface PageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

// Helper to calculate average
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
}

// Helper to get trend icon
function getTrendIcon(current: number, baseline: number) {
  const diff = current - baseline;
  if (diff > 5) return <TrendingUp className={`h-4 w-4 ${stateColors.success.light.text}`} />;
  if (diff < -5) return <TrendingDown className={`h-4 w-4 ${stateColors.error.light.text}`} />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Parse date filter from URL
  const fromDate = params.from ? new Date(params.from) : null;
  const toDate = params.to ? new Date(params.to) : null;

  // Get current user and organization
  const { data: { user } } = await supabase.auth.getUser();

  let organizationId: string | null = null;
  if (user) {
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single<{ organization_id: string }>();
    organizationId = dbUser?.organization_id || null;
  }

  // Build query with date filter
  let query = adminSupabase
    .from('ai_analyses')
    .select(`
      scores,
      created_at,
      assessments!inner(
        candidates!inner(
          position,
          desired_positions
        )
      )
    `)
    .eq('organization_id', organizationId || '')
    .eq('is_latest', true);

  // Apply date filter
  if (fromDate) {
    query = query.gte('created_at', fromDate.toISOString());
  }
  if (toDate) {
    // Add 1 day to include the end date fully
    const endDate = new Date(toDate);
    endDate.setDate(endDate.getDate() + 1);
    query = query.lt('created_at', endDate.toISOString());
  }

  const { data: analyses } = await query.returns<AnalysisWithCandidate[]>();

  // Calculate domain averages
  const domains = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK', 'VALID'] as const;
  const domainStats: Record<string, { scores: number[]; avg: number }> = {};

  domains.forEach(domain => {
    domainStats[domain] = { scores: [], avg: 0 };
  });

  analyses?.forEach(analysis => {
    domains.forEach(domain => {
      if (analysis.scores[domain] !== undefined) {
        domainStats[domain].scores.push(analysis.scores[domain]);
      }
    });
  });

  domains.forEach(domain => {
    domainStats[domain].avg = average(domainStats[domain].scores);
  });

  // Calculate position-wise stats
  const positionStats: Record<string, { count: number; scores: number[]; avg: number }> = {};

  analyses?.forEach(analysis => {
    const positions = analysis.assessments.candidates.desired_positions ||
      (analysis.assessments.candidates.position ? [analysis.assessments.candidates.position] : []);

    // Calculate overall score
    const scorableDomains = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK'];
    const total = scorableDomains.reduce((sum, d) => sum + (analysis.scores[d] || 0), 0);
    const overall = Math.round(total / scorableDomains.length);

    positions.forEach(pos => {
      if (!positionStats[pos]) {
        positionStats[pos] = { count: 0, scores: [], avg: 0 };
      }
      positionStats[pos].count++;
      positionStats[pos].scores.push(overall);
    });
  });

  Object.keys(positionStats).forEach(pos => {
    positionStats[pos].avg = average(positionStats[pos].scores);
  });

  // Calculate overall stats
  const totalAnalyses = analyses?.length || 0;
  const overallScores = analyses?.map(a => {
    const scorableDomains = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK'];
    const total = scorableDomains.reduce((sum, d) => sum + (a.scores[d] || 0), 0);
    return Math.round(total / scorableDomains.length);
  }) || [];
  const overallAvg = average(overallScores);

  // Baseline score (hypothetical company standard)
  const baselineScore = 60;

  const isEmpty = totalAnalyses === 0;

  // Format filter description
  const filterDescription = fromDate
    ? toDate
      ? `${fromDate.toLocaleDateString('ja-JP')} - ${toDate.toLocaleDateString('ja-JP')}`
      : `${fromDate.toLocaleDateString('ja-JP')} 以降`
    : '全期間';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">レポート</h1>
          <p className="text-muted-foreground">
            検査結果の分析とインサイト
          </p>
        </div>
        {!isEmpty && <ExportButtons />}
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            期間フィルター
          </CardTitle>
          <CardDescription>
            分析対象の期間を選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-10 w-full animate-pulse bg-muted rounded" />}>
            <ReportsDateFilter />
          </Suspense>
        </CardContent>
      </Card>

      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">分析データがありません</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              {fromDate
                ? `選択された期間（${filterDescription}）に該当するデータがありません。期間を変更するか、「全期間」を選択してください。`
                : '検査が完了してAI分析が実行されると、ここにレポートが表示されます。'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">分析済み検査</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalAnalyses}</div>
                <p className="text-xs text-muted-foreground">
                  件のAI分析（{filterDescription}）
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">全体平均スコア</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreTextClass(overallAvg)}`}>
                  {overallAvg}%
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getTrendIcon(overallAvg, baselineScore)}
                  <span>基準値: {baselineScore}%</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">職種カテゴリ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Object.keys(positionStats).length}</div>
                <p className="text-xs text-muted-foreground">種類の職種</p>
              </CardContent>
            </Card>
          </div>

          {/* Domain Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                ドメイン別分析
              </CardTitle>
              <CardDescription>
                6つの評価ドメインの平均スコア
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {domains.map(domain => {
                  const stat = domainStats[domain];
                  const isCOG = domain === 'COG';

                  return (
                    <div key={domain} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{DOMAIN_LABELS[domain]}</span>
                          <Badge variant="outline" className="text-xs">
                            {stat.scores.length}件
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${getScoreTextClass(isCOG ? 100 - stat.avg : stat.avg)}`}>
                            {stat.avg}%
                          </span>
                          {isCOG && (
                            <span className="text-xs text-muted-foreground">(低いほど良好)</span>
                          )}
                        </div>
                      </div>
                      <Progress
                        value={stat.avg}
                        className="h-2"
                        indicatorColor={getProgressColor(stat.avg, isCOG)}
                        glass
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Position Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                職種別分析
              </CardTitle>
              <CardDescription>
                希望職種ごとの平均スコアと候補者数
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(positionStats).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  職種データがありません
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(positionStats)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([position, stat]) => {
                      // Get position label
                      const positionInfo = POSITIONS.find(p => p.value === position);
                      const label = positionInfo?.label || position;

                      return (
                        <div key={position} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <div className="font-medium">{label}</div>
                            <div className="text-xs text-muted-foreground">
                              {stat.count}名の候補者
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getScoreTextClass(stat.avg)}`}>
                              {stat.avg}%
                            </div>
                            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                              {getTrendIcon(stat.avg, overallAvg)}
                              <span>全体比</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights Card */}
          <Card>
            <CardHeader>
              <CardTitle>インサイト</CardTitle>
              <CardDescription>
                分析結果から導き出されるポイント
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Best performing domain */}
              {(() => {
                const sortedDomains = domains
                  .filter(d => d !== 'VALID' && d !== 'COG')
                  .sort((a, b) => domainStats[b].avg - domainStats[a].avg);
                const best = sortedDomains[0];
                const worst = sortedDomains[sortedDomains.length - 1];

                return (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-green-900 dark:text-green-100">強みの傾向</div>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          候補者全体で「{DOMAIN_LABELS[best]}」のスコアが最も高く（{domainStats[best].avg}%）、
                          組織への適合が期待できます。
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                      <TrendingDown className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <div className="font-medium text-yellow-900 dark:text-yellow-100">改善の余地</div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          「{DOMAIN_LABELS[worst]}」のスコアが相対的に低め（{domainStats[worst].avg}%）。
                          面接での確認ポイントとして活用できます。
                        </p>
                      </div>
                    </div>
                    {domainStats['COG'].avg > 50 && (
                      <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                        <Target className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                        <div>
                          <div className="font-medium text-orange-900 dark:text-orange-100">認知スタイルの傾向</div>
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            COGスコアが平均{domainStats['COG'].avg}%と高めの傾向があります。
                            被害者意識や感情的思考の傾向に注意が必要な候補者が含まれる可能性があります。
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

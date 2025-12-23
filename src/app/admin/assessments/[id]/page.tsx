// =====================================================
// Assessment Detail Page
// Shows detailed analysis results for a single assessment
// Uses design system for consistent styling
// =====================================================

import { notFound } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { DOMAIN_LABELS, DOMAIN_DESCRIPTIONS } from '@/lib/analysis';
import { DomainRadarChart, ScoreBarChart } from '@/components/analysis';
import { InterviewPoints } from '@/components/analysis/InterviewPoints';
import { PageBreadcrumb } from '@/components/layout';
import { calculateJudgment, generateInterviewPoints, type DomainScores } from '@/lib/analysis/judgment';
import {
  assessmentStatusConfig,
  riskLevelConfig,
  judgmentConfig,
  getScoreTextClass,
  type JudgmentLevel,
  type RiskLevel,
} from '@/lib/design-system';
import type { AssessmentStatus } from '@/types/database';
import type { Domain } from '@/lib/analysis';

// Type for assessment with relations
interface AssessmentDetail {
  id: string;
  status: AssessmentStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  candidates: {
    id: string;
    position: string;
    persons: {
      name: string;
      email: string;
    };
  };
  assessment_templates: {
    name: string;
    version: string;
  };
  ai_analyses: Array<{
    id: string;
    scores: Record<string, number>;
    strengths: string[];
    weaknesses: string[];
    summary: string | null;
    recommendation: string | null;
    model_version: string;
    prompt_version: string;
    tokens_used: number;
    version: number;
    is_latest: boolean;
    analyzed_at: string;
  }>;
}

function formatDate(dateString: string | null) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getOverallScore(scores: Record<string, number>): number {
  const scorableDomains = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK'];
  const total = scorableDomains.reduce((sum, domain) => sum + (scores[domain] || 0), 0);
  return Math.round(total / scorableDomains.length);
}

function getRiskLevel(domain: Domain, score: number): RiskLevel {
  if (domain === 'COG') {
    // COG is reversed - higher score means more problematic
    return score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  } else if (domain === 'VALID') {
    return score < 60 ? 'high' : score < 80 ? 'medium' : 'low';
  } else {
    return score < 50 ? 'high' : score < 70 ? 'medium' : 'low';
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssessmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get current user and verify access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  // Get user's organization
  const { data: dbUser } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single<{ organization_id: string }>();

  if (!dbUser?.organization_id) {
    notFound();
  }

  // Get assessment with relations (using admin client)
  const { data: assessment, error } = await adminSupabase
    .from('assessments')
    .select(`
      id,
      status,
      started_at,
      completed_at,
      created_at,
      candidates!inner(
        id,
        position,
        persons!inner(
          name,
          email
        )
      ),
      assessment_templates!inner(
        name,
        version
      ),
      ai_analyses(
        id,
        scores,
        strengths,
        weaknesses,
        summary,
        recommendation,
        model_version,
        prompt_version,
        tokens_used,
        version,
        is_latest,
        analyzed_at
      )
    `)
    .eq('id', id)
    .eq('organization_id', dbUser.organization_id)
    .is('deleted_at', null)
    .single<AssessmentDetail>();

  if (error || !assessment) {
    notFound();
  }

  const latestAnalysis = assessment.ai_analyses?.find(a => a.is_latest);
  const overallScore = latestAnalysis ? getOverallScore(latestAnalysis.scores) : null;

  // Calculate judgment and interview points
  const judgment = latestAnalysis ? calculateJudgment(latestAnalysis.scores as unknown as DomainScores) : null;
  const interviewPoints = latestAnalysis ? generateInterviewPoints(latestAnalysis.scores as unknown as DomainScores) : [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <PageBreadcrumb
        items={[
          { label: '候補者', href: '/admin/candidates' },
          { label: assessment.candidates.persons.name, href: `/admin/candidates/${assessment.candidates.id}` },
        ]}
        currentPage="分析結果"
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {assessment.candidates?.persons?.name}
            </h1>
              {judgment && (() => {
                const config = judgmentConfig[judgment.level as JudgmentLevel];
                const Icon = config.icon;
                return (
                  <Badge className={`${config.badgeClass} text-sm px-3 py-1`}>
                    <Icon className={`h-4 w-4 mr-1 ${config.iconClass}`} />
                    {config.label}
                  </Badge>
                );
              })()}
            </div>
            <p className="text-muted-foreground">
              {assessment.candidates?.position} · {assessment.assessment_templates?.name}
            </p>
          </div>
        <div className="flex gap-2">
          {latestAnalysis && (
            <Button variant="outline" asChild>
              <a href={`/api/analysis/pdf/${assessment.id}`} download>
                <Download className="mr-2 h-4 w-4" />
                PDF出力
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">候補者</div>
              <div className="font-medium">{assessment.candidates?.persons?.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">メール</div>
              <div className="font-medium">{assessment.candidates?.persons?.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">応募職種</div>
              <div className="font-medium">{assessment.candidates?.position}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ステータス</div>
              <Badge className={assessmentStatusConfig[assessment.status].className} variant="secondary">
                {assessmentStatusConfig[assessment.status].label}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">検査開始</div>
              <div className="font-medium">{formatDate(assessment.started_at)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">検査完了</div>
              <div className="font-medium">{formatDate(assessment.completed_at)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">分析日時</div>
              <div className="font-medium">
                {latestAnalysis ? formatDate(latestAnalysis.analyzed_at) : '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">分析バージョン</div>
              <div className="font-medium">
                {latestAnalysis ? `v${latestAnalysis.version}` : '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {latestAnalysis ? (
        <>
          {/* Score Overview with Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Score + Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>総合スコア</CardTitle>
                <CardDescription>5ドメインの平均スコア（妥当性を除く）</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div className={`text-5xl font-bold mb-2 ${getScoreTextClass(overallScore!)}`}>
                    {overallScore}%
                  </div>
                  {judgment && (
                    <div className="mb-4 text-center">
                      <Badge className={`${judgmentConfig[judgment.level as JudgmentLevel].badgeClass} mb-2`}>
                        {judgmentConfig[judgment.level as JudgmentLevel].label}
                      </Badge>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {judgment.reasons.map((reason, idx) => (
                          <li key={idx}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <DomainRadarChart scores={latestAnalysis.scores} size="md" />
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>ドメイン別スコア</CardTitle>
                <CardDescription>6つの評価ドメインの比較</CardDescription>
              </CardHeader>
              <CardContent>
                <ScoreBarChart scores={latestAnalysis.scores} orientation="horizontal" />
              </CardContent>
            </Card>
          </div>

          {/* Domain Scores Detail */}
          <Card>
            <CardHeader>
              <CardTitle>ドメイン詳細</CardTitle>
              <CardDescription>各ドメインの説明とリスクレベル</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(['GOV', 'CONFLICT', 'REL', 'COG', 'WORK', 'VALID'] as Domain[]).map((domain) => {
                  const score = latestAnalysis.scores[domain] || 0;
                  const riskLevel = getRiskLevel(domain, score);

                  return (
                    <div key={domain} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{DOMAIN_LABELS[domain]}</div>
                        <Badge className={riskLevelConfig[riskLevel].className} variant="secondary">
                          {riskLevelConfig[riskLevel].label}
                        </Badge>
                      </div>
                      <div className="text-3xl font-bold mb-2">{score}%</div>
                      <div className="text-sm text-muted-foreground">
                        {DOMAIN_DESCRIPTIONS[domain]}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
                        <div
                          className={`h-full ${riskLevelConfig[riskLevel].progressColor}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  強み
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {latestAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  注意点
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {latestAnalysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Interview Points */}
          {interviewPoints.length > 0 && (
            <InterviewPoints points={interviewPoints} />
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>総合評価</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">
                {latestAnalysis.summary || '総合評価が生成されていません。'}
              </p>
            </CardContent>
          </Card>

          {/* Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle>採用推奨事項</CardTitle>
              <CardDescription>面接での確認ポイント・採用判断へのアドバイス</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed">
                {latestAnalysis.recommendation || '推奨事項が生成されていません。'}
              </p>
            </CardContent>
          </Card>

          {/* Technical Info */}
          <Card>
            <CardHeader>
              <CardTitle>分析情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">AIモデル</div>
                  <div className="font-mono">{latestAnalysis.model_version}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">プロンプトバージョン</div>
                  <div className="font-mono">{latestAnalysis.prompt_version}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">トークン使用量</div>
                  <div className="font-mono">{latestAnalysis.tokens_used.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">分析ID</div>
                  <div className="font-mono text-xs truncate">{latestAnalysis.id}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* No Analysis State */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">分析結果がありません</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              {assessment.status === 'completed'
                ? '検査は完了していますが、まだ分析が実行されていません。'
                : '検査が完了すると、自動的に分析が実行されます。'
              }
            </p>
            {assessment.status === 'completed' && (
              <Button className="mt-6">
                <RefreshCw className="mr-2 h-4 w-4" />
                分析を実行
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

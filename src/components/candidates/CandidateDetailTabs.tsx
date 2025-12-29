'use client';

// =====================================================
// Candidate Detail Tabs Component
// Tab-based layout for candidate detail page
// =====================================================

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Mail, Calendar, FileText, BarChart3, TrendingUp, TrendingDown, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { IssueAssessmentButton } from '@/components/candidates/IssueAssessmentButton';
import { AssessmentUrlDisplay } from '@/components/candidates/AssessmentUrlDisplay';
import { DomainRadarChart, ScoreBarChart } from '@/components/analysis';
import { DOMAIN_LABELS, DOMAIN_DESCRIPTIONS, type Domain } from '@/lib/analysis';
import { POSITIONS } from '@/lib/constants/positions';
import {
  assessmentStatusConfig,
  riskLevelConfig,
  getScoreTextClass,
  stateColors,
  type RiskLevel,
} from '@/lib/design-system';
import type { AssessmentStatus } from '@/types/database';
import type { JudgmentLevel, InterviewPoint } from '@/lib/analysis/judgment';

// Helper function to get position label
function getPositionLabel(value: string): string {
  const position = POSITIONS.find(p => p.value === value);
  return position?.label || value;
}

// Types
interface CandidateData {
  id: string;
  position: string;
  desiredPositions: string[];
  notes: string | null;
  createdAt: string;
  person: {
    id: string;
    name: string;
    email: string;
  };
}

interface AssessmentData {
  id: string;
  token: string;
  status: AssessmentStatus;
  expiresAt: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface AnalysisData {
  id: string;
  scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  summary: string | null;
  recommendation: string | null;
}

interface JudgmentData {
  level: JudgmentLevel;
  label: string;
  reasons: string[];
  bgColor: string;
  color: string;
}

interface CandidateDetailTabsProps {
  candidate: CandidateData;
  latestAssessment: AssessmentData | null;
  analysis: AnalysisData | null;
  overallScore: number | null;
  judgment: JudgmentData | null;
  interviewPoints: InterviewPoint[];
  organizationId: string;
  templateId: string | null;
  assessmentHistory: AssessmentData[];
}



function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getRiskLevel(domain: Domain, score: number): RiskLevel {
  if (domain === 'COG') {
    return score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  } else if (domain === 'VALID') {
    return score < 60 ? 'high' : score < 80 ? 'medium' : 'low';
  } else {
    return score < 50 ? 'high' : score < 70 ? 'medium' : 'low';
  }
}

export function CandidateDetailTabs({
  candidate,
  latestAssessment,
  analysis,
  overallScore,
  judgment,
  interviewPoints,
  organizationId,
  templateId,
  assessmentHistory,
}: CandidateDetailTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = searchParams.get('tab') || 'info';
  const hasActiveAssessment = latestAssessment &&
    (latestAssessment.status === 'pending' || latestAssessment.status === 'in_progress');
  const hasAnalysis = !!analysis;

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'info') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="info" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          基本情報
        </TabsTrigger>
        <TabsTrigger
          value="analysis"
          className="flex items-center gap-2"
          disabled={!hasAnalysis}
        >
          <BarChart3 className="h-4 w-4" />
          分析結果
          {!hasAnalysis && (
            <span className="text-xs text-muted-foreground ml-1">（未分析）</span>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Profile */}
      <TabsContent value="info" className="space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>プロファイル</CardTitle>
            <CardDescription>候補者の基本情報と応募内容</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Contact Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    連絡先
                  </p>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{candidate.person.email}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    登録日
                  </p>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateShort(candidate.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Application Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    希望職種
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.desiredPositions.length > 0 ? (
                      candidate.desiredPositions.map((pos) => (
                        <Badge key={pos} variant="secondary">
                          {getPositionLabel(pos)}
                        </Badge>
                      ))
                    ) : candidate.position ? (
                      <Badge variant="secondary">{getPositionLabel(candidate.position)}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">未設定</span>
                    )}
                  </div>
                </div>

                {candidate.notes && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      備考
                    </p>
                    <p className="text-sm text-muted-foreground">{candidate.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment Status Section */}
        <Card>
          <CardHeader>
            <CardTitle>検査状況</CardTitle>
            <CardDescription>
              {hasActiveAssessment
                ? '検査URLが発行されています'
                : latestAssessment?.status === 'completed'
                  ? '検査が完了しています'
                  : '検査URLを発行して候補者に送信してください'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasActiveAssessment ? (
              <div className="space-y-4">
                <AssessmentUrlDisplay token={latestAssessment.token} />
                <Separator />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">ステータス</p>
                    <Badge className={assessmentStatusConfig[latestAssessment.status].className} variant="secondary">
                      {assessmentStatusConfig[latestAssessment.status].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">発行日</p>
                    <p className="font-medium">{formatDateShort(latestAssessment.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">有効期限</p>
                    <p className="font-medium">{formatDateShort(latestAssessment.expiresAt)}</p>
                  </div>
                  {latestAssessment.startedAt && (
                    <div>
                      <p className="text-muted-foreground mb-1">開始日時</p>
                      <p className="font-medium">{formatDate(latestAssessment.startedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : latestAssessment?.status === 'completed' ? (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stateColors.success.light.bg}`}>
                    <CheckCircle className={`h-6 w-6 ${stateColors.success.light.text}`} />
                  </div>
                  <div>
                    <p className="font-medium">検査完了</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(latestAssessment.completedAt!)}
                    </p>
                  </div>
                </div>
                {hasAnalysis && (
                  <Button variant="default" onClick={() => handleTabChange('analysis')}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    分析結果を見る
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  検査URLが発行されていません
                </p>
                <IssueAssessmentButton
                  candidateId={candidate.id}
                  organizationId={organizationId}
                  templateId={templateId || undefined}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assessment History */}
        {assessmentHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>過去の検査</CardTitle>
              <CardDescription>過去に実施した検査の履歴</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assessmentHistory.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <Badge className={assessmentStatusConfig[assessment.status].className} variant="secondary">
                        {assessmentStatusConfig[assessment.status].label}
                      </Badge>
                      <div className="text-sm">
                        <p className="font-medium">入社前検査</p>
                        <p className="text-muted-foreground">
                          {formatDateShort(assessment.createdAt)}
                        </p>
                      </div>
                    </div>
                    {assessment.status === 'completed' && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/candidates/${candidate.id}?tab=analysis&assessment=${assessment.id}`}>
                          結果を見る
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Tab 2: Analysis Results */}
      <TabsContent value="analysis" className="space-y-6">
        {analysis && overallScore !== null && judgment ? (
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
                    <div className={`text-5xl font-bold mb-4 ${getScoreTextClass(overallScore)}`}>
                      {overallScore}%
                    </div>
                    <DomainRadarChart scores={analysis.scores} size="md" />
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
                  <ScoreBarChart scores={analysis.scores} orientation="horizontal" />
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
                    const score = analysis.scores[domain] || 0;
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className={`h-5 w-5 ${stateColors.success.light.text}`} />
                    強み
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className={`h-5 w-5 ${stateColors.warning.light.text}`} />
                    注意点
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Interview Points */}
            {interviewPoints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    面接のポイント
                  </CardTitle>
                  <CardDescription>
                    分析結果に基づく確認事項と質問例
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {interviewPoints.filter(p => p.type === 'strength').length > 0 && (
                      <div>
                        <p className={`text-sm font-medium mb-2 ${stateColors.success.light.text}`}>強みとして確認</p>
                        <div className="space-y-2">
                          {interviewPoints.filter(p => p.type === 'strength').map((point, i) => (
                            <div key={i} className={`rounded-lg p-3 ${stateColors.success.light.bg}`}>
                              <p className="text-sm font-medium">{point.domainLabel}</p>
                              <p className="text-sm text-muted-foreground">{point.point}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {interviewPoints.filter(p => p.type === 'confirm').length > 0 && (
                      <div>
                        <p className={`text-sm font-medium mb-2 ${stateColors.warning.light.text}`}>確認が必要</p>
                        <div className="space-y-2">
                          {interviewPoints.filter(p => p.type === 'confirm').map((point, i) => (
                            <div key={i} className={`rounded-lg p-3 ${stateColors.warning.light.bg}`}>
                              <p className="text-sm font-medium">{point.domainLabel}</p>
                              <p className="text-sm text-muted-foreground">{point.point}</p>
                              {point.suggestedQuestion && (
                                <p className="text-sm mt-2 text-amber-800 dark:text-amber-200">
                                  <span className="font-medium">質問例:</span> {point.suggestedQuestion}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary & Recommendation */}
            {analysis.summary && (
              <Card>
                <CardHeader>
                  <CardTitle>総合評価</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed">{analysis.summary}</p>
                </CardContent>
              </Card>
            )}

            {analysis.recommendation && (
              <Card>
                <CardHeader>
                  <CardTitle>採用推奨事項</CardTitle>
                  <CardDescription>面接での確認ポイント・採用判断へのアドバイス</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed">{analysis.recommendation}</p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <XCircle className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">分析結果がありません</h3>
              <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                {latestAssessment?.status === 'completed'
                  ? '検査は完了していますが、まだ分析が実行されていません。'
                  : '検査が完了すると、自動的に分析が実行されます。'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

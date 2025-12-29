'use client';

// =====================================================
// Analysis Results Client Component
// Handles tabs, history, and re-analyze functionality
// Supports both v1 (legacy) and v2 (enhanced) reports
// =====================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, CheckCircle, AlertTriangle, XCircle, Building2 } from 'lucide-react';
import { VersionBadge } from './VersionBadge';
import { AnalysisHistoryTable, type AnalysisHistoryItem } from './AnalysisHistoryTable';
import { ReanalyzeDialog } from './ReanalyzeDialog';
import { DomainRadarChart } from './DomainRadarChart';
import { ScoreBarChart } from './ScoreBarChart';
import { InterviewPoints } from './InterviewPoints';
import { EnhancedStrengthsCard } from './EnhancedStrengthsCard';
import { EnhancedWatchoutsCard } from './EnhancedWatchoutsCard';
import { RiskScenariosCard } from './RiskScenariosCard';
import { InterviewChecksCard } from './InterviewChecksCard';
import { ShareReportSection } from './ShareReportSection';
import { DOMAIN_LABELS, DOMAIN_DESCRIPTIONS, type Domain } from '@/lib/analysis';
import {
  riskLevelConfig,
  judgmentConfig,
  getScoreTextClass,
  stateColors,
  type JudgmentLevel,
  type RiskLevel,
} from '@/lib/design-system';
import { calculateJudgment, calculateOverallScore, generateInterviewPoints, type DomainScores } from '@/lib/analysis/judgment';
import type {
  EnhancedStrength,
  EnhancedWatchout,
  RiskScenario,
  InterviewCheck,
  CandidateReport,
} from '@/types/database';

// Analysis data type (supports both v1 and v2)
interface AnalysisData {
  id: string;
  scores: Record<string, number>;
  // Legacy fields (v1)
  strengths: string[];
  weaknesses: string[];
  // Enhanced fields (v2)
  enhanced_strengths?: EnhancedStrength[] | null;
  enhanced_watchouts?: EnhancedWatchout[] | null;
  risk_scenarios?: RiskScenario[] | null;
  interview_checks?: InterviewCheck[] | null;
  candidate_report?: CandidateReport | null;
  report_version?: 'v1' | 'v2';
  // Common fields
  summary: string | null;
  recommendation: string | null;
  model_version: string;
  prompt_version: string;
  tokens_used: number;
  version: number;
  is_latest: boolean;
  analyzed_at: string;
}

interface AnalysisResultsClientProps {
  assessmentId: string;
  initialAnalysis: AnalysisData | null;
  assessmentStatus: string;
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

export function AnalysisResultsClient({
  assessmentId,
  initialAnalysis,
  assessmentStatus,
}: AnalysisResultsClientProps) {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(initialAnalysis);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | undefined>(
    initialAnalysis?.version
  );
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('results');

  // AbortController for cancelling in-flight version requests (race condition prevention)
  const versionAbortControllerRef = useRef<AbortController | null>(null);

  // Cleanup: cancel in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (versionAbortControllerRef.current) {
        versionAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch history when tab changes
  const fetchHistory = useCallback(async () => {
    if (loadingHistory) return;
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/analysis/${assessmentId}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [assessmentId, loadingHistory]);

  useEffect(() => {
    if (activeTab === 'history' && history.length === 0 && currentAnalysis) {
      fetchHistory();
    }
  }, [activeTab, history.length, currentAnalysis, fetchHistory]);

  // Fetch specific version with race condition prevention
  const fetchVersion = useCallback(async (version: number) => {
    // Cancel any in-flight request to prevent race condition
    if (versionAbortControllerRef.current) {
      versionAbortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    versionAbortControllerRef.current = abortController;

    try {
      const response = await fetch(`/api/analysis/${assessmentId}/version/${version}`, {
        signal: abortController.signal,
      });

      // Check if request was aborted before processing response
      if (abortController.signal.aborted) {
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // Double-check abort status before updating state
        if (!abortController.signal.aborted) {
          setCurrentAnalysis(data);
          setSelectedVersion(version);
          setActiveTab('results');
        }
      }
    } catch (error) {
      // Ignore AbortError (expected when request is cancelled)
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Failed to fetch version:', error);
    }
  }, [assessmentId]);

  // Handle re-analyze complete
  const handleReanalyzeComplete = useCallback(
    async (result: { success: boolean; version?: number }) => {
      if (result.success && result.version) {
        await fetchVersion(result.version);
        await fetchHistory();
      }
    },
    [fetchVersion, fetchHistory]
  );

  // Handle version selection
  const handleSelectVersion = (version: number) => {
    fetchVersion(version);
  };

  // Handle PDF download for specific version
  const handleDownloadPdf = (version: number) => {
    window.open(`/api/analysis/pdf/${assessmentId}?version=${version}`, '_blank');
  };

  const overallScore = currentAnalysis ? calculateOverallScore(currentAnalysis.scores) : null;
  const judgment = currentAnalysis
    ? calculateJudgment(currentAnalysis.scores as unknown as DomainScores)
    : null;
  const interviewPoints = currentAnalysis
    ? generateInterviewPoints(currentAnalysis.scores as unknown as DomainScores)
    : [];

  // Check if enhanced (v2) analysis is available
  const isEnhanced = currentAnalysis?.report_version === 'v2' ||
    (currentAnalysis?.enhanced_strengths && currentAnalysis.enhanced_strengths.length > 0);
  const hasCandidateReport = currentAnalysis?.candidate_report != null;

  if (!currentAnalysis) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">分析結果がありません</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            {assessmentStatus === 'completed'
              ? '検査は完了していますが、まだ分析が実行されていません。'
              : '検査が完了すると、自動的に分析が実行されます。'}
          </p>
          {assessmentStatus === 'completed' && (
            <ReanalyzeDialog
              assessmentId={assessmentId}
              onReanalyzeComplete={handleReanalyzeComplete}
              trigger={
                <Button className="mt-6">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  分析を実行
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs for Results, Candidate Report, and History */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="results" className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              分析結果
            </TabsTrigger>
            <TabsTrigger value="history">履歴</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <VersionBadge
              version={currentAnalysis.version}
              isLatest={currentAnalysis.is_latest}
            />
            <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(currentAnalysis.version)}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <ReanalyzeDialog
              assessmentId={assessmentId}
              currentVersion={currentAnalysis.version}
              onReanalyzeComplete={handleReanalyzeComplete}
            />
          </div>
        </div>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {/* Score Overview with Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <Badge
                        className={`${judgmentConfig[judgment.level as JudgmentLevel].badgeClass} mb-2`}
                      >
                        {judgmentConfig[judgment.level as JudgmentLevel].label}
                      </Badge>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {judgment.reasons.map((reason, idx) => (
                          <li key={idx}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <DomainRadarChart scores={currentAnalysis.scores} size="md" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ドメイン別スコア</CardTitle>
                <CardDescription>6つの評価ドメインの比較</CardDescription>
              </CardHeader>
              <CardContent>
                <ScoreBarChart scores={currentAnalysis.scores} orientation="horizontal" />
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
                  const score = currentAnalysis.scores[domain] || 0;
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

          {/* Strengths and Weaknesses (v1 legacy or v2 enhanced) */}
          {isEnhanced && currentAnalysis.enhanced_strengths && currentAnalysis.enhanced_watchouts ? (
            <>
              {/* Enhanced version with evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EnhancedStrengthsCard strengths={currentAnalysis.enhanced_strengths} />
                <EnhancedWatchoutsCard watchouts={currentAnalysis.enhanced_watchouts} />
              </div>

              {/* Risk Scenarios (v2 only) */}
              {currentAnalysis.risk_scenarios && currentAnalysis.risk_scenarios.length > 0 && (
                <RiskScenariosCard scenarios={currentAnalysis.risk_scenarios} />
              )}

              {/* Interview Checks (v2 only) */}
              {currentAnalysis.interview_checks && currentAnalysis.interview_checks.length > 0 && (
                <InterviewChecksCard checks={currentAnalysis.interview_checks} />
              )}
            </>
          ) : (
            <>
              {/* Legacy v1 format */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className={`h-5 w-5 ${stateColors.success.light.text} ${stateColors.success.dark.text}`} />
                      強み
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {currentAnalysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: stateColors.success.hex }} />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className={`h-5 w-5 ${stateColors.warning.light.text} ${stateColors.warning.dark.text}`} />
                      注意点
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {currentAnalysis.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: stateColors.warning.hex }} />
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Interview Points (legacy) */}
              {interviewPoints.length > 0 && <InterviewPoints points={interviewPoints} />}
            </>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>総合評価</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">
                {currentAnalysis.summary || '総合評価が生成されていません。'}
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
                {currentAnalysis.recommendation || '推奨事項が生成されていません。'}
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
                  <div className="font-mono">{currentAnalysis.model_version}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">プロンプトバージョン</div>
                  <div className="font-mono">{currentAnalysis.prompt_version}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">トークン使用量</div>
                  <div className="font-mono">{currentAnalysis.tokens_used.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">分析ID</div>
                  <div className="font-mono text-xs truncate">{currentAnalysis.id}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>分析履歴</CardTitle>
              <CardDescription>
                過去の分析バージョンを確認できます。クリックで詳細を表示。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
              ) : (
                <AnalysisHistoryTable
                  assessmentId={assessmentId}
                  history={history}
                  selectedVersion={selectedVersion}
                  onSelectVersion={handleSelectVersion}
                  onDownloadPdf={handleDownloadPdf}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Share Report Section */}
      <ShareReportSection
        assessmentId={assessmentId}
        hasCandidateReport={hasCandidateReport}
      />
    </div>
  );
}

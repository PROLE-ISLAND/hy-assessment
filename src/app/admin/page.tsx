// =====================================================
// Admin Dashboard Page
// Overview of candidates and assessments with charts
// =====================================================

import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, ClipboardList, CheckCircle, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import {
  AssessmentTrendChart,
  ScoreDistributionChart,
  ActionRequiredSection,
  PipelineFunnel,
  HighlightCandidates,
} from '@/components/dashboard';
import { POSITIONS } from '@/lib/constants/positions';
import { pipelineColors, stateColors } from '@/lib/design-system';

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color?: string;
}

// Stat card color configuration using design system
const statCardColors = {
  blue: {
    gradient: `from-blue-50 to-white border-blue-100 ${stateColors.info.light.text}`,
    iconBg: stateColors.info.light.bg,
  },
  green: {
    gradient: `from-emerald-50 to-white border-emerald-100 ${stateColors.success.light.text}`,
    iconBg: stateColors.success.light.bg,
  },
  orange: {
    gradient: `from-amber-50 to-white border-amber-100 ${stateColors.warning.light.text}`,
    iconBg: stateColors.warning.light.bg,
  },
  purple: {
    gradient: `from-purple-50 to-white border-purple-100 ${stateColors.accent.light.text}`,
    iconBg: stateColors.accent.light.bg,
  },
} as const;

function StatCard({ title, value, description, icon, color = 'blue' }: StatCardProps) {
  const colorConfig = statCardColors[color as keyof typeof statCardColors] || statCardColors.blue;
  const colorClasses = colorConfig.gradient;
  const iconBgClasses = colorConfig.iconBg;

  return (
    <Card className={`bg-gradient-to-br ${colorClasses}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${iconBgClasses}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Helper to get date string in YYYY-MM-DD format
function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Helper to get short date format for chart
function formatDateLabel(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${parseInt(month)}/${parseInt(day)}`;
}

// Helper to calculate days remaining
function getDaysRemaining(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Helper to get position label
function getPositionLabel(value: string): string {
  const position = POSITIONS.find(p => p.value === value);
  return position?.label || value;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

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

  // Get counts for dashboard stats
  const [
    { count: candidatesCount },
    { count: assessmentsCount },
    { count: completedCount },
    { count: pendingCount },
  ] = await Promise.all([
    adminSupabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId || '')
      .is('deleted_at', null),
    adminSupabase
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId || '')
      .is('deleted_at', null),
    adminSupabase
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId || '')
      .eq('status', 'completed')
      .is('deleted_at', null),
    adminSupabase
      .from('assessments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId || '')
      .in('status', ['pending', 'in_progress'])
      .is('deleted_at', null),
  ]);

  // === ACTION REQUIRED DATA ===

  // Get expiring assessments (within 3 days)
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  interface ExpiringAssessment {
    id: string;
    expires_at: string;
    candidates: {
      id: string;
      persons: { name: string };
    };
  }

  const { data: expiringAssessments } = await adminSupabase
    .from('assessments')
    .select(`
      id,
      expires_at,
      candidates!inner(
        id,
        persons!inner(name)
      )
    `)
    .eq('organization_id', organizationId || '')
    .in('status', ['pending', 'in_progress'])
    .lte('expires_at', threeDaysFromNow.toISOString())
    .gte('expires_at', new Date().toISOString())
    .is('deleted_at', null)
    .order('expires_at', { ascending: true })
    .limit(10)
    .returns<ExpiringAssessment[]>();

  const expiringItems = (expiringAssessments || []).map(a => ({
    assessmentId: a.id,
    candidateId: a.candidates.id,
    candidateName: a.candidates.persons.name,
    daysRemaining: getDaysRemaining(a.expires_at),
  }));

  // Get assessments needing analysis (completed but no ai_analysis)
  interface NeedsAnalysisAssessment {
    id: string;
    completed_at: string;
    candidates: {
      id: string;
      persons: { name: string };
    };
  }

  const { data: needsAnalysisAssessments } = await adminSupabase
    .from('assessments')
    .select(`
      id,
      completed_at,
      candidates!inner(
        id,
        persons!inner(name)
      )
    `)
    .eq('organization_id', organizationId || '')
    .eq('status', 'completed')
    .is('deleted_at', null)
    .order('completed_at', { ascending: false })
    .limit(20)
    .returns<NeedsAnalysisAssessment[]>();

  // Filter out those that already have analysis
  const assessmentIds = (needsAnalysisAssessments || []).map(a => a.id);
  const { data: existingAnalyses } = await adminSupabase
    .from('ai_analyses')
    .select('assessment_id')
    .in('assessment_id', assessmentIds.length > 0 ? assessmentIds : [''])
    .eq('is_latest', true)
    .returns<{ assessment_id: string }[]>();

  const analyzedIds = new Set((existingAnalyses || []).map(a => a.assessment_id));
  const needsAnalysisItems = (needsAnalysisAssessments || [])
    .filter(a => !analyzedIds.has(a.id))
    .slice(0, 10)
    .map(a => ({
      assessmentId: a.id,
      candidateId: a.candidates.id,
      candidateName: a.candidates.persons.name,
      completedAt: a.completed_at,
    }));

  // === PIPELINE DATA ===

  // Count candidates without assessments
  const { data: candidatesWithAssessments } = await adminSupabase
    .from('candidates')
    .select('id, assessments(id)')
    .eq('organization_id', organizationId || '')
    .is('deleted_at', null)
    .returns<{ id: string; assessments: { id: string }[] }[]>();

  const noAssessmentCount = (candidatesWithAssessments || []).filter(
    c => !c.assessments || c.assessments.length === 0
  ).length;

  const { count: inProgressCount } = await adminSupabase
    .from('assessments')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId || '')
    .eq('status', 'in_progress')
    .is('deleted_at', null);

  const { count: analyzedCount } = await adminSupabase
    .from('ai_analyses')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId || '')
    .eq('is_latest', true);

  const pipelineStages = [
    { label: '未検査', count: noAssessmentCount, color: pipelineColors.noAssessment },
    { label: '回答中', count: inProgressCount || 0, color: pipelineColors.inProgress },
    { label: '完了', count: (completedCount || 0) - (analyzedCount || 0), color: pipelineColors.completed },
    { label: '分析済', count: analyzedCount || 0, color: pipelineColors.analyzed },
  ];

  // === HIGHLIGHT CANDIDATES DATA ===

  interface AnalysisWithCandidate {
    scores: Record<string, number>;
    assessments: {
      candidates: {
        id: string;
        position: string;
        persons: { name: string };
      };
    };
  }

  const { data: allAnalyses } = await adminSupabase
    .from('ai_analyses')
    .select(`
      scores,
      assessments!inner(
        candidates!inner(
          id,
          position,
          persons!inner(name)
        )
      )
    `)
    .eq('organization_id', organizationId || '')
    .eq('is_latest', true)
    .returns<AnalysisWithCandidate[]>();

  // Calculate high performers (overall >= 80%)
  const scorableDomains = ['GOV', 'CONFLICT', 'REL', 'COG', 'WORK'];
  const highPerformers = (allAnalyses || [])
    .map(a => {
      const total = scorableDomains.reduce((sum, d) => sum + (a.scores[d] || 0), 0);
      const overall = Math.round(total / scorableDomains.length);
      return {
        candidateId: a.assessments.candidates.id,
        name: a.assessments.candidates.persons.name,
        overallScore: overall,
        position: getPositionLabel(a.assessments.candidates.position || ''),
      };
    })
    .filter(c => c.overallScore >= 80)
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 5);

  // Find candidates needing attention (COG > 60% or VALID < 60%)
  const needsAttention = (allAnalyses || [])
    .map(a => {
      const cog = a.scores['COG'] || 0;
      const valid = a.scores['VALID'] || 0;

      if (cog > 60) {
        return {
          candidateId: a.assessments.candidates.id,
          name: a.assessments.candidates.persons.name,
          reason: 'COG高め',
          detail: `${cog}%`,
        };
      }
      if (valid < 60) {
        return {
          candidateId: a.assessments.candidates.id,
          name: a.assessments.candidates.persons.name,
          reason: 'VALID低め',
          detail: `${valid}%`,
        };
      }
      return null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .slice(0, 5);

  // === TREND DATA ===

  const trendDays = 14;
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - trendDays + 1);

  interface RecentAssessment {
    started_at: string | null;
    completed_at: string | null;
  }

  const { data: recentAssessments } = await adminSupabase
    .from('assessments')
    .select('started_at, completed_at')
    .eq('organization_id', organizationId || '')
    .is('deleted_at', null)
    .gte('created_at', startDate.toISOString())
    .returns<RecentAssessment[]>();

  const trendData: { date: string; completed: number; started: number }[] = [];
  for (let i = 0; i < trendDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = formatDateKey(date);

    const completed = recentAssessments?.filter(a =>
      a.completed_at && formatDateKey(new Date(a.completed_at)) === dateKey
    ).length || 0;

    const started = recentAssessments?.filter(a =>
      a.started_at && formatDateKey(new Date(a.started_at)) === dateKey
    ).length || 0;

    trendData.push({
      date: formatDateLabel(dateKey),
      completed,
      started,
    });
  }

  // === SCORE DISTRIBUTION DATA ===

  interface AnalysisScore {
    scores: Record<string, number>;
  }

  const { data: analyses } = await adminSupabase
    .from('ai_analyses')
    .select('scores')
    .eq('organization_id', organizationId || '')
    .eq('is_latest', true)
    .returns<AnalysisScore[]>();

  const scoreRanges = [
    { range: '0-20', min: 0, max: 20, count: 0 },
    { range: '21-40', min: 21, max: 40, count: 0 },
    { range: '41-60', min: 41, max: 60, count: 0 },
    { range: '61-80', min: 61, max: 80, count: 0 },
    { range: '81-100', min: 81, max: 100, count: 0 },
  ];

  analyses?.forEach(analysis => {
    const scores = analysis.scores;
    const total = scorableDomains.reduce((sum, domain) => sum + (scores[domain] || 0), 0);
    const overall = Math.round(total / scorableDomains.length);

    const range = scoreRanges.find(r => overall >= r.min && overall <= r.max);
    if (range) range.count++;
  });

  const distributionData = scoreRanges.map(r => ({
    range: r.range,
    count: r.count,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">
          検査システムの概要
        </p>
      </div>

      {/* Action Required Section */}
      <ActionRequiredSection
        expiringItems={expiringItems}
        needsAnalysisItems={needsAnalysisItems}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="候補者数"
          value={candidatesCount ?? 0}
          description="登録済み候補者"
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="検査数"
          value={assessmentsCount ?? 0}
          description="全検査"
          icon={<ClipboardList className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          title="完了"
          value={completedCount ?? 0}
          description="完了した検査"
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="未完了"
          value={pendingCount ?? 0}
          description="回答待ち"
          icon={<Clock className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Pipeline and Highlights */}
      <div className="grid gap-6 md:grid-cols-2">
        <PipelineFunnel stages={pipelineStages} />
        <HighlightCandidates
          highPerformers={highPerformers}
          needsAttention={needsAttention}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              検査推移（直近14日間）
            </CardTitle>
            <CardDescription>
              検査の開始数と完了数の推移
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssessmentTrendChart data={trendData} />
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stateColors.info.hex }} />
                <span className="text-muted-foreground">開始</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stateColors.success.hex }} />
                <span className="text-muted-foreground">完了</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              スコア分布
            </CardTitle>
            <CardDescription>
              総合スコアの分布（5ドメイン平均）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreDistributionChart data={distributionData} />
            <div className="flex justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded" style={{ backgroundColor: stateColors.error.hex }} />
                <span className="text-muted-foreground">低</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded" style={{ backgroundColor: stateColors.warning.hex }} />
                <span className="text-muted-foreground">中</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded" style={{ backgroundColor: stateColors.success.hex }} />
                <span className="text-muted-foreground">高</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {(candidatesCount ?? 0) === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>HY Assessmentへようこそ</CardTitle>
            <CardDescription>
              最初の候補者を登録して始めましょう。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              候補者の登録、検査の作成、結果の確認ができます。
              サイドバーから各機能にアクセスしてください。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

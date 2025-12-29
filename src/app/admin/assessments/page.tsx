// =====================================================
// Assessments List Page
// List of all completed assessments with analysis status
// Uses design system for consistent styling
// =====================================================

import Link from 'next/link';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3 } from 'lucide-react';
import { assessmentStatusConfig, getScoreTextClass } from '@/lib/design-system';
import { calculateOverallScore } from '@/lib/analysis/judgment';
import type { AssessmentStatus } from '@/types/database';

// Type for the query result
interface AssessmentWithRelations {
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
    analyzed_at: string;
    is_latest: boolean;
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

export default async function AssessmentsListPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's organization (using admin client to bypass RLS)
  let organizationId: string | null = null;
  if (user) {
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single<{ organization_id: string }>();
    organizationId = dbUser?.organization_id || null;
  }

  // Get assessments with relations (using admin client + org filter)
  const { data: assessments, error } = await adminSupabase
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
        analyzed_at,
        is_latest
      )
    `)
    .is('deleted_at', null)
    .eq('organization_id', organizationId || '')
    .order('created_at', { ascending: false })
    .returns<AssessmentWithRelations[]>();

  const isEmpty = !assessments || assessments.length === 0 || !organizationId;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">検査結果</h1>
          <p className="text-muted-foreground">
            すべての検査結果と分析状況を確認
          </p>
        </div>
      </div>

      {/* Assessments Table */}
      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">検査結果がありません</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              候補者が検査を完了すると、ここに結果が表示されます。
            </p>
            <Button asChild className="mt-6">
              <Link href="/admin/candidates">
                候補者管理へ
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>検査結果一覧</CardTitle>
            <CardDescription>
              {assessments.length}件の検査
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>候補者</TableHead>
                  <TableHead>応募職種</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>分析状況</TableHead>
                  <TableHead>総合スコア</TableHead>
                  <TableHead>検査日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => {
                  const latestAnalysis = assessment.ai_analyses?.find(a => a.is_latest);
                  const overallScore = latestAnalysis
                    ? calculateOverallScore(latestAnalysis.scores)
                    : null;
                  const hasAnalysis = !!latestAnalysis;

                  return (
                    <TableRow key={assessment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {assessment.candidates?.persons?.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {assessment.candidates?.persons?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{assessment.candidates?.position}</TableCell>
                      <TableCell>
                        <Badge className={assessmentStatusConfig[assessment.status].className} variant="secondary">
                          {assessmentStatusConfig[assessment.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assessment.status === 'completed' ? (
                          hasAnalysis ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" variant="secondary">
                              分析完了
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" variant="secondary">
                              分析待ち
                            </Badge>
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {overallScore !== null ? (
                          <span className={`font-semibold ${getScoreTextClass(overallScore)}`}>
                            {overallScore}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(assessment.completed_at || assessment.started_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/assessments/${assessment.id}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            詳細
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

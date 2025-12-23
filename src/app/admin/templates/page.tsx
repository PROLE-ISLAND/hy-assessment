// =====================================================
// Templates Management Page
// List of all assessment templates with version info
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
import { FileText, Eye, CheckCircle, XCircle } from 'lucide-react';

// Type for template with relations
interface TemplateWithRelations {
  id: string;
  name: string;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  questions: {
    pages?: Array<{
      elements?: unknown[];
    }>;
  };
  assessment_types: {
    name: string;
    code: string;
  } | null;
  _count?: {
    assessments: number;
  };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function countQuestions(questions: TemplateWithRelations['questions']): number {
  if (!questions?.pages) return 0;
  return questions.pages.reduce((total, page) => {
    return total + (page.elements?.length || 0);
  }, 0);
}

export default async function TemplatesPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's organization
  let organizationId: string | null = null;
  if (user) {
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single<{ organization_id: string }>();
    organizationId = dbUser?.organization_id || null;
  }

  // Get templates with type info
  const { data: templates, error } = await adminSupabase
    .from('assessment_templates')
    .select(`
      id,
      name,
      version,
      is_active,
      created_at,
      updated_at,
      questions,
      assessment_types(
        name,
        code
      )
    `)
    .eq('organization_id', organizationId || '')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .returns<TemplateWithRelations[]>();

  // Get assessment counts per template
  interface AssessmentTemplateCount {
    template_id: string;
  }

  const { data: assessmentCounts } = await adminSupabase
    .from('assessments')
    .select('template_id')
    .eq('organization_id', organizationId || '')
    .is('deleted_at', null)
    .returns<AssessmentTemplateCount[]>();

  // Count assessments per template
  const templateCounts: Record<string, number> = {};
  assessmentCounts?.forEach(a => {
    templateCounts[a.template_id] = (templateCounts[a.template_id] || 0) + 1;
  });

  const isEmpty = !templates || templates.length === 0 || !organizationId;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">テンプレート</h1>
          <p className="text-muted-foreground">
            検査テンプレートの管理とバージョン確認
          </p>
        </div>
      </div>

      {/* Templates Table */}
      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">テンプレートがありません</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              検査テンプレートが登録されていません。
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>テンプレート一覧</CardTitle>
            <CardDescription>
              {templates.length}件のテンプレート
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>テンプレート名</TableHead>
                  <TableHead>タイプ</TableHead>
                  <TableHead>バージョン</TableHead>
                  <TableHead>質問数</TableHead>
                  <TableHead>使用回数</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>更新日</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => {
                  const questionCount = countQuestions(template.questions);
                  const usageCount = templateCounts[template.id] || 0;

                  return (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{template.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.assessment_types ? (
                          <Badge variant="outline">
                            {template.assessment_types.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                          {template.version}
                        </code>
                      </TableCell>
                      <TableCell>{questionCount}問</TableCell>
                      <TableCell>{usageCount}回</TableCell>
                      <TableCell>
                        {template.is_active ? (
                          <Badge className="bg-green-100 text-green-800" variant="secondary">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            有効
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800" variant="secondary">
                            <XCircle className="mr-1 h-3 w-3" />
                            無効
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(template.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/templates/${template.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
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

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>テンプレートについて</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            検査テンプレートは、候補者に実施する検査の質問セットを定義します。
          </p>
          <p>
            現在、システムには「GFD-Gate v1」テンプレートが標準で含まれています。
            このテンプレートは6つの評価ドメイン（ガバナンス適合、対立処理、対人態度、認知スタイル、業務遂行、妥当性）を測定します。
          </p>
          <p>
            カスタムテンプレートの作成機能は今後のアップデートで追加予定です。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

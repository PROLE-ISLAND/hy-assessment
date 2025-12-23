// =====================================================
// Template Detail Page
// Shows template info, questions, version history
// =====================================================

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Calendar, Hash, Users, Edit, Copy, History } from 'lucide-react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TemplateStatusToggle } from '@/components/templates/TemplateStatusToggle';
import { CreateVersionButton } from '@/components/templates/CreateVersionButton';

// Type for template detail
interface TemplateDetail {
  id: string;
  name: string;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  questions: {
    title?: string;
    pages?: Array<{
      name?: string;
      title?: string;
      elements?: Array<{
        name: string;
        type: string;
        title?: string;
      }>;
    }>;
  };
  assessment_types: {
    id: string;
    name: string;
    code: string;
  } | null;
}

// Type for version history
interface TemplateVersion {
  id: string;
  version: string;
  is_active: boolean;
  created_at: string;
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

function countQuestions(questions: TemplateDetail['questions']): number {
  if (!questions?.pages) return 0;
  return questions.pages.reduce((total, page) => {
    return total + (page.elements?.length || 0);
  }, 0);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get current user
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

  // Get template detail
  const { data: template, error } = await adminSupabase
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
        id,
        name,
        code
      )
    `)
    .eq('id', id)
    .eq('organization_id', dbUser.organization_id)
    .is('deleted_at', null)
    .single<TemplateDetail>();

  if (error || !template) {
    notFound();
  }

  // Get version history (same name, different versions)
  const { data: versions } = await adminSupabase
    .from('assessment_templates')
    .select('id, version, is_active, created_at')
    .eq('organization_id', dbUser.organization_id)
    .eq('name', template.name)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .returns<TemplateVersion[]>();

  // Get usage count
  interface AssessmentCount {
    template_id: string;
  }
  const { data: assessments } = await adminSupabase
    .from('assessments')
    .select('template_id')
    .eq('template_id', id)
    .is('deleted_at', null)
    .returns<AssessmentCount[]>();

  const usageCount = assessments?.length || 0;
  const questionCount = countQuestions(template.questions);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/templates">
          <ArrowLeft className="mr-2 h-4 w-4" />
          テンプレート一覧に戻る
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {template.name}
            </h1>
            <Badge variant="outline" className="text-sm">
              v{template.version}
            </Badge>
            {template.is_active ? (
              <Badge className="bg-green-100 text-green-800">有効</Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-800">無効</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {template.assessment_types?.name || '未分類'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/templates/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              編集
            </Link>
          </Button>
          <CreateVersionButton
            templateId={id}
            templateName={template.name}
            currentVersion={template.version}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Basic Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">質問数</div>
                  <div className="font-medium">{questionCount}問</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">使用回数</div>
                  <div className="font-medium">{usageCount}回</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">作成日</div>
                  <div className="font-medium">{formatDateShort(template.created_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">更新日</div>
                  <div className="font-medium">{formatDateShort(template.updated_at)}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Status Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">ステータス</div>
                <div className="text-sm text-muted-foreground">
                  このテンプレートを新規検査で使用可能にする
                </div>
              </div>
              <TemplateStatusToggle
                templateId={id}
                isActive={template.is_active}
              />
            </div>
          </CardContent>
        </Card>

        {/* Version History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              バージョン履歴
            </CardTitle>
          </CardHeader>
          <CardContent>
            {versions && versions.length > 0 ? (
              <div className="space-y-2">
                {versions.map((ver) => (
                  <Link
                    key={ver.id}
                    href={`/admin/templates/${ver.id}`}
                    className={`block p-2 rounded-md hover:bg-muted transition-colors ${
                      ver.id === id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                          v{ver.version}
                        </code>
                        {ver.is_active && (
                          <Badge variant="secondary" className="text-xs">有効</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateShort(ver.created_at)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                バージョン履歴がありません
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Questions Preview */}
      <Card>
        <CardHeader>
          <CardTitle>質問一覧</CardTitle>
          <CardDescription>
            {template.questions?.title || 'このテンプレートに含まれる質問'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {template.questions?.pages && template.questions.pages.length > 0 ? (
            <div className="space-y-6">
              {template.questions.pages.map((page, pageIndex) => (
                <div key={pageIndex}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">ページ {pageIndex + 1}</Badge>
                    {page.title && (
                      <span className="text-sm font-medium">{page.title}</span>
                    )}
                  </div>
                  <div className="space-y-2 pl-4 border-l-2 border-muted">
                    {page.elements?.map((element, elementIndex) => (
                      <div
                        key={elementIndex}
                        className="flex items-start gap-3 py-2"
                      >
                        <span className="text-xs text-muted-foreground font-mono w-8">
                          Q{elementIndex + 1}
                        </span>
                        <div className="flex-1">
                          <div className="text-sm">
                            {element.title || element.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            タイプ: {element.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              質問が設定されていません
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

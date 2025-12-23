// =====================================================
// Prompt Detail Page
// View prompt content and settings
// =====================================================

import Link from 'next/link';
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
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  XCircle,
  Copy,
  Trash2,
  Play,
} from 'lucide-react';
import type { PromptTemplate, PromptKey } from '@/types/database';
import { PromptActions } from '@/components/prompts/PromptActions';

// Labels for prompt keys
const PROMPT_KEY_LABELS: Record<PromptKey, string> = {
  system: 'システムプロンプト',
  analysis_user: '分析ユーザープロンプト',
  judgment: '判定ルール',
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PromptDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PromptDetailPage({ params }: PromptDetailPageProps) {
  const { id } = await params;
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

  // Get prompt
  const { data: prompt } = await adminSupabase
    .from('prompt_templates')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single<PromptTemplate>();

  if (!prompt) {
    notFound();
  }

  // Check if user can edit (org-specific prompts only)
  const canEdit = prompt.organization_id !== null && prompt.organization_id === organizationId;
  const isSystemPrompt = prompt.organization_id === null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/prompts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{prompt.name}</h1>
            <p className="text-muted-foreground">
              {prompt.description || PROMPT_KEY_LABELS[prompt.key]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSystemPrompt ? (
            <Button asChild>
              <Link href={`/admin/prompts/new?copy=${prompt.id}`}>
                <Copy className="mr-2 h-4 w-4" />
                複製して編集
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href={`/admin/prompts/${prompt.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  編集
                </Link>
              </Button>
              <PromptActions prompt={prompt} />
            </>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ステータス
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prompt.is_active ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" variant="secondary">
                <CheckCircle className="mr-1 h-3 w-3" />
                有効
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" variant="secondary">
                <XCircle className="mr-1 h-3 w-3" />
                無効
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              バージョン
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-lg font-mono">{prompt.version}</code>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              モデル
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-lg font-mono">{prompt.model}</code>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ソース
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSystemPrompt ? (
              <Badge variant="outline">システム共通</Badge>
            ) : (
              <Badge variant="secondary">組織固有</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prompt Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>プロンプト内容</CardTitle>
              <CardDescription>
                AI分析で使用されるプロンプトテキスト
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/prompts/${prompt.id}/test`}>
                <Play className="mr-2 h-4 w-4" />
                テスト実行
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap font-mono">
            {prompt.content}
          </pre>
        </CardContent>
      </Card>

      {/* AI Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>AIパラメータ</CardTitle>
          <CardDescription>
            OpenAI API呼び出し時のパラメータ設定
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Temperature</p>
              <p className="text-lg font-mono">{prompt.temperature}</p>
              <p className="text-xs text-muted-foreground mt-1">
                低いほど一貫性が高く、高いほど創造的
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Max Tokens</p>
              <p className="text-lg font-mono">{prompt.max_tokens}</p>
              <p className="text-xs text-muted-foreground mt-1">
                出力の最大トークン数
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">モデル</p>
              <p className="text-lg font-mono">{prompt.model}</p>
              <p className="text-xs text-muted-foreground mt-1">
                使用するOpenAIモデル
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>メタデータ</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">作成日時</p>
            <p>{formatDate(prompt.created_at)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">更新日時</p>
            <p>{formatDate(prompt.updated_at)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">プロンプトID</p>
            <code className="text-sm bg-muted px-1.5 py-0.5 rounded">{prompt.id}</code>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">プロンプトキー</p>
            <code className="text-sm bg-muted px-1.5 py-0.5 rounded">{prompt.key}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

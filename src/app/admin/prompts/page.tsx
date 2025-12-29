// =====================================================
// Prompts Management Page
// List of all AI prompts with version info
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
import {
  MessageSquareCode,
  Eye,
  CheckCircle,
  XCircle,
  Plus,
  Copy,
  Bot,
} from 'lucide-react';
import type { PromptTemplate, PromptKey } from '@/types/database';
import { stateColors } from '@/lib/design-system';

// Labels for prompt keys
const PROMPT_KEY_LABELS: Record<PromptKey, string> = {
  system: 'システムプロンプト',
  analysis_user: '分析ユーザープロンプト',
  judgment: '判定ルール',
  candidate: '候補者版プロンプト',
};

// Badge colors for prompt keys using design system
const PROMPT_KEY_COLORS: Record<PromptKey, string> = {
  system: stateColors.info.combined,
  analysis_user: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  judgment: stateColors.warning.combined,
  candidate: stateColors.success.combined,
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export default async function PromptsPage() {
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

  // Get prompts (both system-wide and org-specific)
  const { data: prompts } = await adminSupabase
    .from('prompt_templates')
    .select('*')
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .is('deleted_at', null)
    .order('key', { ascending: true })
    .order('is_active', { ascending: false })
    .order('created_at', { ascending: false })
    .returns<PromptTemplate[]>();

  const isEmpty = !prompts || prompts.length === 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">プロンプト管理</h1>
          <p className="text-muted-foreground">
            AI分析で使用するプロンプトの管理とバージョン確認
          </p>
        </div>
        <Button asChild data-testid="prompt-create-button">
          <Link href="/admin/prompts/new">
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      {/* Prompts List */}
      {isEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquareCode className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">プロンプトがありません</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              AI分析用のプロンプトが登録されていません。
              システムデフォルトのプロンプトがまだ設定されていない可能性があります。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Prompts Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            {(['system', 'analysis_user', 'judgment'] as PromptKey[]).map((key) => {
              const activePrompt = prompts?.find(p => p.key === key && p.is_active);
              return (
                <Card key={key}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {PROMPT_KEY_LABELS[key]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activePrompt ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-primary" />
                          <span className="font-medium">{activePrompt.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                            {activePrompt.version}
                          </code>
                          <span>•</span>
                          <span>{activePrompt.model}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        有効なプロンプトがありません
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Prompts Table */}
          <Card>
            <CardHeader>
              <CardTitle>プロンプト一覧</CardTitle>
              <CardDescription>
                {prompts.length}件のプロンプト（システム共通 + 組織固有）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>プロンプト名</TableHead>
                    <TableHead>タイプ</TableHead>
                    <TableHead>バージョン</TableHead>
                    <TableHead>モデル</TableHead>
                    <TableHead>ソース</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>更新日</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prompts.map((prompt) => (
                    <TableRow key={prompt.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MessageSquareCode className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{prompt.name}</span>
                            {prompt.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {truncateText(prompt.description, 50)}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={PROMPT_KEY_COLORS[prompt.key]} variant="secondary">
                          {PROMPT_KEY_LABELS[prompt.key]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                          {prompt.version}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                          {prompt.model}
                        </code>
                      </TableCell>
                      <TableCell>
                        {prompt.organization_id === null ? (
                          <Badge variant="outline">システム共通</Badge>
                        ) : (
                          <Badge variant="secondary">組織固有</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {prompt.is_active ? (
                          <Badge className={stateColors.success.combined} variant="secondary">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            有効
                          </Badge>
                        ) : (
                          <Badge className={stateColors.neutral.combined} variant="secondary">
                            <XCircle className="mr-1 h-3 w-3" />
                            無効
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(prompt.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild data-testid={`prompt-detail-${prompt.id}`}>
                            <Link href={`/admin/prompts/${prompt.id}`}>
                              <Eye className="mr-1 h-4 w-4" />
                              詳細
                            </Link>
                          </Button>
                          {prompt.is_default && (
                            <Button variant="ghost" size="sm" asChild data-testid={`prompt-copy-${prompt.id}`}>
                              <Link href={`/admin/prompts/new?copy=${prompt.id}`}>
                                <Copy className="mr-1 h-4 w-4" />
                                複製
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>プロンプト管理について</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            プロンプトは、AI分析の品質を決定する重要な設定です。
            システム共通のデフォルトプロンプトをベースに、組織固有のカスタマイズが可能です。
          </p>
          <p>
            <strong>システムプロンプト:</strong> AIの役割と振る舞いを定義します。
          </p>
          <p>
            <strong>分析ユーザープロンプト:</strong> 候補者データをどのように分析するかを指示します。
          </p>
          <p>
            <strong>判定ルール:</strong> スコアから採用推奨度を判定するロジックを定義します。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

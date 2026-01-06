'use client';

// =====================================================
// Prompt Preview Component
// Shows prompt with sample data applied
// Variants: Default, Loading, Empty, Error
// =====================================================

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, FileText, RefreshCw } from 'lucide-react';

interface PromptPreviewProps {
  content: string;
  sampleData?: Record<string, string>;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

// Default sample data for preview
const DEFAULT_SAMPLE_DATA: Record<string, string> = {
  candidate_name: '山田 太郎',
  assessment_type: '適性検査',
  responses: JSON.stringify(
    {
      questions: [
        { id: 'q1', answer: 'はい', score: 4 },
        { id: 'q2', answer: 'いいえ', score: 2 },
      ],
    },
    null,
    2
  ),
  position: 'エンジニア',
  company_name: 'サンプル株式会社',
  date: new Date().toLocaleDateString('ja-JP'),
};

// Variable pattern: {{variable_name}}
const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

// Loading Skeleton Component
function PromptPreviewSkeleton() {
  return (
    <div className="space-y-4" data-testid="prompt-preview-skeleton">
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    </div>
  );
}

// Empty State Component
function PromptPreviewEmpty() {
  return (
    <Card data-testid="prompt-preview-empty">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">プロンプト内容がありません</h3>
        <p className="text-sm text-muted-foreground text-center">
          編集タブでプロンプト内容を入力してください
        </p>
      </CardContent>
    </Card>
  );
}

// Error State Component
function PromptPreviewError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry?: () => void;
}) {
  return (
    <Card data-testid="prompt-preview-error">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">プレビューの読み込みに失敗しました</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {error.message || 'エラーが発生しました'}
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            再試行
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function PromptPreview({
  content,
  sampleData = DEFAULT_SAMPLE_DATA,
  isLoading,
  error,
  onRetry,
}: PromptPreviewProps) {
  // All hooks must be called before any early returns
  // Extract all variables from content
  const variables = useMemo(() => {
    if (!content) return [];
    const matches = [...content.matchAll(VARIABLE_PATTERN)];
    return [...new Set(matches.map((m) => m[1].trim()))];
  }, [content]);

  // Apply sample data to content
  const previewContent = useMemo(() => {
    if (!content) return '';
    let result = content;
    for (const [key, value] of Object.entries(sampleData)) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(pattern, value);
    }
    return result;
  }, [content, sampleData]);

  // Check which variables are resolved
  const unresolvedVariables = useMemo(() => {
    if (!previewContent) return [];
    const matches = [...previewContent.matchAll(VARIABLE_PATTERN)];
    return [...new Set(matches.map((m) => m[1].trim()))];
  }, [previewContent]);

  const resolvedVariables = variables.filter(
    (v) => !unresolvedVariables.includes(v)
  );

  // Handle loading state
  if (isLoading) {
    return <PromptPreviewSkeleton />;
  }

  // Handle error state
  if (error) {
    return <PromptPreviewError error={error} onRetry={onRetry} />;
  }

  // Handle empty state
  if (!content || content.trim() === '') {
    return <PromptPreviewEmpty />;
  }

  return (
    <div className="space-y-4" data-testid="prompt-preview">
      {/* Variable Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">利用可能な変数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {variables.length === 0 ? (
              <span className="text-sm text-muted-foreground">
                変数は使用されていません
              </span>
            ) : (
              variables.map((variable) => {
                const isResolved = resolvedVariables.includes(variable);
                return (
                  <Badge
                    key={variable}
                    variant={isResolved ? 'default' : 'secondary'}
                    className={
                      isResolved
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }
                  >
                    {isResolved ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <AlertCircle className="mr-1 h-3 w-3" />
                    )}
                    {`{{${variable}}}`}
                  </Badge>
                );
              })
            )}
          </div>
          {unresolvedVariables.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              未解決の変数はサンプルデータに含まれていません
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview Content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            プレビュー（サンプルデータ適用後）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre
            className="bg-muted p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto"
            data-testid="prompt-preview-content"
          >
            {previewContent}
          </pre>
        </CardContent>
      </Card>

      {/* Sample Data Reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            サンプルデータ（プレビュー用）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {Object.entries(sampleData).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                  {`{{${key}}}`}
                </code>
                <span className="text-muted-foreground">→</span>
                <span className="truncate max-w-[300px]" title={value}>
                  {value.length > 50 ? `${value.slice(0, 50)}...` : value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

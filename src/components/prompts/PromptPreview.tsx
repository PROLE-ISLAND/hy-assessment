'use client';

// =====================================================
// Prompt Preview Component
// Shows prompt with sample data applied
// =====================================================

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface PromptPreviewProps {
  content: string;
  sampleData?: Record<string, string>;
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

export function PromptPreview({
  content,
  sampleData = DEFAULT_SAMPLE_DATA,
}: PromptPreviewProps) {
  // Extract all variables from content
  const variables = useMemo(() => {
    const matches = [...content.matchAll(VARIABLE_PATTERN)];
    return [...new Set(matches.map((m) => m[1].trim()))];
  }, [content]);

  // Apply sample data to content
  const previewContent = useMemo(() => {
    let result = content;
    for (const [key, value] of Object.entries(sampleData)) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(pattern, value);
    }
    return result;
  }, [content, sampleData]);

  // Check which variables are resolved
  const unresolvedVariables = useMemo(() => {
    const matches = [...previewContent.matchAll(VARIABLE_PATTERN)];
    return [...new Set(matches.map((m) => m[1].trim()))];
  }, [previewContent]);

  const resolvedVariables = variables.filter(
    (v) => !unresolvedVariables.includes(v)
  );

  return (
    <div className="space-y-4">
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

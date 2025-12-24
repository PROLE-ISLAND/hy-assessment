'use client';

// =====================================================
// Prompt Test Client Component
// Interactive test execution UI
// =====================================================

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Coins,
} from 'lucide-react';
import type { PromptTemplate, PromptKey } from '@/types/database';

// Labels for prompt keys
const PROMPT_KEY_LABELS: Record<PromptKey, string> = {
  system: 'システムプロンプト',
  analysis_user: '分析ユーザープロンプト',
  judgment: '判定ルール',
  candidate: '候補者版プロンプト',
};

// Expected AI analysis output structure
interface ParsedAnalysisOutput {
  strengths?: string[];
  weaknesses?: string[];
  summary?: string;
  recommendation?: string;
}

interface TestResult {
  success: boolean;
  result?: {
    rawOutput: string;
    parsedOutput: ParsedAnalysisOutput | null;
    parseError: string | null;
    tokensUsed: number;
    latencyMs: number;
    model: string;
  };
  error?: string;
}

interface PromptTestClientProps {
  prompt: PromptTemplate;
}

export function PromptTestClient({ prompt }: PromptTestClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleRunTest = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/prompts/${prompt.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: 'テスト実行中にエラーが発生しました',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/prompts/${prompt.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">プロンプトテスト</h1>
            <p className="text-muted-foreground">
              {prompt.name} - {PROMPT_KEY_LABELS[prompt.key]}
            </p>
          </div>
        </div>
        <Button onClick={handleRunTest} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              テスト中...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              テスト実行
            </>
          )}
        </Button>
      </div>

      {/* Prompt Info */}
      <Card>
        <CardHeader>
          <CardTitle>テスト対象プロンプト</CardTitle>
          <CardDescription>
            サンプルデータを使用してプロンプトをテストします
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">バージョン</p>
              <code className="text-sm">{prompt.version}</code>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">モデル</p>
              <code className="text-sm">{prompt.model}</code>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Temperature</p>
              <code className="text-sm">{prompt.temperature}</code>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Max Tokens</p>
              <code className="text-sm">{prompt.max_tokens}</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  テスト結果
                  {testResult.success ? (
                    <Badge className="bg-green-100 text-green-800" variant="secondary">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      成功
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800" variant="secondary">
                      <XCircle className="mr-1 h-3 w-3" />
                      失敗
                    </Badge>
                  )}
                </CardTitle>
              </div>
              {testResult.result && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {testResult.result.latencyMs}ms
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4" />
                    {testResult.result.tokensUsed} tokens
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResult.error && (
              <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                {testResult.error}
              </div>
            )}

            {testResult.result && (
              <>
                {/* Parsed Output */}
                {testResult.result.parsedOutput && (
                  <div>
                    <h4 className="font-medium mb-2">解析結果（JSON）</h4>
                    <div className="space-y-3">
                      {testResult.result.parsedOutput.strengths && testResult.result.parsedOutput.strengths.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">強み</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {testResult.result.parsedOutput.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {testResult.result.parsedOutput.weaknesses && testResult.result.parsedOutput.weaknesses.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">注意点</p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {testResult.result.parsedOutput.weaknesses.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {testResult.result.parsedOutput.summary && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">総合評価</p>
                          <p className="text-sm">{testResult.result.parsedOutput.summary}</p>
                        </div>
                      )}
                      {testResult.result.parsedOutput.recommendation && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">推奨事項</p>
                          <p className="text-sm">{testResult.result.parsedOutput.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {testResult.result.parseError && (
                  <div className="rounded-md bg-amber-100 dark:bg-amber-900/30 p-4 text-sm text-amber-800 dark:text-amber-200">
                    {testResult.result.parseError}
                  </div>
                )}

                <Separator />

                {/* Raw Output */}
                <div>
                  <h4 className="font-medium mb-2">生出力</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                    {testResult.result.rawOutput}
                  </pre>
                </div>

                {/* Model Info */}
                <div className="text-xs text-muted-foreground">
                  使用モデル: {testResult.result.model}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sample Data Info */}
      <Card>
        <CardHeader>
          <CardTitle>サンプルテストデータ</CardTitle>
          <CardDescription>
            テストに使用されるサンプル候補者データ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs whitespace-pre-wrap font-mono">
{`{
  "candidatePosition": "ソフトウェアエンジニア",
  "domainScores": {
    "GOV": { "percentage": 72, "riskLevel": "low" },
    "CONFLICT": { "percentage": 65, "riskLevel": "low" },
    "REL": { "percentage": 78, "riskLevel": "low" },
    "COG": { "percentage": 35, "riskLevel": "low" },
    "WORK": { "percentage": 68, "riskLevel": "low" },
    "VALID": { "percentage": 85, "riskLevel": "low" }
  },
  "overallScore": 71,
  "sjtScores": { "percentage": 75 }
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

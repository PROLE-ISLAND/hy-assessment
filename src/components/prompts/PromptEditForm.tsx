'use client';

// =====================================================
// Prompt Edit Form Component
// Form for editing prompt content and settings with tabs
// =====================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Save,
  Loader2,
  Edit,
  Eye,
  History,
} from 'lucide-react';
import { PromptEditor } from './PromptEditor';
import { PromptPreview } from './PromptPreview';
import { VersionHistory } from './VersionHistory';
import type { PromptTemplate, PromptKey } from '@/types/database';

// Labels for prompt keys
const PROMPT_KEY_LABELS: Record<PromptKey, string> = {
  system: 'システムプロンプト',
  analysis_user: '分析ユーザープロンプト',
  judgment: '判定ルール',
  candidate: '候補者版プロンプト',
};

const AVAILABLE_MODELS = [
  'gpt-5.2',
  'gpt-4o',
  'gpt-4-turbo',
  'gpt-4o-mini',
];

interface PromptEditFormProps {
  prompt: PromptTemplate;
  isNew?: boolean;
}

export function PromptEditForm({ prompt, isNew = false }: PromptEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('edit');

  // Form state
  const [name, setName] = useState(prompt.name);
  const [description, setDescription] = useState(prompt.description || '');
  const [version, setVersion] = useState(prompt.version);
  const [content, setContent] = useState(prompt.content);
  const [model, setModel] = useState(prompt.model);
  const [temperature, setTemperature] = useState(prompt.temperature);
  const [maxTokens, setMaxTokens] = useState(prompt.max_tokens);
  const [key, setKey] = useState<PromptKey>(prompt.key);
  const [changeSummary, setChangeSummary] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isNew) {
        // Create new prompt (existing logic)
        const response = await fetch('/api/prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            name,
            description: description || null,
            version,
            content,
            model,
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '作成に失敗しました');
        }
      } else {
        // Update existing prompt via API
        const response = await fetch(`/api/prompts/${prompt.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description: description || null,
            content,
            model,
            temperature,
            max_tokens: maxTokens,
            changeSummary: changeSummary || null,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '更新に失敗しました');
        }

        // Clear change summary after successful save
        setChangeSummary('');
      }

      router.push('/admin/prompts');
      router.refresh();
    } catch (err) {
      console.error('Failed to save prompt:', err);
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild type="button">
            <Link href="/admin/prompts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {isNew ? 'プロンプト作成' : 'プロンプト編集'}
              </h1>
              {!isNew && (
                <Badge variant="outline" className="font-mono">
                  {version}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {isNew ? '新しいプロンプトを作成します' : `${prompt.name} を編集中`}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              保存
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Tabs for Edit / Preview / History */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            編集
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            プレビュー
          </TabsTrigger>
          {!isNew && (
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              履歴
            </TabsTrigger>
          )}
        </TabsList>

        {/* Edit Tab */}
        <TabsContent value="edit" className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>プロンプトの識別情報を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">プロンプト名</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例: カスタムシステムプロンプト"
                    required
                  />
                </div>
                {isNew && (
                  <div className="space-y-2">
                    <Label htmlFor="version">バージョン</Label>
                    <Input
                      id="version"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="例: v1.0.0"
                      required
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="このプロンプトの目的や変更点を記述..."
                  rows={2}
                />
              </div>
              {!isNew && (
                <div className="space-y-2">
                  <Label htmlFor="changeSummary">変更内容（履歴用）</Label>
                  <Input
                    id="changeSummary"
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                    placeholder="例: 分析観点を追加"
                  />
                  <p className="text-xs text-muted-foreground">
                    この変更の概要を入力してください（変更履歴に表示されます）
                  </p>
                </div>
              )}
              {isNew && (
                <div className="space-y-2">
                  <Label htmlFor="key">プロンプトタイプ</Label>
                  <Select value={key} onValueChange={(v) => setKey(v as PromptKey)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PROMPT_KEY_LABELS) as PromptKey[]).map((k) => (
                        <SelectItem key={k} value={k}>
                          {PROMPT_KEY_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prompt Content */}
          <Card>
            <CardHeader>
              <CardTitle>プロンプト内容</CardTitle>
              <CardDescription>
                AI分析で使用されるプロンプトテキストを編集します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PromptEditor
                value={content}
                onChange={setContent}
                height="500px"
              />
            </CardContent>
          </Card>

          {/* AI Parameters */}
          <Card>
            <CardHeader>
              <CardTitle>AIパラメータ</CardTitle>
              <CardDescription>
                OpenAI API呼び出し時のパラメータを設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="model">モデル</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_MODELS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">最大トークン数</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1500)}
                    min={100}
                    max={4096}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Temperature: {temperature}</Label>
                  <span className="text-sm text-muted-foreground">
                    低い値 = 一貫性重視、高い値 = 創造性重視
                  </span>
                </div>
                <Slider
                  value={[temperature]}
                  onValueChange={(v) => setTemperature(v[0])}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <PromptPreview content={content} />
        </TabsContent>

        {/* History Tab */}
        {!isNew && (
          <TabsContent value="history">
            <VersionHistory promptId={prompt.id} currentVersion={version} />
          </TabsContent>
        )}
      </Tabs>
    </form>
  );
}

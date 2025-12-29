'use client';

// =====================================================
// Re-analyze Dialog Component
// Dialog for running AI analysis with optional overrides
// =====================================================

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import type { PromptTemplate } from '@/types/database';

// Available AI models (2025-12)
const AVAILABLE_MODELS = [
  { value: 'gpt-5.2', label: 'GPT-5.2 (最新)' },
  { value: 'gpt-5.2-pro', label: 'GPT-5.2 Pro (高精度)' },
  { value: 'gpt-5.1', label: 'GPT-5.1' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (軽量)' },
];

interface ReanalyzeDialogProps {
  assessmentId: string;
  currentVersion?: number;
  onReanalyzeComplete?: (result: { success: boolean; version?: number }) => void;
  trigger?: React.ReactNode;
}

export function ReanalyzeDialog({
  assessmentId,
  currentVersion,
  onReanalyzeComplete,
  trigger,
}: ReanalyzeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingPrompts, setFetchingPrompts] = useState(false);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [useDefaults, setUseDefaults] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available prompts when dialog opens (once)
  useEffect(() => {
    if (open && prompts.length === 0) {
      fetchPrompts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally fetch only on open, not on prompts change
  }, [open]);

  const fetchPrompts = async () => {
    setFetchingPrompts(true);
    try {
      const response = await fetch('/api/prompts?key=system&active=true');
      if (response.ok) {
        const data = await response.json();
        setPrompts(data);
        // Set default to active prompt
        const activePrompt = data.find((p: PromptTemplate) => p.is_active);
        if (activePrompt) {
          setSelectedPromptId(activePrompt.id);
          setSelectedModel(activePrompt.model);
        }
      }
    } catch (err) {
      console.error('Failed to fetch prompts:', err);
    } finally {
      setFetchingPrompts(false);
    }
  };

  const handleReanalyze = async () => {
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, string> = {};

      // Only include overrides if not using defaults
      if (!useDefaults) {
        if (selectedPromptId) {
          body.promptTemplateId = selectedPromptId;
        }
        if (selectedModel) {
          body.model = selectedModel;
        }
      }

      const response = await fetch(`/api/analysis/${assessmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '再分析に失敗しました');
      }

      setOpen(false);
      setConfirmed(false);

      if (onReanalyzeComplete) {
        onReanalyzeComplete({ success: true, version: result.version });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '再分析に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setConfirmed(false);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            再分析
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>再分析を実行</DialogTitle>
          <DialogDescription>
            現在のバージョン: v{currentVersion || 1}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Use defaults toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useDefaults"
              checked={useDefaults}
              onCheckedChange={(checked) => setUseDefaults(checked === true)}
            />
            <Label htmlFor="useDefaults" className="text-sm">
              有効なプロンプト設定をそのまま使用
            </Label>
          </div>

          {/* Custom settings (when not using defaults) */}
          {!useDefaults && (
            <>
              {/* Prompt selection */}
              <div className="grid gap-2">
                <Label htmlFor="prompt">プロンプト</Label>
                <Select
                  value={selectedPromptId}
                  onValueChange={setSelectedPromptId}
                  disabled={fetchingPrompts}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="プロンプトを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {prompts.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.name} ({prompt.version})
                        {prompt.is_active && ' - 有効'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model selection */}
              <div className="grid gap-2">
                <Label htmlFor="model">AIモデル</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="モデルを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              再分析すると新バージョンが作成されます。
              以前のバージョンは履歴から参照できます。
            </AlertDescription>
          </Alert>

          {/* Confirmation checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirmed"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <Label htmlFor="confirmed" className="text-sm">
              上記を理解し、再分析を実行します
            </Label>
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            キャンセル
          </Button>
          <Button onClick={handleReanalyze} disabled={!confirmed || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                分析中...
              </>
            ) : (
              '再分析を実行'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

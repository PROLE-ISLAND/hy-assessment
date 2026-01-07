'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { JobType } from './JobTypesSettings';

interface JobTypeCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<JobType>) => Promise<void>;
}

export function JobTypeCreateDialog({
  open,
  onOpenChange,
  onSave,
}: JobTypeCreateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('職種名を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        is_active: true,
      });
      // リセット
      setName('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // ダイアログを閉じるときにリセット
      setName('');
      setDescription('');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>職種を追加</DialogTitle>
            <DialogDescription>
              新しい職種の基本情報を入力してください。
              理想プロファイルは作成後に設定できます。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="job-type-name">
                職種名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="job-type-name"
                data-testid="job-type-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 営業職、エンジニア、CS"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="job-type-description">説明</Label>
              <Textarea
                id="job-type-description"
                data-testid="job-type-description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="この職種の役割や求められるスキルを記述"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              作成
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

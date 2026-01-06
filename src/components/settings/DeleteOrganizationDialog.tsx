'use client';

// =====================================================
// Delete Organization Dialog Component
// Confirmation dialog for organization deletion
// =====================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeleteOrganizationDialogProps {
  organizationName: string;
}

export function DeleteOrganizationDialog({
  organizationName,
}: DeleteOrganizationDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmationName, setConfirmationName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const isConfirmationValid = confirmationName === organizationName;

  const handleDelete = async () => {
    if (!isConfirmationValid) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/organization', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationName }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '削除に失敗しました');
      }

      // ログインページにリダイレクト
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // ダイアログを閉じた時にリセット
      setConfirmationName('');
      setError(null);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          data-testid="delete-organization-button"
        >
          組織を削除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent data-testid="delete-confirmation-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            組織を削除しますか？
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              この操作は取り消せません。組織を削除すると、以下のすべてのデータが
              完全に削除されます：
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>すべての候補者データ</li>
              <li>すべての検査結果</li>
              <li>すべてのAI分析結果</li>
              <li>すべてのユーザーアカウント</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="confirmationName">
            確認のため、組織名「<strong>{organizationName}</strong>」を入力してください
          </Label>
          <Input
            id="confirmationName"
            value={confirmationName}
            onChange={(e) => setConfirmationName(e.target.value)}
            placeholder={organizationName}
            data-testid="delete-confirm-input"
            disabled={isDeleting}
          />
        </div>

        {error && (
          <Alert variant="destructive" data-testid="delete-error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            data-testid="delete-cancel-button"
          >
            キャンセル
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmationValid || isDeleting}
            data-testid="delete-confirm-button"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            削除する
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

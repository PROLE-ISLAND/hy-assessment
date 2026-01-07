'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import type { JobType } from './JobTypesSettings';

interface JobTypeDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobType: JobType | null;
  onConfirm: () => Promise<void>;
}

export function JobTypeDeleteDialog({
  open,
  onOpenChange,
  jobType,
  onConfirm,
}: JobTypeDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>職種を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            {jobType && (
              <>
                <span className="font-medium text-foreground">
                  「{jobType.name}」
                </span>
                を削除します。この操作は取り消せません。
                <br />
                <br />
                この職種に関連付けられた候補者のマッチング情報も影響を受ける可能性があります。
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            削除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

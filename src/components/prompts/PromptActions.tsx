'use client';

// =====================================================
// Prompt Actions Component
// Actions dropdown for prompt management
// =====================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Button } from '@/components/ui/button';
import { MoreHorizontal, CheckCircle, XCircle, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { PromptTemplate } from '@/types/database';

interface PromptActionsProps {
  prompt: PromptTemplate;
}

export function PromptActions({ prompt }: PromptActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleToggleActive = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('prompt_templates' as 'users')  // Type cast for new table
        .update({ is_active: !prompt.is_active } as never)
        .eq('id', prompt.id);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error('Failed to toggle prompt status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('prompt_templates' as 'users')  // Type cast for new table
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', prompt.id);

      if (error) throw error;
      router.push('/admin/prompts');
      router.refresh();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // Don't show actions for system prompts
  if (prompt.organization_id === null) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleToggleActive}>
            {prompt.is_active ? (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                無効にする
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                有効にする
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>プロンプトを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{prompt.name}」を削除します。この操作は取り消すことができますが、
              削除されたプロンプトは一覧に表示されなくなります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

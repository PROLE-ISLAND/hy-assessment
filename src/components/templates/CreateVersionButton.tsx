'use client';

// =====================================================
// Create Version Button
// Creates a new version by copying the current template
// =====================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateVersionButtonProps {
  templateId: string;
  templateName: string;
  currentVersion: string;
}

function incrementVersion(version: string): string {
  // Handle versions like "1.0.0", "v1.0", "1.0", "1"
  const cleaned = version.replace(/^v/i, '');
  const parts = cleaned.split('.');

  if (parts.length >= 3) {
    // Semantic versioning: increment patch
    const patch = parseInt(parts[2]) || 0;
    return `${parts[0]}.${parts[1]}.${patch + 1}`;
  } else if (parts.length === 2) {
    // Two-part version: increment minor
    const minor = parseInt(parts[1]) || 0;
    return `${parts[0]}.${minor + 1}`;
  } else {
    // Single number: increment
    const num = parseInt(parts[0]) || 1;
    return `${num + 1}.0`;
  }
}

export function CreateVersionButton({
  templateId,
  templateName,
  currentVersion,
}: CreateVersionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newVersion, setNewVersion] = useState(incrementVersion(currentVersion));
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/templates/${templateId}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: newVersion }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create new version');
      }

      const data = await response.json();
      setOpen(false);
      router.push(`/admin/templates/${data.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Copy className="mr-2 h-4 w-4" />
          新バージョン作成
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新バージョンを作成</DialogTitle>
          <DialogDescription>
            「{templateName}」のv{currentVersion}をコピーして新しいバージョンを作成します。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="version">新しいバージョン番号</Label>
            <Input
              id="version"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder="1.0.1"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              現在のバージョン: v{currentVersion}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            キャンセル
          </Button>
          <Button onClick={handleCreate} disabled={loading || !newVersion.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                作成中...
              </>
            ) : (
              '作成して編集'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

// =====================================================
// Version History Component
// Shows prompt version history with revert option
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  History,
  RotateCcw,
  Eye,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface VersionInfo {
  id: string;
  version: string;
  content: string;
  model: string | null;
  temperature: number | null;
  max_tokens: number | null;
  changeSummary: string | null;
  createdBy: { email: string; name: string } | null;
  createdAt: string;
}

interface VersionHistoryProps {
  promptId: string;
  currentVersion: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function VersionHistory({
  promptId,
  currentVersion,
}: VersionHistoryProps) {
  const router = useRouter();
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [revertTarget, setRevertTarget] = useState<VersionInfo | null>(null);
  const [isReverting, setIsReverting] = useState(false);

  const fetchVersions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/prompts/${promptId}/versions`);

      if (!response.ok) {
        throw new Error('バージョン履歴の取得に失敗しました');
      }

      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [promptId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRevert = async () => {
    if (!revertTarget) return;

    try {
      setIsReverting(true);
      const encodedVersion = encodeURIComponent(revertTarget.version);
      const response = await fetch(
        `/api/prompts/${promptId}/versions/${encodedVersion}/revert`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '復元に失敗しました');
      }

      router.refresh();
      setRevertTarget(null);
      fetchVersions();
    } catch (err) {
      setError(err instanceof Error ? err.message : '復元に失敗しました');
    } finally {
      setIsReverting(false);
    }
  };

  const toggleExpand = (version: string) => {
    setExpandedVersion(expandedVersion === version ? null : version);
  };

  if (isLoading) {
    return (
      <Card data-testid="version-history-skeleton">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            変更履歴
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="version-history-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            変更履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchVersions}>
            再試行
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card data-testid="version-history-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            変更履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">まだバージョン履歴がありません</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card data-testid="version-history">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            変更履歴
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {versions.map((version) => {
            const isCurrentVersion = version.version === currentVersion;
            const isExpanded = expandedVersion === version.version;

            return (
              <div
                key={version.id}
                className={`border rounded-lg p-4 ${isCurrentVersion ? 'border-primary bg-primary/5' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={isCurrentVersion ? 'default' : 'secondary'} className="font-mono">
                      {version.version}
                    </Badge>
                    {isCurrentVersion && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                      >
                        現在のバージョン
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleExpand(version.version)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <Eye className="h-4 w-4 ml-1" />
                    </Button>
                    {!isCurrentVersion && (
                      <Button variant="outline" size="sm" onClick={() => setRevertTarget(version)}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        復元
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>{formatDate(version.createdAt)}</span>
                    {version.createdBy && <span>{version.createdBy.email}</span>}
                  </div>
                  {version.changeSummary && <p className="mt-1">「{version.changeSummary}」</p>}
                </div>

                {isExpanded && (
                  <div className="mt-4">
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap font-mono">
                      {version.content}
                    </pre>
                    {version.model && (
                      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                        <span>モデル: {version.model}</span>
                        {version.temperature !== null && <span>Temperature: {version.temperature}</span>}
                        {version.max_tokens !== null && <span>Max Tokens: {version.max_tokens}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AlertDialog open={!!revertTarget} onOpenChange={() => setRevertTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>バージョンを復元しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {revertTarget && (
                <>
                  <strong>{revertTarget.version}</strong> の内容に復元します。
                  <br />
                  現在のバージョンは履歴に保存され、後で元に戻すことができます。
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReverting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevert} disabled={isReverting}>
              {isReverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  復元中...
                </>
              ) : (
                '復元する'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

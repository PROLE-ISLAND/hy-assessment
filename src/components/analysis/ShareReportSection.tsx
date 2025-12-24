'use client';

// =====================================================
// Share Report Section Component
// Allows admins to generate and share report links with candidates
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, ExternalLink, Clock, Eye, AlertCircle } from 'lucide-react';

interface ShareStatus {
  isShared: boolean;
  isExpired: boolean;
  isViewed: boolean;
  shareUrl: string | null;
  sharedAt: string | null;
  expiresAt: string | null;
  viewedAt: string | null;
}

interface ShareReportSectionProps {
  assessmentId: string;
  hasCandidateReport: boolean;
}

export function ShareReportSection({ assessmentId, hasCandidateReport }: ShareReportSectionProps) {
  const [status, setStatus] = useState<ShareStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current share status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/analysis/${assessmentId}/share`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch share status:', err);
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Handle share button click
  const handleShare = async () => {
    setSharing(true);
    setError(null);
    try {
      const response = await fetch(`/api/analysis/${assessmentId}/share`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate share link');
      }

      const data = await response.json();
      setStatus(prev => prev ? {
        ...prev,
        isShared: true,
        isExpired: false,
        shareUrl: data.shareUrl,
        sharedAt: new Date().toISOString(),
        expiresAt: data.expiresAt,
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share');
    } finally {
      setSharing(false);
    }
  };

  // Handle copy button click
  const handleCopy = async () => {
    if (!status?.shareUrl) return;

    try {
      await navigator.clipboard.writeText(status.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          読み込み中...
        </CardContent>
      </Card>
    );
  }

  if (!hasCandidateReport) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            候補者への結果共有
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                候補者版レポートがまだ生成されていません。
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                分析を実行すると、候補者に共有できるレポートが自動で生成されます。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          候補者への結果共有
        </CardTitle>
        <CardDescription>
          候補者が閲覧できる専用リンクを発行します（90日間有効）
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {status?.isShared && !status.isExpired && status.shareUrl ? (
          <>
            {/* Share URL display */}
            <div className="space-y-2">
              <label className="text-sm font-medium">共有リンク</label>
              <div className="flex gap-2">
                <Input
                  value={status.shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  title="コピー"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(status.shareUrl!, '_blank')}
                  title="プレビュー"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              {status.isViewed ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Eye className="h-3 w-3 mr-1" />
                  閲覧済み
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <Eye className="h-3 w-3 mr-1" />
                  未閲覧
                </Badge>
              )}
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <Clock className="h-3 w-3 mr-1" />
                有効期限: {formatDate(status.expiresAt)}
              </Badge>
            </div>

            {/* Info */}
            <div className="text-sm text-muted-foreground">
              <p>発行日時: {formatDate(status.sharedAt)}</p>
              {status.viewedAt && <p>閲覧日時: {formatDate(status.viewedAt)}</p>}
            </div>

            {/* Regenerate button */}
            <Button
              variant="outline"
              onClick={handleShare}
              disabled={sharing}
            >
              {sharing ? '生成中...' : 'リンクを再発行'}
            </Button>
          </>
        ) : status?.isShared && status.isExpired ? (
          <>
            {/* Expired state */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    共有リンクの有効期限が切れました
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    新しいリンクを発行してください。
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={handleShare} disabled={sharing}>
              <Share2 className="mr-2 h-4 w-4" />
              {sharing ? '生成中...' : '新しいリンクを発行'}
            </Button>
          </>
        ) : (
          <>
            {/* Not shared yet */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                候補者版レポートは、スコアや判定を含まない、
                候補者本人向けのフィードバックです。
                共有リンクを発行すると、候補者がログインなしで閲覧できます。
              </p>
            </div>
            <Button onClick={handleShare} disabled={sharing}>
              <Share2 className="mr-2 h-4 w-4" />
              {sharing ? '生成中...' : '共有リンクを発行'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

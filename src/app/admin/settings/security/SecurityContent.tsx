'use client';

// =====================================================
// Security Content Component
// Client component for security settings
// Issue: #134
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Monitor,
  Smartphone,
  Tablet,
  HelpCircle,
  LogOut,
  History,
  Shield,
  Check,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { stateColors } from '@/lib/design-system';
import type { SessionListItem, LoginHistoryItem } from '@/types/database';

// Device icon component
function DeviceIcon({ type }: { type: string }) {
  switch (type) {
    case 'desktop':
      return <Monitor className="h-5 w-5" />;
    case 'mobile':
      return <Smartphone className="h-5 w-5" />;
    case 'tablet':
      return <Tablet className="h-5 w-5" />;
    default:
      return <HelpCircle className="h-5 w-5" />;
  }
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  return date.toLocaleDateString('ja-JP');
}

// Format full datetime
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Session List Skeleton
function SessionListSkeleton() {
  return (
    <div className="space-y-3" data-testid="session-list-skeleton">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      ))}
    </div>
  );
}

// Login History Skeleton
function LoginHistorySkeleton() {
  return (
    <div className="space-y-2" data-testid="login-history-skeleton">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

// Session List Empty
function SessionListEmpty() {
  return (
    <div className="text-center py-8" data-testid="session-list-empty">
      <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">アクティブなセッションがありません</p>
    </div>
  );
}

// Login History Empty
function LoginHistoryEmpty() {
  return (
    <div className="text-center py-8" data-testid="login-history-empty">
      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">ログイン履歴がありません</p>
    </div>
  );
}

// Session List Error
function SessionListError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8" data-testid="session-list-error">
      <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
      <p className="text-destructive mb-4">{error}</p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        再試行
      </Button>
    </div>
  );
}

// Login History Error
function LoginHistoryError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8" data-testid="login-history-error">
      <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
      <p className="text-destructive mb-4">{error}</p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        再試行
      </Button>
    </div>
  );
}

export function SecurityContent() {
  // Sessions state
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [isTerminatingAll, setIsTerminatingAll] = useState(false);
  const [terminateSuccess, setTerminateSuccess] = useState<string | null>(null);

  // Login history state
  const [history, setHistory] = useState<LoginHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    setSessionsError(null);

    try {
      const response = await fetch('/api/settings/security/sessions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'セッション情報の取得に失敗しました');
      }

      setSessions(data.sessions || []);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'セッション情報の取得に失敗しました');
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // Fetch login history
  const fetchHistory = useCallback(async (page: number = 1) => {
    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const response = await fetch(`/api/settings/security/login-history?page=${page}&pageSize=10`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ログイン履歴の取得に失敗しました');
      }

      setHistory(data.history || []);
      setHistoryPage(data.pagination?.page || 1);
      setHistoryTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'ログイン履歴の取得に失敗しました');
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSessions();
    fetchHistory();
  }, [fetchSessions, fetchHistory]);

  // Terminate single session
  const handleTerminateSession = async (sessionId: string) => {
    setTerminatingId(sessionId);
    setTerminateSuccess(null);

    try {
      const response = await fetch(`/api/settings/security/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'セッションの終了に失敗しました');
      }

      setTerminateSuccess('セッションを終了しました');
      fetchSessions();
      setTimeout(() => setTerminateSuccess(null), 3000);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'セッションの終了に失敗しました');
    } finally {
      setTerminatingId(null);
    }
  };

  // Terminate all other sessions
  const handleTerminateAll = async () => {
    setIsTerminatingAll(true);
    setTerminateSuccess(null);

    try {
      const response = await fetch('/api/settings/security/sessions', {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'セッションの終了に失敗しました');
      }

      setTerminateSuccess(data.message || '他のセッションを終了しました');
      fetchSessions();
      setTimeout(() => setTerminateSuccess(null), 3000);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'セッションの終了に失敗しました');
    } finally {
      setIsTerminatingAll(false);
    }
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 2FA Card (Disabled/Placeholder) */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            2要素認証
            <Badge variant="secondary">準備中</Badge>
          </CardTitle>
          <CardDescription>
            2要素認証を有効にすると、ログイン時に追加の認証が必要になります
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled>
            2要素認証を設定
          </Button>
        </CardContent>
      </Card>

      {/* Active Sessions Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                アクティブなセッション
              </CardTitle>
              <CardDescription>
                現在ログイン中のデバイスを管理できます
              </CardDescription>
            </div>
            {otherSessionsCount > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isTerminatingAll}
                    data-testid="terminate-all-sessions-button"
                  >
                    {isTerminatingAll ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    他をすべて終了
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>他のセッションをすべて終了しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      現在のセッション以外の{otherSessionsCount}件のセッションが終了されます。
                      他のデバイスでは再度ログインが必要になります。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={handleTerminateAll}>
                      すべて終了
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {terminateSuccess && (
            <Alert className={`mb-4 border ${stateColors.success.light.border} ${stateColors.success.light.bg} ${stateColors.success.light.text} ${stateColors.success.dark.bg} ${stateColors.success.dark.text}`}>
              <Check className="h-4 w-4" />
              <AlertDescription>{terminateSuccess}</AlertDescription>
            </Alert>
          )}

          {sessionsError && !isLoadingSessions && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{sessionsError}</AlertDescription>
            </Alert>
          )}

          {isLoadingSessions ? (
            <SessionListSkeleton />
          ) : sessionsError ? (
            <SessionListError error={sessionsError} onRetry={fetchSessions} />
          ) : sessions.length === 0 ? (
            <SessionListEmpty />
          ) : (
            <div className="space-y-3" data-testid="session-list">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    session.isCurrent ? 'border-primary bg-primary/5' : ''
                  }`}
                  data-testid={`session-item-${session.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${session.isCurrent ? 'bg-primary/10' : 'bg-muted'}`}>
                      <DeviceIcon type={session.deviceType} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {session.browser} / {session.os}
                        </span>
                        {session.isCurrent && (
                          <Badge variant="default" className="text-xs">
                            このセッション
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {session.location} • {formatRelativeTime(session.lastActiveAt)}
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={terminatingId === session.id}
                          data-testid={`terminate-session-button-${session.id}`}
                        >
                          {terminatingId === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>このセッションを終了しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            {session.browser} / {session.os}（{session.location}）のセッションを終了します。
                            そのデバイスでは再度ログインが必要になります。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleTerminateSession(session.id)}>
                            終了
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            ログイン履歴
          </CardTitle>
          <CardDescription>
            過去のログイン試行を確認できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <LoginHistorySkeleton />
          ) : historyError ? (
            <LoginHistoryError error={historyError} onRetry={() => fetchHistory(historyPage)} />
          ) : history.length === 0 ? (
            <LoginHistoryEmpty />
          ) : (
            <>
              <div className="space-y-2" data-testid="login-history-list">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    data-testid={`login-history-item-${item.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        item.success
                          ? `${stateColors.success.light.bg} ${stateColors.success.dark.bg}`
                          : `${stateColors.error.light.bg} ${stateColors.error.dark.bg}`
                      }`}>
                        {item.success ? (
                          <Check className={`h-4 w-4 ${stateColors.success.light.text} ${stateColors.success.dark.text}`} />
                        ) : (
                          <X className={`h-4 w-4 ${stateColors.error.light.text} ${stateColors.error.dark.text}`} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm">
                          {item.browser} / {item.deviceType}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.location} • {formatDateTime(item.timestamp)}
                        </div>
                        {!item.success && item.failureReason && (
                          <div className={`text-xs ${stateColors.error.light.text} ${stateColors.error.dark.text}`}>
                            {item.failureReason}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={item.success ? 'default' : 'destructive'}>
                      {item.success ? '成功' : '失敗'}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchHistory(historyPage - 1)}
                    disabled={historyPage <= 1 || isLoadingHistory}
                  >
                    前へ
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {historyPage} / {historyTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchHistory(historyPage + 1)}
                    disabled={historyPage >= historyTotalPages || isLoadingHistory}
                  >
                    次へ
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

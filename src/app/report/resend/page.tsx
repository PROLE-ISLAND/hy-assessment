'use client';

// =====================================================
// Report Link Resend Page
// Allows candidates to request their report link via email
// =====================================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { stateColors } from '@/lib/design-system';

export default function ReportResendPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setStatus('error');
      setMessage('メールアドレスを入力してください');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/report/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || '送信に失敗しました');
        return;
      }

      setStatus('success');
      setMessage(data.message);
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('ネットワークエラーが発生しました');
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${stateColors.info.light.bg} ${stateColors.info.dark.bg}`}>
            <Mail className={`h-6 w-6 ${stateColors.info.light.text} ${stateColors.info.dark.text}`} />
          </div>
          <CardTitle className="text-2xl">レポートリンクの再送</CardTitle>
          <CardDescription>
            適性検査レポートのリンクをメールで再送します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
              />
              <p className="text-sm text-muted-foreground">
                検査時に登録したメールアドレスを入力してください
              </p>
            </div>

            {status === 'success' && (
              <div className={`flex items-start gap-3 p-4 rounded-lg border ${stateColors.success.combined}`}>
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  {message}
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className={`flex items-start gap-3 p-4 rounded-lg border ${stateColors.error.combined}`}>
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  {message}
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={status === 'loading'}>
              {status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                '送信する'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              メールが届かない場合は、迷惑メールフォルダをご確認ください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

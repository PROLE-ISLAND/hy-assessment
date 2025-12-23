// =====================================================
// Landing Page
// Public page for candidates to access assessments
// =====================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ClipboardCheck, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LandingPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Extract token from URL or direct input
    let extractedToken = token.trim();

    // If user pasted a full URL, extract the token
    if (extractedToken.includes('/assessment/')) {
      const match = extractedToken.match(/\/assessment\/([a-zA-Z0-9-]+)/);
      if (match) {
        extractedToken = match[1];
      }
    }

    if (!extractedToken) {
      setError('検査コードを入力してください');
      return;
    }

    // Navigate to assessment page
    router.push(`/assessment/${extractedToken}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-xl">HY</span>
            <span className="text-muted-foreground">Assessment</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            GFD-Gate 適性検査
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            入社前適性検査システムへようこそ。
            <br />
            採用担当者から受け取った検査URLまたは検査コードをご用意ください。
          </p>
        </div>

        {/* Token Input Card */}
        <Card className="mx-auto mt-12 max-w-md">
          <CardHeader>
            <CardTitle>検査を開始する</CardTitle>
            <CardDescription>
              検査URLをお持ちでない場合は、検査コードを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="token">検査コードまたはURL</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="abc123-def456-..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <Button type="submit" className="w-full">
                検査を開始
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mx-auto mt-16 grid max-w-4xl gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">所要時間 約20分</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              途中で中断しても、後から続きを再開できます
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">正解はありません</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              直感的に、正直にお答えください
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">安全に保護</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              回答内容は厳重に管理されます
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-muted/30">
        <div className="container mx-auto flex items-center justify-between px-4 py-6">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} HY Assessment
          </p>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            管理者ログイン
          </Link>
        </div>
      </footer>
    </div>
  );
}

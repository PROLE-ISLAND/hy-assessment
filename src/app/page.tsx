// =====================================================
// Landing Page (Issue #215)
// Public page for direct assessment start
// =====================================================

import Link from 'next/link';
import { Clock, ClipboardCheck, Shield } from 'lucide-react';
import { DirectAssessmentFlow } from './page.client';

export default function LandingPage() {
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
            下記フォームに情報を入力して検査を開始してください。
          </p>
        </div>

        {/* Direct Assessment Flow */}
        <div className="mt-12">
          <DirectAssessmentFlow />
        </div>

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

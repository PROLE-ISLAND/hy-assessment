// =====================================================
// Login Page
// Public page for user authentication
// =====================================================

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function LoginPage() {
  // Check if user is already logged in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/admin');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">HY Assessment</h1>
          <p className="mt-2 text-muted-foreground">
            入社前適性検査システム
          </p>
        </div>

        {/* Login Form */}
        <Suspense fallback={<div className="text-center">読み込み中...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

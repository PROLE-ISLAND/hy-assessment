// =====================================================
// Security Settings Page
// Manage sessions and view login history
// Issue: #134
// =====================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SecurityContent } from './SecurityContent';

export default async function SecurityPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">セキュリティ</h1>
        <p className="text-muted-foreground">
          ログインセッションの管理とログイン履歴を確認できます
        </p>
      </div>

      {/* Security Content */}
      <SecurityContent />
    </div>
  );
}

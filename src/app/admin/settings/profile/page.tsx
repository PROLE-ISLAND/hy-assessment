// =====================================================
// Profile Settings Page
// Update user profile information
// =====================================================

import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { ProfileForm } from './ProfileForm';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await adminSupabase
    .from('users')
    .select('id, email, name, role')
    .eq('id', user.id)
    .single<UserProfile>();

  if (!profile) {
    redirect('/admin');
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">プロフィール</h1>
        <p className="text-muted-foreground">
          アカウント情報を確認・変更できます
        </p>
      </div>

      {/* Profile Form */}
      <ProfileForm
        initialName={profile.name}
        email={profile.email}
        role={profile.role}
      />
    </div>
  );
}

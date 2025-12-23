// =====================================================
// Admin Layout
// Layout wrapper for all admin pages
// =====================================================

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminLayout } from '@/components/layout';
import type { SessionUser, UserRole } from '@/types/database';

interface UserProfileRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization_id: string;
}

interface OrganizationRow {
  slug: string;
}

export default async function AdminLayoutRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user details from our users table
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, email, name, role, organization_id')
    .eq('id', user.id)
    .single<UserProfileRow>();

  // Get organization details
  const { data: org } = userProfile
    ? await supabase
        .from('organizations')
        .select('slug')
        .eq('id', userProfile.organization_id)
        .single<OrganizationRow>()
    : { data: null };

  // Construct session user
  const sessionUser: SessionUser | null = userProfile
    ? {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        organization_id: userProfile.organization_id,
        organization_slug: org?.slug || '',
      }
    : null;

  return <AdminLayout user={sessionUser}>{children}</AdminLayout>;
}

// =====================================================
// New Candidate Page
// =====================================================

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { CandidateForm } from '@/components/candidates/CandidateForm';

interface UserProfile {
  organization_id: string;
}

export default async function NewCandidatePage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single<UserProfile>();

  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/candidates">
          <ArrowLeft className="mr-2 h-4 w-4" />
          候補者一覧に戻る
        </Link>
      </Button>

      {/* Form */}
      <CandidateForm organizationId={profile.organization_id} />
    </div>
  );
}

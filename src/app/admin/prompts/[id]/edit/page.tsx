// =====================================================
// Prompt Edit Page
// Edit prompt content and settings
// =====================================================

import { notFound, redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PromptEditForm } from '@/components/prompts/PromptEditForm';
import type { PromptTemplate } from '@/types/database';

interface PromptEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PromptEditPage({ params }: PromptEditPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's organization
  let organizationId: string | null = null;
  if (user) {
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single<{ organization_id: string }>();
    organizationId = dbUser?.organization_id || null;
  }

  // Get prompt
  const { data: prompt } = await adminSupabase
    .from('prompt_templates')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single<PromptTemplate>();

  if (!prompt) {
    notFound();
  }

  // Check if user can edit (org-specific prompts only)
  if (prompt.organization_id === null) {
    // System prompts can't be edited directly, redirect to copy
    redirect(`/admin/prompts/new?copy=${prompt.id}`);
  }

  if (prompt.organization_id !== organizationId) {
    // Can't edit other org's prompts
    redirect('/admin/prompts');
  }

  return (
    <div className="space-y-6">
      <PromptEditForm prompt={prompt} />
    </div>
  );
}

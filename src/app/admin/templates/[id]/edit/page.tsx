// =====================================================
// Template Edit Page
// SurveyJS Creator for editing questions
// =====================================================

import { notFound } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { TemplateEditor } from '@/components/templates/TemplateEditor';

interface TemplateRow {
  id: string;
  name: string;
  version: string;
  questions: Record<string, unknown>;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TemplateEditPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  // Get user's organization
  const { data: dbUser } = await adminSupabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single<{ organization_id: string }>();

  if (!dbUser?.organization_id) {
    notFound();
  }

  // Get template
  const { data: template, error } = await adminSupabase
    .from('assessment_templates')
    .select('id, name, version, questions')
    .eq('id', id)
    .eq('organization_id', dbUser.organization_id)
    .is('deleted_at', null)
    .single<TemplateRow>();

  if (error || !template) {
    notFound();
  }

  return (
    <TemplateEditor
      templateId={template.id}
      templateName={template.name}
      version={template.version}
      questions={template.questions}
    />
  );
}

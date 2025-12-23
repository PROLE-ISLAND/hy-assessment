// =====================================================
// New Prompt Page
// Create a new prompt or copy from existing
// =====================================================

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PromptEditForm } from '@/components/prompts/PromptEditForm';
import type { PromptTemplate, PromptKey } from '@/types/database';

interface NewPromptPageProps {
  searchParams: Promise<{ copy?: string }>;
}

export default async function NewPromptPage({ searchParams }: NewPromptPageProps) {
  const { copy: copyFromId } = await searchParams;
  const adminSupabase = createAdminClient();

  // Default empty prompt
  let basePrompt: PromptTemplate = {
    id: '',
    organization_id: null,
    key: 'system' as PromptKey,
    name: '',
    description: null,
    version: 'v1.0.0',
    content: '',
    model: 'gpt-5.2',
    temperature: 0.3,
    max_tokens: 1500,
    is_active: false,
    is_default: false,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  // If copying from existing prompt
  if (copyFromId) {
    const { data: sourcePrompt } = await adminSupabase
      .from('prompt_templates')
      .select('*')
      .eq('id', copyFromId)
      .is('deleted_at', null)
      .single<PromptTemplate>();

    if (sourcePrompt) {
      basePrompt = {
        ...sourcePrompt,
        id: '', // Will be generated on insert
        name: `${sourcePrompt.name} (コピー)`,
        version: incrementVersion(sourcePrompt.version),
        is_active: false,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  return (
    <div className="space-y-6">
      <PromptEditForm prompt={basePrompt} isNew={true} />
    </div>
  );
}

// Helper function to increment version
function incrementVersion(version: string): string {
  const match = version.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  if (match) {
    const [, major, minor, patch] = match;
    return `v${major}.${minor}.${parseInt(patch) + 1}`;
  }
  return 'v1.0.0';
}

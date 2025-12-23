// =====================================================
// Prompt Test Page
// Test prompt with sample data and view results
// =====================================================

import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { PromptTestClient } from '@/components/prompts/PromptTestClient';
import type { PromptTemplate } from '@/types/database';

interface PromptTestPageProps {
  params: Promise<{ id: string }>;
}

export default async function PromptTestPage({ params }: PromptTestPageProps) {
  const { id } = await params;
  const adminSupabase = createAdminClient();

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

  return <PromptTestClient prompt={prompt} />;
}

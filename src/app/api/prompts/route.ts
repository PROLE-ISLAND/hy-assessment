// =====================================================
// Prompt Templates API
// GET /api/prompts - List prompt templates
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { PromptTemplate } from '@/types/database';

/**
 * GET /api/prompts
 * Query params:
 * - key: 'system' | 'candidate' | 'analysis_user' | 'judgment' (optional)
 * - active: 'true' to filter only active prompts (optional)
 * - limit: number of results (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const adminSupabase = createAdminClient();

    // Build query
    let query = adminSupabase
      .from('prompt_templates')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by key if provided
    if (key) {
      query = query.eq('key', key);
    }

    // Filter by active status if requested
    if (active === 'true') {
      query = query.eq('is_active', true);
    }

    const { data: prompts, error } = await query.returns<PromptTemplate[]>();

    if (error) {
      console.error('Failed to fetch prompts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch prompts' },
        { status: 500 }
      );
    }

    return NextResponse.json(prompts || []);
  } catch (error) {
    console.error('Prompts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

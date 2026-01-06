// =====================================================
// Login History API
// GET /api/settings/security/login-history - Get login history (paginated)
// Issue: #134
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LoginHistoryItem, LoginHistory } from '@/types/database';

// Default pagination settings
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Format location from country/city
function formatLocation(country: string | null, city: string | null): string {
  if (city && country) return `${city}, ${country}`;
  if (country) return country;
  if (city) return city;
  return '不明';
}

// Transform database record to API response format
function transformLoginHistory(record: LoginHistory): LoginHistoryItem {
  return {
    id: record.id,
    timestamp: record.created_at,
    location: formatLocation(record.country, record.city),
    deviceType: record.device_type || 'unknown',
    browser: record.browser || '不明',
    success: record.success,
    failureReason: record.failure_reason || undefined,
  };
}

// GET: Retrieve login history with pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'unauthorized' },
        { status: 401 }
      );
    }

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || String(DEFAULT_PAGE), 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10))
    );

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Fetch total count
    const { count: totalCount, error: countError } = await supabase
      .from('login_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Failed to count login history:', countError);
      return NextResponse.json(
        { error: 'ログイン履歴のカウントに失敗しました' },
        { status: 500 }
      );
    }

    // Fetch paginated login history
    const { data: history, error: fetchError } = await supabase
      .from('login_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (fetchError) {
      console.error('Failed to fetch login history:', fetchError);
      return NextResponse.json(
        { error: 'ログイン履歴の取得に失敗しました' },
        { status: 500 }
      );
    }

    // Transform to API response format
    const historyList: LoginHistoryItem[] = (history || []).map((h) =>
      transformLoginHistory(h as LoginHistory)
    );

    // Calculate total pages
    const total = totalCount || 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      history: historyList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Login history API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

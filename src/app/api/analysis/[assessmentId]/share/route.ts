// =====================================================
// Share Report API Endpoint
// POST /api/analysis/[assessmentId]/share
// Generates a unique token for sharing candidate report
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import { checkRateLimit, applyRateLimitHeaders, type RateLimitResult } from '@/lib/rate-limit';

// Rate limit config: 10 requests per minute per user
const SHARE_RATE_LIMIT = {
  limit: 10,
  windowSeconds: 60,
};

// Expiration period: 90 days
const EXPIRATION_DAYS = 90;

// Maximum retry attempts for token collision
const MAX_TOKEN_RETRIES = 3;

// PostgreSQL unique constraint violation error code
const UNIQUE_VIOLATION_CODE = '23505';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check rate limit (10 requests per minute per user)
    const rateLimitResult: RateLimitResult = checkRateLimit(user.id, SHARE_RATE_LIMIT);
    if (!rateLimitResult.success) {
      const headers = new Headers();
      applyRateLimitHeaders(headers, rateLimitResult);
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...Object.fromEntries(headers.entries()),
          },
        }
      );
    }

    // 3. Get user's organization
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single<{ organization_id: string; role: string }>();

    if (!dbUser?.organization_id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 4. Verify assessment belongs to user's organization and has analysis
    const { data: assessment, error: assessmentError } = await adminSupabase
      .from('assessments')
      .select(`
        id,
        organization_id,
        report_token,
        report_shared_at,
        report_expires_at,
        ai_analyses (
          id,
          candidate_report,
          is_latest
        )
      `)
      .eq('id', assessmentId)
      .eq('organization_id', dbUser.organization_id)
      .is('deleted_at', null)
      .single<{
        id: string;
        organization_id: string;
        report_token: string | null;
        report_shared_at: string | null;
        report_expires_at: string | null;
        ai_analyses: Array<{
          id: string;
          candidate_report: unknown;
          is_latest: boolean;
        }>;
      }>();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // 5. Check if there's a candidate report
    const latestAnalysis = assessment.ai_analyses?.find(a => a.is_latest);
    if (!latestAnalysis?.candidate_report) {
      return NextResponse.json(
        { error: 'No candidate report available. Please run analysis first.' },
        { status: 400 }
      );
    }

    // 6. Generate token (or return existing if still valid)
    let reportToken = assessment.report_token;
    let expiresAt = assessment.report_expires_at;
    const now = new Date();

    // Check if existing token is still valid
    const existingValid = reportToken && expiresAt && new Date(expiresAt) > now;

    if (!existingValid) {
      // Generate new token with retry logic for collision handling
      let tokenGenerated = false;
      let lastError: unknown = null;

      for (let attempt = 0; attempt < MAX_TOKEN_RETRIES; attempt++) {
        reportToken = nanoid(32); // 32 character URL-safe token
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + EXPIRATION_DAYS);
        expiresAt = expiration.toISOString();

        // Update assessment with new token
        const { error: updateError } = await adminSupabase
          .from('assessments')
          .update({
            report_token: reportToken,
            report_shared_at: now.toISOString(),
            report_expires_at: expiresAt,
          } as never)
          .eq('id', assessmentId);

        if (!updateError) {
          tokenGenerated = true;
          break;
        }

        // Check if this is a unique constraint violation (token collision)
        const isTokenCollision =
          updateError.code === UNIQUE_VIOLATION_CODE ||
          updateError.message?.includes('unique') ||
          updateError.message?.includes('duplicate');

        if (isTokenCollision) {
          console.warn(`Token collision on attempt ${attempt + 1}, retrying...`);
          lastError = updateError;
          continue;
        }

        // For other errors, fail immediately
        console.error('Failed to update report token:', updateError);
        return NextResponse.json(
          { error: 'Failed to generate share link' },
          { status: 500 }
        );
      }

      if (!tokenGenerated) {
        console.error('Failed to generate unique token after retries:', lastError);
        return NextResponse.json(
          { error: 'Failed to generate unique share link. Please try again.' },
          { status: 500 }
        );
      }
    }

    // 7. Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/report/${reportToken}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      token: reportToken,
      expiresAt,
      isNewToken: !existingValid,
    });
  } catch (error) {
    console.error('Share report error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check share status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user's organization
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single<{ organization_id: string }>();

    if (!dbUser?.organization_id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Get assessment share status
    const { data: assessment, error } = await adminSupabase
      .from('assessments')
      .select(`
        id,
        report_token,
        report_shared_at,
        report_expires_at,
        report_viewed_at
      `)
      .eq('id', assessmentId)
      .eq('organization_id', dbUser.organization_id)
      .is('deleted_at', null)
      .single<{
        id: string;
        report_token: string | null;
        report_shared_at: string | null;
        report_expires_at: string | null;
        report_viewed_at: string | null;
      }>();

    if (error || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const isShared = !!assessment.report_token;
    const isExpired = assessment.report_expires_at
      ? new Date(assessment.report_expires_at) <= now
      : false;
    const isViewed = !!assessment.report_viewed_at;

    // Build share URL if token exists
    let shareUrl: string | null = null;
    if (assessment.report_token && !isExpired) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      shareUrl = `${baseUrl}/report/${assessment.report_token}`;
    }

    return NextResponse.json({
      isShared,
      isExpired,
      isViewed,
      shareUrl,
      sharedAt: assessment.report_shared_at,
      expiresAt: assessment.report_expires_at,
      viewedAt: assessment.report_viewed_at,
    });
  } catch (error) {
    console.error('Get share status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

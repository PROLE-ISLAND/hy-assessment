// =====================================================
// Report Link Resend API
// POST /api/report/resend
// Allows candidates to request their report link via email
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendReportLink } from '@/lib/email';

// Rate limiting: max 3 requests per email per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(email);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'メールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limit
    if (!checkRateLimit(normalizedEmail)) {
      return NextResponse.json(
        { error: '送信回数の上限に達しました。しばらく時間をおいてから再度お試しください。' },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();

    // Find assessments with report_token for this email
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select(`
        id,
        report_token,
        report_expires_at,
        candidates!inner (
          persons!inner (
            name,
            email
          )
        )
      `)
      .not('report_token', 'is', null)
      .is('deleted_at', null)
      .returns<Array<{
        id: string;
        report_token: string;
        report_expires_at: string | null;
        candidates: {
          persons: {
            name: string;
            email: string;
          };
        };
      }>>();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'システムエラーが発生しました' },
        { status: 500 }
      );
    }

    // Filter by email (case-insensitive)
    const matchingAssessments = assessments?.filter(
      a => a.candidates.persons.email.toLowerCase() === normalizedEmail
    ) || [];

    // Always return success to prevent email enumeration
    // But only send email if there are valid assessments
    if (matchingAssessments.length > 0) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Send email for each valid (non-expired) assessment
      for (const assessment of matchingAssessments) {
        // Check if expired
        if (assessment.report_expires_at) {
          const expiresAt = new Date(assessment.report_expires_at);
          if (expiresAt <= new Date()) {
            continue; // Skip expired
          }

          const reportUrl = `${baseUrl}/report/${assessment.report_token}`;
          const candidateName = assessment.candidates.persons.name;
          const candidateEmail = assessment.candidates.persons.email;

          await sendReportLink({
            candidateName,
            candidateEmail,
            reportUrl,
            expiresAt,
          });
        }
      }
    }

    // Always return success (privacy: don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'メールアドレスが登録されている場合、レポートリンクを送信しました。',
    });
  } catch (error) {
    console.error('Resend error:', error);
    return NextResponse.json(
      { error: 'システムエラーが発生しました' },
      { status: 500 }
    );
  }
}

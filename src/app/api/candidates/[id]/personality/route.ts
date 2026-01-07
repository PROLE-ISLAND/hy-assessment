// =====================================================
// Candidate Personality API (Issue #192)
// GET /api/candidates/:id/personality - 候補者パーソナリティ取得
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PersonalityAssessment } from '@/types/database';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * 候補者パーソナリティ取得
 * GET /api/candidates/:id/personality
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: candidateId } = await params;
    const supabase = await createClient();

    // 認証チェック
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'unauthorized', message: '認証が必要です' },
        { status: 401 }
      );
    }

    // 候補者の存在確認（RLSで組織フィルタリング）
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('id, organization_id, name')
      .eq('id', candidateId)
      .single<{ id: string; organization_id: string; name: string }>();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: 'candidate_not_found', message: '候補者が見つかりません' },
        { status: 404 }
      );
    }

    // パーソナリティ検査結果取得
    const { data: personality, error: personalityError } = await supabase
      .from('personality_assessments')
      .select('*')
      .eq('candidate_id', candidateId)
      .single<PersonalityAssessment>();

    if (personalityError) {
      // 検査未受験の場合は空レスポンス
      if (personalityError.code === 'PGRST116') {
        return NextResponse.json({
          personality: null,
          hasAssessment: false,
        });
      }

      console.error('Personality fetch error:', personalityError);
      return NextResponse.json(
        { error: 'fetch_failed', message: 'パーソナリティ情報の取得に失敗しました' },
        { status: 500 }
      );
    }

    // レスポンス整形（フロントエンド用）
    const formattedPersonality = {
      id: personality.id,
      candidateId: personality.candidate_id,
      completedAt: personality.completed_at,
      durationSeconds: personality.duration_seconds,
      // DISC
      disc: {
        dominance: personality.disc_dominance,
        influence: personality.disc_influence,
        steadiness: personality.disc_steadiness,
        conscientiousness: personality.disc_conscientiousness,
        primaryFactor: personality.disc_primary_factor,
        profilePattern: personality.disc_profile_pattern,
      },
      // Stress
      stress: {
        overall: personality.stress_overall,
        details: personality.stress_details,
        riskLevel: personality.stress_risk_level,
      },
      // EQ
      eq: {
        overall: personality.eq_overall,
        details: personality.eq_details,
      },
      // Values
      values: {
        achievement: personality.values_achievement,
        stability: personality.values_stability,
        growth: personality.values_growth,
        socialContribution: personality.values_social_contribution,
        autonomy: personality.values_autonomy,
        primary: personality.values_primary,
      },
    };

    return NextResponse.json({
      personality: formattedPersonality,
      hasAssessment: true,
    });
  } catch (error) {
    console.error('Candidate personality GET error:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

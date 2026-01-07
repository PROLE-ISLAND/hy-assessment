// =====================================================
// Personality Assessment Results API (Issue #192)
// POST /api/assessments/personality/:candidateId - 検査結果保存
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { personalityAssessmentSubmitSchema } from '@/lib/validations/personality';
import { calculatePersonalityScores } from '@/lib/assessments/personality-scoring';
import type { PersonalityAssessment } from '@/types/database';

type RouteParams = {
  params: Promise<{ candidateId: string }>;
};

/**
 * 検査結果保存
 * POST /api/assessments/personality/:candidateId
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { candidateId } = await params;
    const supabase = await createClient();

    // 候補者の存在確認と組織ID取得
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('id, organization_id, status')
      .eq('id', candidateId)
      .single<{ id: string; organization_id: string; status: string }>();

    if (candidateError || !candidate) {
      return NextResponse.json(
        { error: 'candidate_not_found', message: '候補者が見つかりません' },
        { status: 404 }
      );
    }

    // 既存の検査結果確認（重複防止）
    const { data: existingAssessment } = await supabase
      .from('personality_assessments')
      .select('id')
      .eq('candidate_id', candidateId)
      .single();

    if (existingAssessment) {
      return NextResponse.json(
        { error: 'already_completed', message: 'この候補者は既に検査を完了しています' },
        { status: 409 }
      );
    }

    // リクエストボディのパース・バリデーション
    const body = await request.json();
    const parseResult = personalityAssessmentSubmitSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: '回答データが不正です',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { responses, durationSeconds } = parseResult.data;

    // スコア計算
    const scores = calculatePersonalityScores(responses);

    // 検査結果保存
    // Note: 型アサーションは新テーブル追加時にSupabase型が未生成のため必要
    const { data: assessment, error: createError } = await supabase
      .from('personality_assessments' as 'users')
      .insert({
        organization_id: candidate.organization_id,
        candidate_id: candidateId,
        // DISC
        disc_dominance: scores.disc.dominance,
        disc_influence: scores.disc.influence,
        disc_steadiness: scores.disc.steadiness,
        disc_conscientiousness: scores.disc.conscientiousness,
        disc_primary_factor: scores.disc.primaryFactor,
        disc_profile_pattern: scores.disc.profilePattern,
        // Stress
        stress_overall: scores.stress.overall,
        stress_details: scores.stress.details,
        stress_risk_level: scores.stress.riskLevel,
        // EQ
        eq_overall: scores.eq.overall,
        eq_details: scores.eq.details,
        // Values
        values_achievement: scores.values.achievement,
        values_stability: scores.values.stability,
        values_growth: scores.values.growth,
        values_social_contribution: scores.values.socialContribution,
        values_autonomy: scores.values.autonomy,
        values_primary: scores.values.primary,
        // Meta
        responses: responses,
        duration_seconds: durationSeconds,
      } as never)
      .select()
      .single<PersonalityAssessment>();

    if (createError) {
      console.error('Personality assessment create error:', createError);
      return NextResponse.json(
        { error: 'create_failed', message: '検査結果の保存に失敗しました' },
        { status: 500 }
      );
    }

    // 候補者のステータス更新（検査完了）
    await supabase
      .from('candidates')
      .update({ status: 'completed' } as never)
      .eq('id', candidateId);

    return NextResponse.json(
      {
        assessment,
        scores: {
          disc: scores.disc,
          stress: scores.stress,
          eq: scores.eq,
          values: scores.values,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Personality assessment POST error:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * 検査結果取得
 * GET /api/assessments/personality/:candidateId
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { candidateId } = await params;
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

    // 検査結果取得（RLSで組織フィルタリング）
    const { data: assessment, error: fetchError } = await supabase
      .from('personality_assessments')
      .select('*')
      .eq('candidate_id', candidateId)
      .single<PersonalityAssessment>();

    if (fetchError || !assessment) {
      return NextResponse.json(
        { error: 'not_found', message: '検査結果が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('Personality assessment GET error:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * Analysis Factory for E2E Tests
 *
 * テスト用のAI分析結果データを作成するファクトリー
 * Admin Clientを使用してRLSをバイパス
 *
 * @see Issue #179 Phase 2: 個別ファクトリー実装
 */

import { createAdminSupabase } from '../helpers/supabase-admin';

/**
 * テスト分析結果の型定義
 */
export interface TestAnalysis {
  id: string;
}

/**
 * モック分析結果の型定義
 */
export interface MockAnalysisResult {
  overall_score: number;
  judgment: string;
  summary: string;
  personality: {
    behavioral: {
      dominance: number;
      influence: number;
      steadiness: number;
      conscientiousness: number;
    };
    stress: {
      pressureHandling: number;
      recoverySpeed: number;
      emotionalStability: number;
      adaptability: number;
      overallScore: number;
      riskLevel: 'low' | 'medium' | 'high';
    };
    eq: {
      selfAwareness: number;
      selfManagement: number;
      socialAwareness: number;
      relationshipManagement: number;
      overallScore: number;
    };
    values: {
      achievement: number;
      stability: number;
      growth: number;
      socialContribution: number;
      autonomy: number;
      primaryValue: string;
    };
  };
  positionFit: {
    scores: Record<string, number>;
    recommendation: string;
  };
}

/**
 * デフォルトのモック分析結果を生成
 */
function createMockAnalysisResult(): MockAnalysisResult {
  return {
    overall_score: 75,
    judgment: '採用推奨',
    summary: 'E2Eテスト用のモック分析結果です。この候補者は総合的に優秀な評価を得ています。',
    personality: {
      behavioral: {
        dominance: 65,
        influence: 70,
        steadiness: 75,
        conscientiousness: 80,
      },
      stress: {
        pressureHandling: 72,
        recoverySpeed: 68,
        emotionalStability: 75,
        adaptability: 70,
        overallScore: 71,
        riskLevel: 'low',
      },
      eq: {
        selfAwareness: 70,
        selfManagement: 72,
        socialAwareness: 68,
        relationshipManagement: 74,
        overallScore: 71,
      },
      values: {
        achievement: 75,
        stability: 65,
        growth: 80,
        socialContribution: 60,
        autonomy: 70,
        primaryValue: '成長・挑戦',
      },
    },
    positionFit: {
      scores: {
        account_manager: 82,
        sales: 78,
        customer_support: 75,
        engineering: 65,
      },
      recommendation: 'アカウントマネージャーとして高い適性を示しています。',
    },
  };
}

/**
 * テスト分析結果を作成
 *
 * @param assessmentId - 検査ID
 * @param organizationId - 組織ID
 * @param customResult - カスタム分析結果（オプション）
 * @returns 作成された分析結果情報
 */
export async function createTestAnalysis(
  assessmentId: string,
  organizationId: string,
  customResult?: Partial<MockAnalysisResult>
): Promise<TestAnalysis> {
  const supabase = createAdminSupabase();

  const mockResult = {
    ...createMockAnalysisResult(),
    ...customResult,
  };

  const { data: analysis, error } = await supabase
    .from('ai_analyses')
    .insert({
      organization_id: organizationId,
      assessment_id: assessmentId,
      model: 'e2e-mock',
      prompt_version: 'test-v1',
      result: mockResult,
      tokens_used: 0,
      processing_time_ms: 0,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(
      `[AnalysisFactory] Failed to create analysis: ${error.message}`
    );
  }

  console.log(`[AnalysisFactory] Created analysis: ${analysis.id}`);

  return { id: analysis.id };
}

/**
 * 特定のスコアでテスト分析結果を作成
 *
 * @param assessmentId - 検査ID
 * @param organizationId - 組織ID
 * @param overallScore - 総合スコア（0-100）
 * @param judgment - 判定（採用推奨、要検討、不採用等）
 */
export async function createTestAnalysisWithScore(
  assessmentId: string,
  organizationId: string,
  overallScore: number,
  judgment: string
): Promise<TestAnalysis> {
  return createTestAnalysis(assessmentId, organizationId, {
    overall_score: overallScore,
    judgment,
  });
}

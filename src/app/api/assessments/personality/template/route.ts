// =====================================================
// Personality Assessment Template API (Issue #192)
// GET /api/assessments/personality/template
// =====================================================

import { NextResponse } from 'next/server';
import { personalityTemplate } from '@/lib/assessments/personality-template';

/**
 * 検査テンプレート取得
 * GET /api/assessments/personality/template
 * 認証不要（トークン認証は別途実装）
 */
export async function GET() {
  try {
    return NextResponse.json({
      template: personalityTemplate,
    });
  } catch (error) {
    console.error('Personality template GET error:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

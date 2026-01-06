/**
 * Report Factory for E2E Tests
 *
 * テスト用のレポート共有トークンを作成するファクトリー
 * Admin Clientを使用してRLSをバイパス
 *
 * @see Issue #179 Phase 2: 個別ファクトリー実装
 */

import { createAdminSupabase } from '../helpers/supabase-admin';

/**
 * レポートトークンを生成
 *
 * 紛らわしい文字（0, O, I, l等）を除外した32文字のトークン
 */
function generateReportToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * テストレポート共有トークンを作成
 *
 * @param analysisId - 分析結果ID
 * @param expirationDays - 有効期限（日数、デフォルト30日）
 * @returns 作成されたトークン文字列
 */
export async function createTestReportToken(
  analysisId: string,
  expirationDays: number = 30
): Promise<string> {
  const supabase = createAdminSupabase();

  const token = generateReportToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  const { error } = await supabase.from('report_shares').insert({
    analysis_id: analysisId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error(
      `[ReportFactory] Failed to create report token: ${error.message}`
    );
  }

  console.log(
    `[ReportFactory] Created report token: ${token.slice(0, 8)}... (expires: ${expiresAt.toISOString()})`
  );

  return token;
}

/**
 * 期限切れのテストレポートトークンを作成
 *
 * テスト用：期限切れシナリオの検証に使用
 *
 * @param analysisId - 分析結果ID
 * @returns 作成された期限切れトークン
 */
export async function createExpiredTestReportToken(
  analysisId: string
): Promise<string> {
  const supabase = createAdminSupabase();

  const token = generateReportToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() - 1); // 昨日の日付（期限切れ）

  const { error } = await supabase.from('report_shares').insert({
    analysis_id: analysisId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error(
      `[ReportFactory] Failed to create expired report token: ${error.message}`
    );
  }

  console.log(
    `[ReportFactory] Created expired report token: ${token.slice(0, 8)}...`
  );

  return token;
}

/**
 * レポートトークンを削除
 *
 * @param token - 削除するトークン
 */
export async function deleteTestReportToken(token: string): Promise<void> {
  const supabase = createAdminSupabase();

  const { error } = await supabase
    .from('report_shares')
    .delete()
    .eq('token', token);

  if (error) {
    console.warn(
      `[ReportFactory] Warning: Failed to delete token: ${error.message}`
    );
    return;
  }

  console.log(`[ReportFactory] Deleted report token: ${token.slice(0, 8)}...`);
}

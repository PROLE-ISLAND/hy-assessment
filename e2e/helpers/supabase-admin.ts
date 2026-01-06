/**
 * Supabase Admin Client for E2E Test Data Factory
 *
 * RLSをバイパスしてテストデータを直接操作するためのAdmin Client
 * SUPABASE_SERVICE_ROLE_KEY を使用
 *
 * @see docs/requirements/issue-178-e2e-factory-base.md
 */

import { createClient } from '@supabase/supabase-js';

/**
 * E2Eテスト用のSupabase Admin Client型
 *
 * E2Eテストではランタイム動作が重要なため、
 * 厳密な型チェックよりも柔軟性を優先
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AdminSupabaseClient = ReturnType<typeof createClient<any>>;

/**
 * Supabase Admin Clientを作成
 *
 * Pre-mortem対策:
 * - 環境変数未設定時は明確なエラーメッセージを表示
 * - SERVICE_ROLE_KEYを使用してRLSをバイパス
 *
 * @returns Supabase Admin Client
 * @throws Error 環境変数が設定されていない場合
 */
export function createAdminSupabase(): AdminSupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      '[E2E Factory] NEXT_PUBLIC_SUPABASE_URL is not set.\n' +
        'Please ensure this environment variable is configured in your CI/CD or .env.local file.'
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      '[E2E Factory] SUPABASE_SERVICE_ROLE_KEY is not set.\n' +
        'This is required for Admin Client to bypass RLS.\n' +
        'Please add SUPABASE_SERVICE_ROLE_KEY to your GitHub Secrets or .env.local file.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Admin Client の接続テスト
 *
 * @returns true if connection is successful
 * @throws Error if connection fails
 */
export async function testAdminConnection(): Promise<boolean> {
  const supabase = createAdminSupabase();

  // organizations テーブルから1件取得して接続確認
  const { error } = await supabase
    .from('persons')
    .select('id')
    .limit(1);

  if (error) {
    throw new Error(
      `[E2E Factory] Admin Client connection test failed: ${error.message}`
    );
  }

  return true;
}

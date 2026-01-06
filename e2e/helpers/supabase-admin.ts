/**
 * Supabase Admin Client for E2E Test Data Factory
 *
 * RLSをバイパスしてテストデータを直接操作するためのAdmin Client
 * SUPABASE_SERVICE_ROLE_KEY を使用
 *
 * @see docs/requirements/issue-178-e2e-factory-base.md
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database型はe2eから直接参照できないため、必要最小限の型を定義
// Phase 2でより詳細な型定義を追加予定
export interface Database {
  public: {
    Tables: {
      persons: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          email: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      candidates: {
        Row: {
          id: string;
          organization_id: string;
          person_id: string;
          position: string | null;
          desired_positions: string[];
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          person_id: string;
          position?: string | null;
          desired_positions?: string[];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      assessments: {
        Row: {
          id: string;
          organization_id: string;
          candidate_id: string;
          template_id: string | null;
          token: string;
          status: 'pending' | 'in_progress' | 'completed' | 'expired';
          progress: Record<string, unknown>;
          expires_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          candidate_id: string;
          template_id?: string | null;
          token: string;
          status?: 'pending' | 'in_progress' | 'completed' | 'expired';
          progress?: Record<string, unknown>;
          expires_at: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      ai_analyses: {
        Row: {
          id: string;
          organization_id: string;
          assessment_id: string;
          model: string;
          prompt_version: string;
          result: Record<string, unknown>;
          tokens_used: number;
          processing_time_ms: number;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          assessment_id: string;
          model: string;
          prompt_version: string;
          result: Record<string, unknown>;
          tokens_used?: number;
          processing_time_ms?: number;
          created_at?: string;
          deleted_at?: string | null;
        };
      };
      report_shares: {
        Row: {
          id: string;
          analysis_id: string;
          token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          token: string;
          expires_at: string;
          created_at?: string;
        };
      };
      assessment_templates: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          created_at: string;
        };
      };
    };
  };
}

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
export function createAdminSupabase(): SupabaseClient<Database> {
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

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
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

/**
 * E2E Test Data Setup
 *
 * Playwrightのglobalセットアップとして実行され、
 * ファクトリーを使用してテストデータを作成し、
 * fixtures.jsonに保存する
 *
 * @see Issue #180 - Phase 3: セットアップ統合
 * @see docs/requirements/issue-178-e2e-factory-base.md
 */

import { test as setup } from '@playwright/test';
import {
  createTestCandidate,
  issueTestAssessment,
  completeTestAssessment,
  createTestAnalysis,
  createTestReportToken,
  createAdminSupabase,
} from '../factories';
import { saveTestFixtures, type TestFixtures } from '../helpers/test-data-manager';

// テスト用の組織IDを取得する関数
async function getTestOrganizationId(): Promise<string> {
  const adminSupabase = createAdminSupabase();

  // E2Eテストユーザーのメールアドレスから組織IDを取得
  const testEmail = process.env.E2E_TEST_EMAIL;
  if (!testEmail) {
    throw new Error('E2E_TEST_EMAIL environment variable is not set');
  }

  // listUsersでメールアドレスからユーザーを検索
  const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  const testUser = usersData.users.find((u: { email?: string }) => u.email === testEmail);
  if (!testUser) {
    throw new Error(`Test user not found: ${testEmail}`);
  }

  // profilesテーブルから組織IDを取得
  const { data: profile, error: profileError } = await adminSupabase
    .from('profiles')
    .select('organization_id')
    .eq('id', testUser.id)
    .single();

  if (profileError || !profile) {
    throw new Error(`Failed to get profile: ${profileError?.message || 'Profile not found'}`);
  }

  return profile.organization_id;
}

/**
 * テストデータセットアップ
 *
 * 以下のデータを順番に作成:
 * 1. 候補者（Person + Candidate）
 * 2. 検査発行 → 完了
 * 3. AI分析結果
 * 4. レポート共有トークン
 */
setup('create test data fixtures', async () => {
  console.log('[DataSetup] Starting test data creation...');

  // 組織IDを取得
  const organizationId = await getTestOrganizationId();
  console.log(`[DataSetup] Using organization: ${organizationId}`);

  // 1. 候補者作成
  console.log('[DataSetup] Creating test candidate...');
  const candidate = await createTestCandidate(organizationId);
  console.log(`[DataSetup] Created candidate: ${candidate.id}`);

  // 2. 検査発行
  console.log('[DataSetup] Issuing test assessment...');
  const assessment = await issueTestAssessment(candidate.id, organizationId);
  console.log(`[DataSetup] Issued assessment: ${assessment.id}`);

  // 3. 検査完了
  console.log('[DataSetup] Completing test assessment...');
  await completeTestAssessment(assessment.id);
  console.log('[DataSetup] Assessment completed');

  // 4. AI分析結果作成
  console.log('[DataSetup] Creating test analysis...');
  const analysis = await createTestAnalysis(assessment.id, organizationId);
  console.log(`[DataSetup] Created analysis: ${analysis.id}`);

  // 5. レポート共有トークン作成
  console.log('[DataSetup] Creating test report token...');
  const reportToken = await createTestReportToken(analysis.id);
  console.log(`[DataSetup] Created report token: ${reportToken.slice(0, 8)}...`);

  // フィクスチャとして保存
  const fixtures: TestFixtures = {
    candidate: {
      id: candidate.id,
      personId: candidate.personId,
      name: candidate.name,
      email: candidate.email,
    },
    assessment: {
      id: assessment.id,
      token: assessment.token,
    },
    analysis: {
      id: analysis.id,
    },
    reportToken: reportToken,
    organizationId,
    createdAt: new Date().toISOString(),
  };

  saveTestFixtures(fixtures);
  console.log('[DataSetup] Test data setup completed successfully!');
});

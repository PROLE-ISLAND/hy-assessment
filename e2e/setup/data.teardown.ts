/**
 * E2E Test Data Teardown
 *
 * Playwrightのglobalティアダウンとして実行され、
 * テストで作成したデータをクリーンアップする
 *
 * @see Issue #180 - Phase 3: セットアップ統合
 * @see docs/requirements/issue-178-e2e-factory-base.md
 */

import { test as teardown } from '@playwright/test';
import {
  deleteTestCandidate,
  deleteTestReportToken,
  createAdminSupabase,
} from '../factories';
import {
  getTestFixtures,
  clearTestFixtures,
  hasTestFixtures,
} from '../helpers/test-data-manager';

/**
 * テストデータクリーンアップ
 *
 * 作成したデータを逆順で削除:
 * 1. レポート共有トークン
 * 2. AI分析結果（カスケード削除されるため明示的削除不要）
 * 3. 検査（カスケード削除されるため明示的削除不要）
 * 4. 候補者（ソフトデリート）
 * 5. フィクスチャファイル削除
 */
teardown('cleanup test data fixtures', async () => {
  console.log('[DataTeardown] Starting test data cleanup...');

  // フィクスチャが存在しない場合はスキップ
  if (!hasTestFixtures()) {
    console.log('[DataTeardown] No fixtures found, skipping cleanup');
    return;
  }

  const fixtures = getTestFixtures();
  const adminSupabase = createAdminSupabase();

  try {
    // 1. レポート共有トークン削除
    if (fixtures.reportToken) {
      console.log('[DataTeardown] Deleting report token...');
      await deleteTestReportToken(fixtures.reportToken);
      console.log('[DataTeardown] Report token deleted');
    }

    // 2. AI分析結果削除
    // assessment_ai_analysis はアセスメント削除時にカスケード削除されるが、
    // 念のため明示的に削除
    if (fixtures.analysis?.id) {
      console.log('[DataTeardown] Deleting analysis...');
      const { error: analysisError } = await adminSupabase
        .from('assessment_ai_analysis')
        .delete()
        .eq('id', fixtures.analysis.id);
      if (analysisError) {
        console.warn(`[DataTeardown] Failed to delete analysis: ${analysisError.message}`);
      } else {
        console.log('[DataTeardown] Analysis deleted');
      }
    }

    // 3. 検査削除
    // assessments は候補者削除時にカスケード削除されるが、
    // 念のため明示的に削除
    if (fixtures.assessment?.id) {
      console.log('[DataTeardown] Deleting assessment...');
      const { error: assessmentError } = await adminSupabase
        .from('assessments')
        .delete()
        .eq('id', fixtures.assessment.id);
      if (assessmentError) {
        console.warn(`[DataTeardown] Failed to delete assessment: ${assessmentError.message}`);
      } else {
        console.log('[DataTeardown] Assessment deleted');
      }
    }

    // 4. 候補者削除（ソフトデリート）
    if (fixtures.candidate?.id) {
      console.log('[DataTeardown] Deleting candidate...');
      await deleteTestCandidate(fixtures.candidate.id);
      console.log('[DataTeardown] Candidate deleted');
    }

    // 5. Person削除
    // 候補者と関連付けられているPersonも削除
    if (fixtures.candidate?.personId) {
      console.log('[DataTeardown] Deleting person...');
      const { error: personError } = await adminSupabase
        .from('persons')
        .delete()
        .eq('id', fixtures.candidate.personId);
      if (personError) {
        console.warn(`[DataTeardown] Failed to delete person: ${personError.message}`);
      } else {
        console.log('[DataTeardown] Person deleted');
      }
    }

    console.log('[DataTeardown] Database cleanup completed');
  } catch (error) {
    console.error('[DataTeardown] Error during cleanup:', error);
    // エラーが発生してもフィクスチャファイルは削除する
  }

  // フィクスチャファイル削除
  clearTestFixtures();
  console.log('[DataTeardown] Test data cleanup completed successfully!');
});

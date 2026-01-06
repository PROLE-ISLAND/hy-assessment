/**
 * E2E Test Data Factories
 *
 * テストデータを動的生成するファクトリー関数のエクスポート集約
 *
 * @see Issue #177 E2Eテストデータ設計・ファクトリー基盤構築
 * @see Issue #178 Phase 1: ファクトリー基盤
 * @see Issue #179 Phase 2: 個別ファクトリー実装
 */

// =====================================================
// Factory Version
// =====================================================

/**
 * ファクトリーシステムのバージョン
 * 互換性確認やデバッグに使用
 */
export const FACTORY_VERSION = '1.0.0';

// =====================================================
// Candidate Factory
// =====================================================

export {
  createTestCandidate,
  deleteTestCandidate,
} from './candidate.factory';
export type {
  TestCandidate,
  CreateTestCandidateOptions,
} from './candidate.factory';

// =====================================================
// Assessment Factory
// =====================================================

export {
  issueTestAssessment,
  completeTestAssessment,
  updateTestAssessmentProgress,
} from './assessment.factory';
export type { TestAssessment } from './assessment.factory';

// =====================================================
// Analysis Factory
// =====================================================

export {
  createTestAnalysis,
  createTestAnalysisWithScore,
} from './analysis.factory';
export type {
  TestAnalysis,
  MockAnalysisResult,
} from './analysis.factory';

// =====================================================
// Report Factory
// =====================================================

export {
  createTestReportToken,
  createExpiredTestReportToken,
  deleteTestReportToken,
} from './report.factory';

// =====================================================
// Helper Re-exports
// =====================================================

export {
  createAdminSupabase,
  testAdminConnection,
} from '../helpers/supabase-admin';
export type { AdminSupabaseClient } from '../helpers/supabase-admin';

export {
  saveTestFixtures,
  getTestFixtures,
  hasTestFixtures,
  clearTestFixtures,
  getFixturesDir,
  getFixturesPath,
} from '../helpers/test-data-manager';
export type { TestFixtures } from '../helpers/test-data-manager';

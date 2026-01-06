/**
 * E2E Test Data Factories
 *
 * テストデータを動的生成するファクトリー関数のエクスポート集約
 *
 * Phase 1: 基盤構築（このファイル）
 * Phase 2: 個別ファクトリー実装（#179）
 *   - candidate.factory.ts
 *   - assessment.factory.ts
 *   - analysis.factory.ts
 *   - report.factory.ts
 *
 * @see docs/requirements/issue-178-e2e-factory-base.md
 * @see Issue #177 E2Eテストデータ設計・ファクトリー基盤構築
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
// Phase 2 で追加予定のエクスポート
// =====================================================

// Candidate Factory (#179)
// export { createTestCandidate, deleteTestCandidate } from './candidate.factory';
// export type { TestCandidate } from './candidate.factory';

// Assessment Factory (#179)
// export { issueTestAssessment, completeTestAssessment } from './assessment.factory';
// export type { TestAssessment } from './assessment.factory';

// Analysis Factory (#179)
// export { createTestAnalysis } from './analysis.factory';
// export type { TestAnalysis } from './analysis.factory';

// Report Factory (#179)
// export { createTestReportToken } from './report.factory';

// =====================================================
// Helper Re-exports
// =====================================================

export { createAdminSupabase, testAdminConnection } from '../helpers/supabase-admin';
export type { Database } from '../helpers/supabase-admin';

export {
  saveTestFixtures,
  getTestFixtures,
  hasTestFixtures,
  clearTestFixtures,
  getFixturesDir,
  getFixturesPath,
} from '../helpers/test-data-manager';
export type { TestFixtures } from '../helpers/test-data-manager';

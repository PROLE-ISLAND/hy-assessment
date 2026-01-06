/**
 * Test Data Manager for E2E Tests
 *
 * fixtures.json を介してテストデータをセットアップとテスト間で共有する
 * パスは定数で一元管理（Pre-mortem対策）
 *
 * @see docs/requirements/issue-178-e2e-factory-base.md
 */

import fs from 'fs';
import path from 'path';

// パスを定数で一元管理（Pre-mortem対策: パス不整合防止）
const FIXTURES_DIR = path.join(process.cwd(), 'e2e', '.test-data');
const FIXTURES_PATH = path.join(FIXTURES_DIR, 'fixtures.json');

/**
 * テストデータの型定義
 *
 * Phase 2-4で作成されるファクトリーが生成するデータの型
 */
export interface TestFixtures {
  /** テスト候補者情報 */
  candidate: {
    id: string;
    personId: string;
    name: string;
    email: string;
  };
  /** テスト検査情報 */
  assessment: {
    id: string;
    token: string;
  };
  /** テスト分析結果 */
  analysis: {
    id: string;
  };
  /** レポート共有トークン */
  reportToken: string;
  /** 組織ID（テストユーザーが所属する組織） */
  organizationId: string;
  /** データ作成日時（デバッグ用） */
  createdAt: string;
}

/**
 * テストフィクスチャをファイルに保存
 *
 * data.setup.ts から呼び出され、ファクトリーで生成したデータを保存
 *
 * @param fixtures 保存するテストデータ
 */
export function saveTestFixtures(fixtures: TestFixtures): void {
  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  fs.writeFileSync(FIXTURES_PATH, JSON.stringify(fixtures, null, 2), 'utf-8');
  console.log(`[TestDataManager] Saved fixtures to ${FIXTURES_PATH}`);
}

/**
 * テストフィクスチャをファイルから読み込み
 *
 * 各テストファイルから呼び出され、セットアップで作成されたデータを取得
 *
 * @returns テストデータ
 * @throws Error ファイルが存在しない場合（data-setupが実行されていない）
 */
export function getTestFixtures(): TestFixtures {
  if (!fs.existsSync(FIXTURES_PATH)) {
    throw new Error(
      `[TestDataManager] Test fixtures not found at ${FIXTURES_PATH}.\n` +
        'Please ensure the "data-setup" project has run before your tests.\n' +
        'Check playwright.config.ts for project dependencies.'
    );
  }

  const content = fs.readFileSync(FIXTURES_PATH, 'utf-8');
  const fixtures = JSON.parse(content) as TestFixtures;

  console.log(
    `[TestDataManager] Loaded fixtures (created at ${fixtures.createdAt})`
  );

  return fixtures;
}

/**
 * テストフィクスチャが存在するかチェック
 *
 * テスト前の事前条件確認に使用
 *
 * @returns ファイルが存在すればtrue
 */
export function hasTestFixtures(): boolean {
  return fs.existsSync(FIXTURES_PATH);
}

/**
 * テストフィクスチャをクリア
 *
 * data.teardown.ts から呼び出され、テスト終了後にファイルを削除
 */
export function clearTestFixtures(): void {
  if (fs.existsSync(FIXTURES_PATH)) {
    fs.unlinkSync(FIXTURES_PATH);
    console.log(`[TestDataManager] Cleared fixtures at ${FIXTURES_PATH}`);
  }
}

/**
 * フィクスチャディレクトリのパスを取得
 *
 * .gitignore 設定などで使用
 */
export function getFixturesDir(): string {
  return FIXTURES_DIR;
}

/**
 * フィクスチャファイルのパスを取得
 */
export function getFixturesPath(): string {
  return FIXTURES_PATH;
}

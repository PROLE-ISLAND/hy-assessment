## 1. 調査レポート

**調査方法**: コードベース分析・CI結果分析・RLS問題調査
**調査日**: 2026-01-06
**関連PR**: #143 (Gold E2Eテスト体系を追加)

### Investigation Report 要約

| 項目 | 内容 |
|------|------|
| 既存システム名 | Playwright E2Eテスト基盤 |
| エントリーポイント | UI: e2e/gold/*.spec.ts / Setup: e2e/auth.setup.ts |
| 主要データモデル | TestFixtures (候補者、検査、分析、レポート) |
| キーファイル | `e2e/fixtures.ts`, `e2e/auth.setup.ts`, `playwright.config.ts`, `e2e/helpers/deterministic-wait.ts` |
| 拡張ポイント | `e2e/factories/` (新規), `e2e/helpers/` (拡張) |
| 破壊ポイント | 既存のauth.setup.tsとの統合順序 |
| やりたいこと | E2Eテストデータを動的生成するファクトリー基盤を構築する |

### 問題分析

現在のGold E2Eテスト（GS-HY-003〜006）は環境変数に依存：
- `E2E_TEST_CANDIDATE_ID`
- `E2E_TEST_ASSESSMENT_TOKEN`
- `E2E_TEST_REPORT_TOKEN`

これらが設定されていないためCIでテストがスキップされる（6/14テスト）。

---

## 2. Phase 2: 要件定義・ユースケース

### 2.1 機能概要

| 項目 | 内容 |
|------|------|
| **なぜ必要か（Why）** | E2Eテストが環境変数に依存しており、CIで安定実行できない |
| **誰が使うか（Who）** | E2Eテスト（Playwright）、CI/CD |
| **何を達成するか（What）** | テストデータを動的生成し、環境非依存のE2Eテストを実現 |

### 2.2 ユースケース定義（Role × Outcome）

| UC-ID | Role | Outcome | Channel | 説明 |
|-------|------|---------|---------|------|
| UC-E2E-SETUP-CREATE-CLI | Setup | テストデータ作成 | CLI | data.setup.tsがファクトリーでデータ作成 |
| UC-E2E-TEST-READ-CLI | Test | テストデータ読込 | CLI | 各テストがfixtures.jsonからデータ取得 |
| UC-E2E-TEARDOWN-DELETE-CLI | Teardown | テストデータ削除 | CLI | data.teardown.tsがデータクリーンアップ |

### 2.3 Role × Value マトリクス

| Role | 提供する価値 | 受け取る価値 | 関連Outcome |
|------|-------------|-------------|-------------|
| Setup | テストデータ生成 | — | CREATE |
| Test | — | 安定したテストデータ | READ |
| Teardown | クリーンな環境 | — | DELETE |

### 2.4 カバレッジマトリクス

| Role＼Outcome | CREATE | READ | DELETE |
|---------------|:------:|:----:|:------:|
| Setup | ✅ Phase 3 | — | — |
| Test | — | ✅ Phase 4 | — |
| Teardown | — | — | ✅ Phase 3 |

### 2.5 入力ソースチェックリスト

| 入力ソース | 確認状態 | 抽出UC数 | 備考 |
|-----------|---------|---------|------|
| Issue #177 親Issue | ✅ | 3 | 設計方針確定済み |
| PR #143 CI結果 | ✅ | - | 問題の根本原因特定 |
| 既存e2e/ディレクトリ | ✅ | - | 拡張ポイント特定 |
| playwright.config.ts | ✅ | - | project設定確認 |

### 2.6 外部整合性チェック

- [x] Issue #177の設計方針と整合している
- [x] 既存のauth.setup.tsパターンに従っている
- [x] Playwrightのproject依存機能を活用している

---

## 3. Phase 3: 品質基準

### 3.1 DoD Level 選択

- [ ] Bronze (27観点: 80%カバレッジ)
- [x] Silver (31観点: 85%カバレッジ) ← 選択
- [ ] Gold (19観点: 95%カバレッジ)

**選定理由**: テスト基盤は高品質が必要だが、E2Eテスト自体がGold基準を検証するため、基盤はSilverで十分。

### 3.2 Pre-mortem（失敗シナリオ）

| # | 失敗シナリオ | 発生確率 | 対策 | 確認方法 |
|---|-------------|---------|------|---------|
| 1 | SUPABASE_SERVICE_ROLE_KEY未設定でAdmin Client失敗 | 中 | 明確なエラーメッセージと環境変数チェック | CIで検証 |
| 2 | fixtures.jsonのパス不整合 | 低 | 定数でパスを一元管理 | ユニットテスト |
| 3 | 型定義の不整合でランタイムエラー | 中 | TypeScript厳密型チェック | tsc --noEmit |
| 4 | 既存テストとの互換性破壊 | 低 | 既存テストは変更せず、新規ファイルのみ追加 | CI全テスト実行 |

---

## 4. Phase 4: 技術設計

### 4.1 データベース設計

**新規テーブル:** なし（既存テーブルを使用）

#### 使用テーブル（ファクトリー対象）

| テーブル | ファクトリー | 用途 |
|---------|-------------|------|
| persons | createTestCandidate | テスト候補者の基本情報 |
| candidates | createTestCandidate | テスト候補者レコード |
| assessments | issueTestAssessment | テスト検査 |
| ai_analyses | createTestAnalysis | モック分析結果 |
| report_shares | createTestReportToken | レポート共有トークン |

### 4.2 API設計

**新規API:** なし（Supabase Admin Clientを直接使用）

### 4.3 ファイル設計（Phase 1スコープ）

#### ディレクトリ構造

```
e2e/
├── .test-data/           # gitignore対象（新規）
│   └── fixtures.json     # 動的生成データ
├── factories/            # 新規ディレクトリ
│   └── index.ts          # エクスポート集約
└── helpers/
    ├── deterministic-wait.ts  # 既存
    ├── supabase-admin.ts      # 新規
    └── test-data-manager.ts   # 新規
```

#### supabase-admin.ts 設計

```typescript
// e2e/helpers/supabase-admin.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createAdminSupabase(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables for admin client. ' +
      'Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

#### test-data-manager.ts 設計

```typescript
// e2e/helpers/test-data-manager.ts
import fs from 'fs';
import path from 'path';

const FIXTURES_DIR = 'e2e/.test-data';
const FIXTURES_PATH = path.join(FIXTURES_DIR, 'fixtures.json');

export interface TestFixtures {
  candidate: {
    id: string;
    personId: string;
    name: string;
    email: string;
  };
  assessment: {
    id: string;
    token: string;
  };
  analysis: {
    id: string;
  };
  reportToken: string;
  organizationId: string;
  createdAt: string;
}

export function saveTestFixtures(fixtures: TestFixtures): void {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  fs.writeFileSync(FIXTURES_PATH, JSON.stringify(fixtures, null, 2));
  console.log(`[TestDataManager] Saved fixtures to ${FIXTURES_PATH}`);
}

export function getTestFixtures(): TestFixtures {
  if (!fs.existsSync(FIXTURES_PATH)) {
    throw new Error(
      `Test fixtures not found at ${FIXTURES_PATH}. ` +
      'Run data-setup project first.'
    );
  }
  const content = fs.readFileSync(FIXTURES_PATH, 'utf-8');
  return JSON.parse(content) as TestFixtures;
}

export function hasTestFixtures(): boolean {
  return fs.existsSync(FIXTURES_PATH);
}

export function clearTestFixtures(): void {
  if (fs.existsSync(FIXTURES_PATH)) {
    fs.unlinkSync(FIXTURES_PATH);
    console.log(`[TestDataManager] Cleared fixtures at ${FIXTURES_PATH}`);
  }
}
```

#### factories/index.ts 設計

```typescript
// e2e/factories/index.ts
// Phase 2で個別ファクトリーを追加予定
// export * from './candidate.factory';
// export * from './assessment.factory';
// export * from './analysis.factory';
// export * from './report.factory';

// Phase 1: プレースホルダー
export const FACTORY_VERSION = '1.0.0';
```

### 4.4 変更ファイル一覧

| ファイルパス | 変更種別 | 概要 |
|-------------|---------|------|
| `e2e/helpers/supabase-admin.ts` | 新規 | Supabase Admin Client |
| `e2e/helpers/test-data-manager.ts` | 新規 | fixtures.json管理 |
| `e2e/factories/index.ts` | 新規 | ファクトリーエクスポート集約 |
| `.gitignore` | 修正 | `e2e/.test-data/` 追加 |

---

## 5. Phase 5: テスト設計

### 5.1 Gold E2E候補評価

Phase 1は基盤構築のため、Gold E2E対象外。
（Phase 4でテスト移行後、全Gold E2Eが対象となる）

### 5.2 単体テスト設計

| 対象関数 | テストケース | 期待結果 |
|---------|------------|---------|
| `createAdminSupabase` | 環境変数あり | SupabaseClientを返す |
| `createAdminSupabase` | 環境変数なし | エラーをスロー |
| `saveTestFixtures` | 正常データ | ファイル作成成功 |
| `getTestFixtures` | ファイル存在 | TestFixturesを返す |
| `getTestFixtures` | ファイル不在 | エラーをスロー |
| `hasTestFixtures` | ファイル存在 | true |
| `hasTestFixtures` | ファイル不在 | false |
| `clearTestFixtures` | ファイル存在 | ファイル削除 |

### 5.3 トレーサビリティ

| UC-ID | 実装ファイル | テストファイル |
|-------|-------------|---------------|
| UC-E2E-SETUP-CREATE-CLI | supabase-admin.ts | (Phase 2で追加) |
| UC-E2E-TEST-READ-CLI | test-data-manager.ts | (Phase 2で追加) |
| UC-E2E-TEARDOWN-DELETE-CLI | test-data-manager.ts | (Phase 2で追加) |

### 5.4 統合テスト設計

Phase 1は基盤ファイル作成のみのため、統合テストは不要。
（Phase 3でセットアップ統合時にE2E統合テストを実施）

---

## 6. 受け入れ条件

- [ ] `e2e/helpers/supabase-admin.ts` が作成され、Admin Clientを返す
- [ ] `e2e/helpers/test-data-manager.ts` が作成され、fixtures.jsonの読み書きができる
- [ ] `e2e/factories/index.ts` が作成されている
- [ ] `.gitignore` に `e2e/.test-data/` が追加されている
- [ ] TypeScript型チェック（`npx tsc --noEmit`）が通る
- [ ] ESLint（`npm run lint`）が通る

---

## 7. 依存関係

**先行（このPRの前提）:**
- なし（新規基盤構築）

**後続（このPRに依存）:**
- #179 Phase 2: 個別ファクトリー実装
- #180 Phase 3: セットアップ統合
- #181 Phase 4: テスト移行
- #182 Phase 5: ドキュメント更新

**マージ順序:**
#178 (基盤) → #179 (ファクトリー) → #180 (統合) → #181 (移行) → #182 (ドキュメント)

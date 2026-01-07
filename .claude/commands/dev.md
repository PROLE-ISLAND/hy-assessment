# /dev - 実装PR作成ウィザード

このコマンドは、DoD基準に準拠した実装PRを作成するためのウィザードです。

## 実行フロー

### Step 1: 要件定義PR確認・読み込み

まず、要件定義PRの有無を確認してください：

1. **要件定義PRがある場合**: PR番号を教えてください（例: #45）
2. **要件定義PRがない場合**: `/req` を先に実行するよう促してください
3. **要件定義不要の場合**: バグ修正・ドキュメント・CI修正など → Step 2へ

> ⚠️ 新機能（feat）の場合、要件定義PRなしはCIでブロックされます

### Step 1.5: デザイン承認確認（UI機能の場合）⚠️ 必須

**UI変更を含む機能の場合、デザイン承認状態を確認:**

```bash
# 要件定義PRのラベルを確認
gh pr view {req_pr番号} --json labels -q '.labels[].name'
```

| ラベル状態 | 対応 |
|-----------|------|
| `design-approved` あり | ✅ 実装開始OK → Step 2へ |
| `design-review` あり | ❌ `/design-approve` を先に実行 |
| `no-ui` あり | ✅ バックエンドのみ → Step 2へ |
| ラベルなし（UI機能） | ❌ `/v0-generate` → `/v0-validate` → `/design-approve` を実行 |

> **⚠️ 重要**: `design-approved` または `no-ui` ラベルがない UI 機能は、実装PRを作成してもCIでブロックされます。
>
> **V0ワークフロー実行順序:**
> ```
> /v0-generate → /v0-validate → Vercel Preview確認 → /design-approve
> ```

**要件定義PRからの情報取得:**

```bash
# PR本文を取得して要件を確認
gh pr view {req_pr番号} --json body -q '.body' > /tmp/requirements.md
```

**取得すべき情報:**

| 情報 | 参照先（/req Phase） | 用途 |
|------|---------------------|------|
| UC一覧 | Phase 2.2 | 実装スコープ確認 |
| Pre-mortem | Phase 3.2 | 失敗シナリオ対策 |
| **CRUD操作マトリクス** | Phase 4.1 | DB操作実装・テスト |
| **RLSテスト観点** | Phase 4.1 | セキュリティテスト |
| **エラーハンドリング設計** | Phase 4.2 | API実装・テスト |
| **非機能要件（API）** | Phase 4.2 | レート制限・タイムアウト |
| data-testid命名規則 | Phase 4.3 | セレクタ設計 |
| **画面遷移図** | Phase 4.3 | 遷移実装・テスト |
| **V0 Link** | Step 4.5.1 | UI実装の参照元 |
| **V0検証結果** | Step 4.5.2 | バリアント・a11y実装確認 |
| **生成E2Eテスト** | Step 4.5.2 | E2Eテストベース |
| GWT仕様 | Phase 5.3 | E2Eテスト作成 |
| Playwrightマッピング | Phase 5.3 | テスト実装 |
| 単体テスト設計 | Phase 5.4 | 単体テスト作成 |
| トレーサビリティ | Phase 5.5 | カバレッジ確認 |
| **統合テスト設計** | Phase 5.6 | DB/API/UI統合テスト |

### Step 2: 関連Issue確認

関連Issueの確認：

```bash
# Issue一覧確認
gh issue list -l "ready-to-develop" --json number,title,labels

# Issue詳細確認
gh issue view {番号}
```

### Step 3: ブランチ作成

実装用ブランチを作成：

```bash
# 新機能
git checkout -b feature/issue-{番号}-{機能名}

# バグ修正
git checkout -b bugfix/issue-{番号}-{説明}

# ホットフィックス
git checkout -b hotfix/issue-{番号}-{説明}
```

### Step 4: 実装（要件定義に従う）

要件定義PRの内容に従って実装を行います。

#### 4.1 実装前チェック（要件定義PRから確認）

- [ ] UC一覧（Phase 2.2）を確認し、実装スコープを理解した
- [ ] Pre-mortem（Phase 3.2）を確認し、対策を実装計画に含めた
- [ ] DB/API/UI設計（Phase 4）に沿って実装する準備ができた
- [ ] data-testid命名規則（Phase 4.3）を確認した
- [ ] **V0 Link（Step 4.5.1）を確認し、生成コードを参照準備できた**（UI機能）
- [ ] **V0検証結果（Step 4.5.2）を確認し、実装要件を理解した**（UI機能）

#### 4.2 実装中チェック

- [ ] 変更ファイル一覧（Phase 4.4）に沿っているか
- [ ] 技術設計（DB/API/UI）に沿っているか
- [ ] data-testid が命名規則に従っているか
- [ ] UIバリアント（Default/Loading/Empty/Error）を実装したか
- [ ] Feature Flags定義（Phase 4.3）に従っているか
- [ ] **V0生成コードをベースに実装しているか**（UI機能）
- [ ] **V0検証でパスした a11y 要件を維持しているか**（UI機能）

#### 4.3 Pre-mortem対策実装チェック

要件定義PRのPre-mortem（Phase 3.2）で特定された失敗シナリオに対する対策が実装されているか確認：

| # | 失敗シナリオ（from /req） | 対策実装状態 | 実装箇所 |
|---|-------------------------|------------|---------|
| 1 | {scenario1} | ✅/❌ | {file:line} |
| 2 | {scenario2} | ✅/❌ | {file:line} |
| 3 | {scenario3} | ✅/❌ | {file:line} |

### Step 5: テストファイル作成 ⚠️ 必須

要件定義PR（Phase 5）に基づいてテストファイルを作成します。

#### 5.1 E2Eテスト作成（Gold E2E対象の場合）

**GWT仕様（Phase 5.3）からPlaywrightテストを作成:**

```typescript
// e2e/{feature}.spec.ts
// トレーサビリティ: UC-{id} → GS-{id}

import { test, expect } from '@playwright/test';

test.describe('{Feature名}', () => {
  test.beforeEach(async ({ page }) => {
    // Given {共通の前提条件}
    await page.goto('/xxx');
  });

  test('{シナリオ名}', async ({ page }) => {
    // Given {前提条件}
    // → Playwrightマッピング（Phase 5.3）を参照

    // When {操作}
    await page.click('[data-testid="{xxx-button}"]');

    // Then {期待結果}
    await expect(page.getByText('{expected}')).toBeVisible();
  });
});
```

**Playwrightマッピング（Phase 5.3）を使ってテスト作成:**

| GWT Step（from /req） | Playwright実装 | 実装状態 |
|----------------------|---------------|---------|
| Given {xxx} | `await page.goto('/xxx')` | ✅/❌ |
| When {xxx} | `await page.click('[data-testid="xxx"]')` | ✅/❌ |
| Then {xxx} | `await expect(...).toBeVisible()` | ✅/❌ |

#### 5.2 単体テスト作成

**単体テスト設計テーブル（Phase 5.4）からVitestを作成:**

```typescript
// src/lib/{feature}/__tests__/{function}.test.ts

import { describe, it, expect } from 'vitest';
import { {functionName} } from '../{function}';

describe('{functionName}', () => {
  // 正常系（from Phase 5.4）
  it('should {expected} when {case}', () => {
    expect({functionName}({input})).toBe({expected});
  });

  // 異常系（from Phase 5.4）
  it('should throw when {case}', () => {
    expect(() => {functionName}({input})).toThrow();
  });

  // 境界値（from Phase 5.4）
  it('should handle boundary case: {case}', () => {
    expect({functionName}({input})).toBe({expected});
  });
});
```

**単体テスト実装チェック（Phase 5.4対応）:**

| 対象（from /req） | テストケース | 実装状態 | ファイル |
|-----------------|------------|---------|---------|
| {function_name} | 正常系: {case} | ✅/❌ | {file} |
| {function_name} | 異常系: {case} | ✅/❌ | {file} |
| {function_name} | 境界値: {case} | ✅/❌ | {file} |

#### 5.3 トレーサビリティ確認（Phase 5.5対応）

要件定義PRのトレーサビリティ表（Phase 5.5）と実際の実装を照合：

| UC-ID（from /req） | GS-ID | 実装PW File | CI Stage | 実装状態 |
|-------------------|-------|------------|----------|---------|
| UC-{domain}-{role}-{outcome}-{channel} | GS-001 | e2e/{feature}.spec.ts | Gold E2E | ✅/❌ |
| | | src/**/*.test.ts | Bronze/Silver | ✅/❌ |

#### 5.4 統合テスト作成（Phase 5.6対応）⚠️ 必須

**統合テスト設計（Phase 5.6）に基づいてテストファイルを作成:**

##### DB統合テスト（Phase 5.6.1対応）

```typescript
// src/lib/{feature}/__tests__/{feature}.integration.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('{Feature} DB Integration', () => {
  // CRUD操作マトリクス（Phase 4.1）に基づくテスト

  it('should create record with valid auth', async () => {
    // Create操作テスト
  });

  it('should read record with proper RLS', async () => {
    // Read操作 + RLS検証
  });

  it('should reject unauthorized access (RLS)', async () => {
    // RLSテスト観点（Phase 4.1）に基づく
  });
});
```

##### API統合テスト（Phase 5.6.2対応）

```typescript
// src/app/api/{path}/__tests__/route.integration.test.ts

import { describe, it, expect } from 'vitest';
import { setupServer } from 'msw/node';

describe('{API} Integration', () => {
  // エラーハンドリング設計（Phase 4.2）に基づくテスト

  it('should return 401 for unauthenticated request', async () => {
    // 認証エラーテスト
  });

  it('should return 400 for invalid input', async () => {
    // バリデーションエラーテスト
  });

  it('should enforce rate limit', async () => {
    // 非機能要件（Phase 4.2）に基づく
  });
});
```

##### UI統合テスト（Phase 5.6.3対応）

```typescript
// e2e/integration/{feature}.spec.ts

import { test, expect } from '@playwright/test';

test.describe('{Feature} UI Integration', () => {
  // 画面遷移図（Phase 4.3）に基づくテスト

  test('should navigate correctly through flow', async ({ page }) => {
    // 画面遷移テスト
  });

  test('should handle browser back correctly', async ({ page }) => {
    // 戻る操作テスト
  });

  test('should display loading state during API call', async ({ page }) => {
    // ローディング状態テスト
  });
});
```

**統合テスト実装チェック（Phase 5.6対応）:**

| カテゴリ（from /req） | テスト対象 | 実装状態 | ファイル |
|---------------------|-----------|---------|---------|
| DB統合（5.6.1） | CRUD + RLS | ✅/❌ | {file} |
| API統合（5.6.2） | 認証 + エラー | ✅/❌ | {file} |
| UI統合（5.6.3） | 遷移 + 状態 | ✅/❌ | {file} |

### Step 6: DoD チェック

選択されたDoD Levelに応じてチェックを実行：

#### Bronze（PR最低基準）

```bash
npm run check:bronze
# または個別に:
npm run lint           # ESLint
npx tsc --noEmit       # TypeScript型チェック
npm run test:run       # Vitest単体テスト
npm run build          # Next.jsビルド
```

#### Silver（マージ可能基準）

```bash
npm run check:silver
# Bronze + npm audit
```

#### Gold（本番リリース基準）

```bash
npm run check:gold
# Silver + E2Eテスト
npm run test:e2e
```

### Step 7: PR本文作成

以下のテンプレートで本文を作成：

```markdown
## 1. 目的（What）
{1-2文で変更内容}

## 2. 変更理由（Why）⚠️ 必須
{なぜこの変更が必要か}

## 3. 変更種別
- [x] feat: 新機能
- [ ] fix: バグ修正
- [ ] refactor: リファクタリング
- [ ] docs: ドキュメント

## 4. 関連Issue
closes #{issue番号}

## 4.1 要件定義確認

**要件定義PR**: #{req_pr番号}

- [x] **要件定義PRあり**
- [ ] 要件定義不要（バグ修正・ドキュメント等）

### 要件トレーサビリティ

| Phase | 項目 | 実装状態 |
|-------|------|---------|
| 2.2 | UC一覧カバー | ✅ 全UC実装 |
| 3.2 | Pre-mortem対策 | ✅ 3/3 対策実装 |
| 4.1 | CRUD操作マトリクス | ✅ 全操作実装 |
| 4.2 | エラーハンドリング | ✅ 全エラー対応 |
| 4.3 | UI設計（バリアント+遷移） | ✅ 4/4 + 遷移実装 |
| 5.3 | GWT→E2Eテスト | ✅ 作成済み |
| 5.4 | 単体テスト | ✅ 作成済み |
| 5.5 | トレーサビリティ | ✅ 確認済み |
| 5.6 | 統合テスト（DB/API/UI） | ✅ 作成済み |

## 5. DoD Level

- [ ] Bronze ← PR最低基準
- [x] Silver ← 推奨
- [ ] Gold ← 本番リリース向け

## 6. リスク評価

| 領域 | リスク | 対策 |
|------|--------|------|
| 機能への影響 | {Low/Med/High} | {対策} |
| パフォーマンス | {Low/Med/High} | {対策} |
| セキュリティ | {Low/Med/High} | {対策} |

## 7. Gold E2E 影響評価

- [x] **影響なし** ← 既存機能の内部改善のみ
- [ ] **影響あり** → 対象ユースケース: UC-XXX

## 8. テスト作成チェック ⚠️

### E2Eテスト（Gold対象の場合）
- [ ] GWT仕様（Phase 5.3）に基づくテスト作成
- [ ] Playwrightマッピング通りの実装
- [ ] data-testidが命名規則に従っている

### 単体テスト
- [ ] 単体テスト設計（Phase 5.4）に基づくテスト作成
- [ ] 正常系/異常系/境界値をカバー

### 統合テスト ⚠️ 新規
- [ ] DB統合テスト（Phase 5.6.1）: CRUD + RLS
- [ ] API統合テスト（Phase 5.6.2）: 認証 + エラーハンドリング
- [ ] UI統合テスト（Phase 5.6.3）: 画面遷移 + 状態

### トレーサビリティ
- [ ] UC → GS → PW → CI の追跡が可能

## 9. 変更チェックリスト

### 必須（Bronze Gate）
- [x] **Why（変更理由）を記載した** ⚠️
- [x] lint/format 通過
- [x] 型チェック通過
- [x] ビルド成功

### 推奨（Silver Gate）
- [x] 関連テスト追加/更新
- [x] `npm run check:silver` 通過

### 本番向け（Gold Gate）
- [ ] カバレッジ95%以上
- [ ] E2Eテスト通過

## 10. 影響範囲

### 変更対象
- [x] フロントエンド
- [ ] バックエンド（API）
- [ ] データベース

### 主要な変更ファイル
- `{file1}`
- `{file2}`

### 追加したテストファイル
- `e2e/{feature}.spec.ts` (E2E)
- `src/lib/{feature}/__tests__/{function}.test.ts` (単体)
- `src/lib/{feature}/__tests__/{feature}.integration.test.ts` (DB統合)
- `src/app/api/{path}/__tests__/route.integration.test.ts` (API統合)
- `e2e/integration/{feature}.spec.ts` (UI統合)

## 11. スクリーンショット（UI変更時）
{screenshots}

## 12. テスト方法
{レビュアー向けの確認手順}
```

### Step 8: PR作成

1. 全内容を `/tmp/claude-cmd-dev.md` に保存
2. 以下のコマンドで作成：

```bash
gh pr create \
  --title "{type}: {機能名}" \
  --body-file /tmp/claude-cmd-dev.md \
  --label type:implementation
```

**ラベル選択：**

| 変更種別 | type ラベル | ci ラベル |
|---------|------------|-----------|
| 新機能 | `type:implementation` | `ci:full` |
| バグ修正 | `type:bugfix` | `ci:full` |
| リファクタリング | `type:refactor` | `ci:full` |
| ドキュメント | `type:docs` | `ci:skip` |

**重要**:
- 必ず `--body-file` を使用
- ファイルパスは `/tmp/claude-cmd-` で始める（Hook識別用）
- 適切な `type:` ラベルを付与

## 観点チェックリスト

作成前に以下を確認：

### 要件トレース ⚠️ 最重要
- [ ] 要件定義PR（Phase 2.2）のUC一覧を全てカバーしている
- [ ] Pre-mortem（Phase 3.2）の失敗シナリオ対策が実装されている
- [ ] **CRUD操作マトリクス（Phase 4.1）に沿ってDB操作が実装されている**
- [ ] **エラーハンドリング設計（Phase 4.2）に沿ってAPIが実装されている**
- [ ] **画面遷移図（Phase 4.3）に沿って遷移が実装されている**
- [ ] 技術設計（Phase 4）に沿って実装されている
- [ ] GWT仕様（Phase 5.3）からE2Eテストを作成した
- [ ] 単体テスト設計（Phase 5.4）からVitestを作成した
- [ ] トレーサビリティ（Phase 5.5）が確認できる
- [ ] **統合テスト設計（Phase 5.6）から統合テストを作成した**

### 実装品質
- [ ] Why（変更理由）が明確に記載されている
- [ ] 要件定義PRがリンクされている（新機能の場合）
- [ ] DoD Levelが選択されている
- [ ] 選択したDoD Levelのチェックが通過している

### コード品質
- [ ] lint/format 通過
- [ ] 型チェック通過
- [ ] 単体テスト追加/更新
- [ ] ビルド成功

### UI品質（該当時）
- [ ] 全バリアント実装（Default/Loading/Empty/Error）
- [ ] data-testid が付与されている（Phase 4.3命名規則準拠）
- [ ] a11y 監査パス
- [ ] スクリーンショット添付

### セキュリティ
- [ ] ハードコードされたシークレットなし
- [ ] 入力バリデーション実装（該当時）
- [ ] RLSポリシー確認（DB変更時）

## バグ修正の場合

バグ修正PRは以下のセクションを追加：

```markdown
## バグの説明
{何が問題か}

## 原因
{なぜ発生したか}

## 修正方法
{どう直したか}

## 再発防止
{今後同じ問題を防ぐには}

## 回帰テスト
{このバグを検出するテストを追加したか}
- [ ] 単体テスト追加: {file}
- [ ] E2Eテスト追加: {file}
```

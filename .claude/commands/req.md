# /req - 要件定義PR作成ウィザード

このコマンドは、Phase 1-5 統合要件定義PRを作成するためのウィザードです。

## 全体ワークフロー

```
/investigate → /issue → /req（このコマンド）
                           │
                           ├─ Phase 1-4: 調査・要件・品質・技術設計
                           │
                           ├─ Step 4.5: V0 UI 自動生成（UI機能の場合）
                           │      │
                           │      ├─ mcp__v0__createChat（自動実行）
                           │      ├─ 4バリアント検証（自動実行）
                           │      └─ design-review ラベル付与（自動実行）
                           │
                           ├─ Phase 5: テスト設計
                           │
                           └─ PR作成 → 人間がVercel Preview確認 → /dev（実装PR）
```

> **UI機能の場合**: Step 4.5 で自動的にV0コンポーネント生成が実行される。人間がVercel Previewを確認後、`design-approved` ラベルを付与してから `/dev` へ進む

## 実行フロー

### Step 1: 調査ファースト確認

まず、調査レポートの有無を確認してください：

1. **調査レポートがある場合**: リンクを教えてください
2. **調査レポートがない場合**: `/investigate` を先に実行するよう促してください

> 📚 参考: [調査スキル活用ガイド](https://github.com/PROLE-ISLAND/.github/wiki/調査スキル活用ガイド)

### Step 2: 関連Issue確認

関連Issueの有無を確認してください：

1. **Issueがある場合**: Issue番号を教えてください（例: #123）
2. **Issueがない場合**: `/issue` を先に実行するよう促してください

### Step 3: ブランチ作成

要件定義用ブランチを作成：

```bash
git checkout -b requirements/issue-{番号}-{機能名}
```

### Step 4: Phase 1-5 記入サポート

以下のPhaseを順番に記入サポートしてください：

---

#### Phase 1: 調査レポート ⚠️ 必須

```markdown
## 1. 調査レポート

**調査レポートリンク**: [Investigation Report]({link})

### Investigation Report v1 要約

| 項目 | 内容 |
|------|------|
| 既存システム名 | {name} |
| エントリーポイント | UI: / API: / CLI: |
| 主要データモデル | {models} |
| キーファイル（3-10） | {files} |
| 拡張ポイント | {extension_points} |
| 破壊ポイント | {breaking_points} |
| やりたいこと（1行） | {goal} |
```

---

#### Phase 2: 要件定義・ユースケース ⚠️ 必須

```markdown
## 2. Phase 2: 要件定義・ユースケース

### 2.1 機能概要

| 項目 | 内容 |
|------|------|
| **なぜ必要か（Why）** | {why} |
| **誰が使うか（Who）** | {who} |
| **何を達成するか（What）** | {what} |

### 2.2 ユースケース定義（Role × Outcome）

> UC-ID命名規則: `UC-{DOMAIN}-{ROLE}-{OUTCOME}-{CHANNEL}`

| UC-ID | Role | Outcome | Channel | 説明 |
|-------|------|---------|---------|------|
| {uc_id} | {role} | {outcome} | WEB/API/EMAIL | {desc} |

### 2.3 Role × Value マトリクス

| Role | 提供する価値 | 受け取る価値 | 関連Outcome |
|------|-------------|-------------|-------------|
| Admin | | | |
| User | | | |
| System | | — | |

### 2.4 カバレッジマトリクス（MECE証明）

> **空白セル禁止**: ✅ Gold E2E / 🟡 Bronze/Silver / — 対象外（理由必須）

| Role＼Outcome | {Outcome1} | {Outcome2} |
|---------------|------------|------------|
| Admin | | |
| User | | |

### 2.5 入力ソースチェックリスト（要件網羅性証明）

> 要件抽出元を明示し、網羅性を証明する

| 入力ソース | 確認状態 | 抽出UC数 | 備考 |
|-----------|---------|---------|------|
| FEATURES.md / 機能一覧 | ✅/❌/N/A | {n} | {note} |
| ルーティング定義（app/構造） | ✅/❌/N/A | {n} | {note} |
| DBスキーマ（主要テーブル） | ✅/❌/N/A | {n} | {note} |
| 既存テストファイル | ✅/❌/N/A | {n} | {note} |
| Issue/PR履歴 | ✅/❌/N/A | {n} | {note} |

### 2.6 外部整合性チェック

- [ ] FEATURES.md記載の全機能にUCが対応している
- [ ] DBスキーマの主要テーブルがUCでカバーされている
- [ ] ルーティング定義と画面一覧が整合している
- [ ] 既存テストでカバーされている機能がUCに含まれている
```

---

#### Phase 3: 品質基準 ⚠️ 必須

```markdown
## 3. Phase 3: 品質基準

### 3.1 DoD Level 選択

- [ ] Bronze (27観点: 80%カバレッジ)
- [x] Silver (31観点: 85%カバレッジ) ← 推奨
- [ ] Gold (19観点: 95%カバレッジ)

**選定理由**: {reason}

### 3.2 Pre-mortem（失敗シナリオ） ⚠️ 3つ以上必須

| # | 失敗シナリオ | 発生確率 | 対策 | 確認方法 |
|---|-------------|---------|------|---------|
| 1 | {scenario1} | 高/中/低 | {action1} | {verify1} |
| 2 | {scenario2} | 高/中/低 | {action2} | {verify2} |
| 3 | {scenario3} | 高/中/低 | {action3} | {verify3} |
```

---

#### Phase 4: 技術設計 ⚠️ 必須

```markdown
## 4. Phase 4: 技術設計

### 4.1 データベース設計

**新規テーブル:**

| テーブル名 | 用途 | RLSポリシー |
|-----------|------|------------|
| {table} | {purpose} | {rls} |

#### CRUD操作マトリクス ⚠️ 必須

> どのテーブルにどの操作が必要か、どのAPIが担当するかを明示

| テーブル | Create | Read | Update | Delete | 担当API |
|---------|:------:|:----:|:------:|:------:|---------|
| {table1} | ✅ | ✅ | ✅ | ❌ | POST/GET/PATCH /api/xxx |
| {table2} | ✅ | ✅ | ❌ | ❌ | POST/GET /api/yyy |

#### RLSテスト観点

| ポリシー名 | 対象操作 | 許可条件 | テストケース |
|-----------|---------|---------|-------------|
| {policy} | SELECT/INSERT/UPDATE/DELETE | {condition} | {test_case} |

### 4.2 API設計

| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| {method} | /api/{path} | {desc} | 必要/不要 |

#### エラーハンドリング設計

| API | エラーケース | HTTPステータス | レスポンス |
|-----|------------|--------------|-----------|
| POST /api/xxx | バリデーションエラー | 400 | `{ error: "validation_error", details: {...} }` |
| POST /api/xxx | 認証エラー | 401 | `{ error: "unauthorized" }` |
| POST /api/xxx | 権限エラー | 403 | `{ error: "forbidden" }` |
| GET /api/xxx/{id} | 存在しない | 404 | `{ error: "not_found" }` |

#### 非機能要件（API）

| 観点 | 要件 | 検証方法 |
|------|------|---------|
| **レート制限** | {rate}/min | 負荷テストで確認 |
| **タイムアウト** | {n}秒 | 負荷テストで確認 |
| **最大ペイロード** | {n}MB | 境界値テストで確認 |
| **リトライポリシー** | {retry_count}回、{backoff}秒間隔 | 障害注入テストで確認 |

### 4.3 UI設計（UI機能の場合）

#### 画面一覧

| 画面名 | パス | コンポーネント | 説明 |
|-------|------|---------------|------|
| {screen} | /path | {component} | {desc} |

#### v0リンク・プレビュー

| 項目 | 値 |
|------|-----|
| **v0 Link** | {v0_link} |
| **Preview URL** | {preview_url} |

#### Feature Flags定義

```typescript
// src/flags/index.ts
export const {featureName}DesignVariant = flag<'a' | 'b'>({
  key: '{feature-name}-design-variant',
  defaultValue: 'a',
  options: [
    { value: 'a', label: 'パターンA' },
    { value: 'b', label: 'パターンB' },
  ],
});
```

#### バリアント実装チェック

| バリアント | 用途 | 実装確認 |
|-----------|------|---------|
| Default | 正常データ表示 | [ ] |
| Loading | スケルトンUI | [ ] |
| Empty | データなし状態 | [ ] |
| Error | エラー + 再試行ボタン | [ ] |

#### Vercel Toolbarレビュー項目

- [ ] 全バリアントをFlags Explorerで確認
- [ ] a11y監査パス
- [ ] CLS（Cumulative Layout Shift）問題なし
- [ ] INP（Interaction to Next Paint）が許容範囲内

#### data-testid命名規則

```
data-testid="{action}-{target}-{element}"
例: add-candidate-button, candidate-name-input, candidate-row-{id}
```

#### 画面遷移図（State Machine）⚠️ 必須

> ユーザーフロー全体を可視化し、遷移条件を明確にする

```mermaid
stateDiagram-v2
    [*] --> {初期画面}
    {初期画面} --> {画面A}: {アクション1}
    {画面A} --> {画面B}: {アクション2}
    {画面B} --> {画面A}: 戻る
    {画面B} --> [*]: 完了
```

| 遷移元 | 遷移先 | トリガー | 条件 | テストケース |
|-------|-------|---------|------|-------------|
| {screen_from} | {screen_to} | {trigger} | {condition} | {test_case} |

#### 画面遷移テスト観点

| 遷移パターン | 説明 | テスト必須度 |
|-------------|------|-------------|
| 正常遷移 | 想定通りの画面移動 | ✅ 必須 |
| 戻る操作 | ブラウザバック、戻るボタン | ✅ 必須 |
| 直接アクセス | URL直接入力 | ✅ 必須 |
| 認証切れ時 | セッション切れ時のリダイレクト | ✅ 必須 |
| エラー時遷移 | API失敗時の画面遷移 | 🟡 推奨 |
| ディープリンク | 特定状態への直接遷移 | 🟡 推奨 |

### 4.4 変更ファイル一覧

| ファイルパス | 変更種別 | 概要 |
|-------------|---------|------|
| `src/...` | 新規/修正/削除 | {summary} |
```

---

### Step 4.5: V0 UI生成・検証ワークフロー ⚠️ UI機能の場合は自動実行

> **⚠️ 重要**: UI変更を含む機能の場合、**Claude Codeはこのステップで自動的にMCP V0ツールを呼び出してコンポーネントを生成すること。**
> バックエンドのみの機能は `no-ui` ラベルを付与してスキップ可能。

#### 4.5.1 V0コンポーネント生成（自動実行）

**Phase 4.3 で画面一覧を定義した場合、以下のMCPツールを直接呼び出してコンポーネントを生成する:**

```typescript
// 各コンポーネントに対してV0 Chatを作成
mcp__v0__createChat({
  message: `{ComponentName}コンポーネントを作成してください。

## 基本要件
- React + TypeScript
- shadcn/ui コンポーネント使用
- Tailwind CSS
- ダークモード対応（dark:クラス使用）
- 日本語テキスト

## 機能
{Phase 4.3で定義した用途・機能}

## バリアント（すべて作成）
1. **Default** - 正常データ表示
   - data-testid="{kebab-name}"
2. **Loading** - スケルトンUI（Skeletonコンポーネント使用）
   - data-testid="{kebab-name}-skeleton"
3. **Empty** - 「データがありません」+ アイコン
   - data-testid="{kebab-name}-empty"
4. **Error** - 「読み込みに失敗しました」+ 再試行ボタン
   - data-testid="{kebab-name}-error"

## Props型定義
interface {ComponentName}Props {
  data?: {DataType};
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

## 実装パターン
早期リターンパターンで実装してください。`,
  modelConfiguration: {
    modelId: "v0-1.5-lg",
    thinking: true
  }
})
```

**生成後、PR本文のPhase 4.3に以下を自動記録:**

| 項目 | 値 |
|------|-----|
| **V0 Chat ID** | {返されたchat_id} |
| **V0 Link** | https://v0.dev/chat/{chat_id} |
| **生成バリアント** | Default / Loading / Empty / Error |

#### 4.5.2 生成結果の検証（自動実行）

V0から返されたコードを確認し、以下をチェック:

| チェック項目 | 確認方法 |
|-------------|---------|
| 全4バリアントが生成されている | コード内に4つのコンポーネントがある |
| data-testid が正しく付与されている | `data-testid="{kebab-name}"` パターン |
| shadcn/ui コンポーネントを使用している | `@/components/ui/` からインポート |
| ダークモード対応している | `dark:` クラスが含まれる |
| 日本語テキストになっている | ラベル・メッセージが日本語 |

**不足がある場合**: `mcp__v0__sendChatMessage` で追加リクエストを送信

```typescript
mcp__v0__sendChatMessage({
  chatId: "{chat_id}",
  message: "Loadingバリアントが不足しています。スケルトンUIで追加してください。",
  modelConfiguration: { modelId: "v0-1.5-lg" }
})
```

#### 4.5.3 デザインラベル付与（自動実行）

V0生成が完了したら、**自動的に `design-review` ラベルを付与**:

```bash
gh pr edit {pr_number} --add-label "design-review"
```

**⚠️ 重要**:
- `design-approved` ラベルは人間がVercel Previewを確認後に付与
- `/dev` 実行時に `design-approved` がない場合は警告を表示

---

#### Phase 5: テスト設計 ⚠️ 必須

```markdown
## 5. Phase 5: テスト設計

### 5.1 Gold E2E候補評価（4つのレンズ）

> 全て「はい」の場合のみGold E2E対象

| レンズ | 質問 | 回答 |
|--------|------|------|
| 行動フォーカス | 実装ではなくユーザー目標を検証しているか？ | はい/いいえ |
| 欺瞞耐性 | モック/スタブでは通過できないか？ | はい/いいえ |
| 明確な失敗説明 | 失敗理由を1文で説明できるか？ | はい/いいえ |
| リスク明示 | このテストがないと何を犠牲にするか説明できるか？ | はい/いいえ |

### 5.2 トリアージスコアリング（Gold候補のみ）

> 16-20点 = Gold E2E必須、12-15点 = 推奨採用、8-11点 = 条件付き、4-7点 = 却下

| 軸 | 説明 | 評価（1-5） | 理由 |
|----|------|-----------|------|
| **Impact（影響度）** | 壊れた時の影響 | {score} | {reason} |
| **Frequency（頻度）** | どれくらい使われるか | {score} | {reason} |
| **Detectability（検知性）** | 他で検知できるか | {score} | {reason} |
| **Recovery Cost（復旧コスト）** | 壊れた時の修復難易度 | {score} | {reason} |
| **合計** | | {total}/20 | |

### 5.3 GWT仕様（Gold E2E対象の場合）

```gherkin
# =============================================================================
# Gold E2E: {ユースケース名}
# =============================================================================
# Role: {主体}
# Outcome: {達成される価値}
# Triage Score: {合計点} (I:{}/F:{}/D:{}/R:{})
# =============================================================================

Feature: {機能名}

  Background:
    Given {共通の前提条件}

  Scenario: {シナリオ名}
    Given {前提条件}
      And {前提条件2}
    When {操作}
      And {操作2}
    Then {期待結果}
      And {期待結果2}
```

#### Playwrightマッピング

| GWT Step | Playwright実装 | data-testid |
|----------|---------------|-------------|
| Given {xxx} | `await page.goto('/xxx')` | - |
| When {xxx} | `await page.click('[data-testid="xxx"]')` | xxx-button |
| Then {xxx} | `await expect(page.getByText('xxx')).toBeVisible()` | - |

### 5.4 単体テスト設計

| 対象関数/コンポーネント | テストケース | 期待結果 |
|----------------------|------------|---------|
| {function_name} | 正常系: {case} | {expected} |
| {function_name} | 異常系: {case} | {expected} |
| {function_name} | 境界値: {case} | {expected} |

### 5.5 トレーサビリティ（UC → テスト追跡）

| UC-ID | GS-ID | PW File | CI Stage |
|-------|-------|---------|----------|
| UC-{domain}-{role}-{outcome}-{channel} | GS-001 | {feature}.spec.ts | Gold E2E |
| | | | Bronze/Silver |

### 5.6 統合テスト設計 ⚠️ 必須

> 単体テストでは検証できない「コンポーネント間の接続」を検証

#### 5.6.1 DB統合テスト（Phase 4.1 CRUD操作マトリクス対応）

| テスト対象 | テスト内容 | 前提条件 | 期待結果 |
|-----------|-----------|---------|---------|
| Create操作 | {table}にレコード挿入 | 認証済みユーザー | 201 Created + DB反映 |
| Read操作 | {table}からレコード取得 | レコード存在 | 200 OK + 正しいデータ |
| Update操作 | {table}のレコード更新 | 所有者として認証 | 200 OK + 更新反映 |
| Delete操作 | {table}のレコード削除 | 管理者として認証 | 204 No Content + 削除反映 |
| RLS検証 | 他ユーザーのデータ操作 | 非所有者として認証 | 403 Forbidden |
| トランザクション | 複数テーブル同時操作 | 正常条件 | 全て成功 or 全てロールバック |

#### 5.6.2 API統合テスト（Phase 4.2 API設計対応）

| テスト対象 | テスト内容 | 入力 | 期待結果 |
|-----------|-----------|------|---------|
| 認証フロー | 未認証アクセス | Authヘッダーなし | 401 Unauthorized |
| 認証フロー | 期限切れトークン | 期限切れJWT | 401 + 再認証要求 |
| 権限チェック | 権限不足アクセス | 一般ユーザートークン | 403 Forbidden |
| バリデーション | 不正入力 | スキーマ違反リクエスト | 400 + エラー詳細 |
| レート制限 | 過剰リクエスト | {rate}回/分超過 | 429 Too Many Requests |
| タイムアウト | 長時間処理 | 重い処理リクエスト | {n}秒後タイムアウト |

#### 5.6.3 UI統合テスト（Phase 4.3 画面遷移対応）

| テスト対象 | テスト内容 | 操作 | 期待結果 |
|-----------|-----------|------|---------|
| 画面遷移 | 正常フロー | {screen_from} → {screen_to} | 遷移成功 + 状態維持 |
| 画面遷移 | ブラウザバック | 戻るボタン押下 | 前画面表示 + 入力状態維持 |
| 画面遷移 | 直接URL | {path}に直接アクセス | 認証チェック後表示 |
| フォーム→API | データ送信 | フォーム入力 + 送信 | API呼出 + 成功表示 |
| API→UI反映 | データ表示 | 画面表示 | APIデータがUI反映 |
| エラー表示 | APIエラー時 | API 4xx/5xx | エラーUI表示 |
| ローディング | 非同期処理中 | API呼出中 | スケルトン/スピナー表示 |

#### 5.6.4 統合テスト実装ファイル

| カテゴリ | ファイルパス | フレームワーク |
|---------|-------------|---------------|
| DB統合 | `src/lib/{feature}/__tests__/{feature}.integration.test.ts` | Vitest + Supabase Test |
| API統合 | `src/app/api/{path}/__tests__/route.integration.test.ts` | Vitest + MSW |
| UI統合 | `e2e/integration/{feature}.spec.ts` | Playwright |
```

---

### Step 5: 受け入れ条件・依存関係

```markdown
## 6. 受け入れ条件 ⚠️ 必須

- [ ] {condition1}
- [ ] {condition2}
- [ ] {condition3}

## 7. 依存関係

**先行（このPRの前提）:**
- {dependency}

**後続（このPRに依存）:**
- {dependent}

**マージ順序（Stacked PR）:**
<!-- 例: #100 (DB) → #101 (API) → #102 (UI) → #103 (E2E) -->
```

### Step 6: PR作成

1. 全内容を `/tmp/claude-cmd-req.md` に保存
2. 以下のコマンドで作成：

```bash
gh pr create \
  --template requirements.md \
  --title "requirements: {機能名}の実装計画" \
  --body-file /tmp/claude-cmd-req.md \
  --label type:requirements \
  --label ci:skip
```

**重要**:
- 必ず `--template requirements.md` を使用
- 必ず `--body-file` を使用
- ファイルパスは `/tmp/claude-cmd-` で始める（Hook識別用）
- ラベル `type:requirements` と `ci:skip` を付与

## 観点チェックリスト

作成前に以下を確認：

### Phase 1
- [ ] 調査レポートがリンクされている
- [ ] Investigation Report v1 要約が記入されている

### Phase 2
- [ ] ユースケースがRole × Outcomeで定義されている
- [ ] UC-IDが命名規則に従っている
- [ ] カバレッジマトリクスに空白セルがない
- [ ] 入力ソースチェックリストが記入されている
- [ ] 外部整合性チェックが完了している

### Phase 3
- [ ] DoD Levelが選択・理由記載されている
- [ ] Pre-mortemで3つ以上の失敗シナリオが特定されている

### Phase 4
- [ ] DBスキーマがRLS付きで定義されている（該当時）
- [ ] **CRUD操作マトリクスが記入されている**（該当時）
- [ ] **RLSテスト観点が記載されている**（該当時）
- [ ] APIエンドポイントが定義されている（該当時）
- [ ] **エラーハンドリング設計が記載されている**（該当時）
- [ ] **非機能要件（API）が記載されている**（該当時）
- [ ] 画面一覧・バリアントが定義されている（該当時）
- [ ] Feature Flags定義がコード例で記載されている（該当時）
- [ ] data-testid命名規則が記載されている（該当時）
- [ ] **画面遷移図（State Machine）が作成されている**（該当時）
- [ ] 変更ファイル一覧が記載されている

### Step 4.5（UI機能の場合 - 自動実行）
- [ ] `mcp__v0__createChat` でコンポーネント生成済み（自動）
- [ ] V0 Link がPR本文に記録されている（自動）
- [ ] 4バリアント・data-testid・ダークモード対応が確認済み（自動検証）
- [ ] `design-review` ラベルが付与されている（自動）
- [ ] **または `no-ui` ラベル付与**（バックエンドのみの場合）
- [ ] （人間確認）Vercel Preview で目視確認 → `design-approved` ラベル付与

### Phase 5
- [ ] Gold E2E 4つのレンズ評価が完了している
- [ ] トリアージスコアリング（4軸）が完了している（Gold候補）
- [ ] GWT仕様が作成されている（Gold対象）
- [ ] Playwrightマッピングが記載されている（Gold対象）
- [ ] 単体テスト設計テーブルが記入されている
- [ ] トレーサビリティ（UC→GS→PW→CI）が記載されている
- [ ] **統合テスト設計（DB/API/UI）が記載されている**

### 共通
- [ ] 受け入れ条件が記載されている
- [ ] **コード変更は含まれていない**（ドキュメントのみ）

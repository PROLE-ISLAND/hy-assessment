# 要件定義: Issue #133 通知設定ページの実装

closes #133

---

## 1. Phase 1: 調査レポート

**調査レポートリンク**: [docs/plans/SETTINGS_IMPLEMENTATION_PLAN.md](https://github.com/PROLE-ISLAND/hy-assessment/blob/main/docs/plans/SETTINGS_IMPLEMENTATION_PLAN.md)

### Investigation Report v1 要約

| 項目 | 内容 |
|------|------|
| 既存システム名 | HY Assessment 設定ページ |
| エントリーポイント | UI: `/admin/settings` → `/admin/settings/notifications` |
| 主要データモデル | `user_notification_preferences`（新規） |
| キーファイル | `src/app/admin/settings/page.tsx`, `src/app/admin/settings/notifications/page.tsx`（新規） |
| 拡張ポイント | 設定ページのカード追加、API新規追加 |
| 破壊ポイント | なし（新規機能、既存機能への影響なし） |
| やりたいこと | 管理者がメール通知のON/OFFを設定できるようにする |

---

## 2. Phase 2: 要件定義・ユースケース

### 2.1 機能概要

| 項目 | 内容 |
|------|------|
| **なぜ必要か（Why）** | 管理者が不要な通知を受け取らずに済むよう、通知設定を個別に制御したい |
| **誰が使うか（Who）** | 管理者（Admin） |
| **何を達成するか（What）** | メール通知の受信設定を個別にON/OFF管理できる |

### 2.2 ユースケース定義（Role × Outcome）

> UC-ID命名規則: `UC-{DOMAIN}-{ROLE}-{OUTCOME}-{CHANNEL}`

| UC-ID | Role | Outcome | Channel | 説明 |
|-------|------|---------|---------|------|
| UC-NOTIFY-ADMIN-VIEW-WEB | Admin | 通知設定を確認する | WEB | 現在の通知設定状態を一覧表示 |
| UC-NOTIFY-ADMIN-UPDATE-WEB | Admin | 通知設定を変更する | WEB | 各通知項目のON/OFFを切り替え保存 |

### 2.3 Role × Value マトリクス

| Role | 提供する価値 | 受け取る価値 | 関連Outcome |
|------|-------------|-------------|-------------|
| Admin | 設定変更操作 | 通知制御、業務効率化 | VIEW, UPDATE |
| System | 設定保存・読込 | — | — |

### 2.4 カバレッジマトリクス（MECE証明）

> **空白セル禁止**: ✅ Gold E2E / 🟡 Bronze/Silver / — 対象外（理由必須）

| Role＼Outcome | VIEW（確認） | UPDATE（変更） |
|---------------|-------------|----------------|
| Admin | 🟡 Silver | 🟡 Silver |
| System | — API内部 | — API内部 |

### 2.5 入力ソースチェックリスト（要件網羅性証明）

| 入力ソース | 確認状態 | 抽出UC数 | 備考 |
|-----------|---------|---------|------|
| FEATURES.md / 機能一覧 | N/A | - | 通知設定は未記載 |
| ルーティング定義（app/構造） | ✅ | 2 | `/admin/settings/notifications` 追加 |
| DBスキーマ（主要テーブル） | ✅ | 2 | `user_notification_preferences` 新規 |
| 既存テストファイル | N/A | - | 通知設定のテストなし |
| Issue/PR履歴 | ✅ | 2 | Issue #133 |

### 2.6 外部整合性チェック

- [x] FEATURES.md記載の全機能にUCが対応している（通知設定は新規追加）
- [x] DBスキーマの主要テーブルがUCでカバーされている
- [x] ルーティング定義と画面一覧が整合している
- [x] 既存テストでカバーされている機能がUCに含まれている

---

## 3. Phase 3: 品質基準

### 3.1 DoD Level 選択

- [ ] Bronze (27観点: 80%カバレッジ)
- [x] Silver (31観点: 85%カバレッジ) ← 推奨
- [ ] Gold (19観点: 95%カバレッジ)

**選定理由**: 設定保存の単純CRUD機能であり、ビジネスクリティカルではない。Silver基準で十分な品質を担保。

### 3.2 Pre-mortem（失敗シナリオ） ⚠️ 3つ以上必須

| # | 失敗シナリオ | 発生確率 | 対策 | 確認方法 |
|---|-------------|---------|------|---------|
| 1 | 設定変更が保存されない | 中 | API成功後にトースト表示、再読込で確認 | 統合テストで保存→再読込を検証 |
| 2 | 初回アクセス時にエラー | 中 | デフォルト設定を自動作成（UPSERT） | 新規ユーザーでの初回アクセステスト |
| 3 | 他ユーザーの設定を変更できてしまう | 低 | RLSポリシーで`auth.uid() = user_id`を強制 | RLSテストで他ユーザーデータ操作を検証 |
| 4 | 通知設定UIが設定一覧から遷移できない | 低 | `disabled` propを削除してリンク有効化 | E2Eで設定一覧→通知設定への遷移確認 |

---

## 4. Phase 4: 技術設計

### 4.1 データベース設計

**新規テーブル:**

| テーブル名 | 用途 | RLSポリシー |
|-----------|------|------------|
| `user_notification_preferences` | ユーザーごとの通知設定 | 本人のみ読み書き可能 |

#### テーブル定義

```sql
CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- 検査関連通知
    assessment_completed BOOLEAN NOT NULL DEFAULT true,
    analysis_completed BOOLEAN NOT NULL DEFAULT true,
    assessment_expiring BOOLEAN NOT NULL DEFAULT false,
    
    -- システム通知
    weekly_summary BOOLEAN NOT NULL DEFAULT true,
    security_alerts BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Index
CREATE INDEX idx_user_notification_prefs_user ON user_notification_preferences(user_id);

-- RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON user_notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### CRUD操作マトリクス

| テーブル | Create | Read | Update | Delete | 担当API |
|---------|:------:|:----:|:------:|:------:|---------|
| `user_notification_preferences` | ✅ | ✅ | ✅ | ❌ | GET/PUT `/api/settings/notifications` |

#### RLSテスト観点

| ポリシー名 | 対象操作 | 許可条件 | テストケース |
|-----------|---------|---------|-------------|
| Users can view own preferences | SELECT | `auth.uid() = user_id` | 他ユーザーの設定が取得できないこと |
| Users can update own preferences | UPDATE | `auth.uid() = user_id` | 他ユーザーの設定が更新できないこと |
| Users can insert own preferences | INSERT | `auth.uid() = user_id` | 他ユーザーIDでの挿入が失敗すること |

### 4.2 API設計

| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/api/settings/notifications` | 通知設定取得（なければデフォルト作成） | 必要 |
| PUT | `/api/settings/notifications` | 通知設定更新 | 必要 |

#### リクエスト/レスポンス

```typescript
// GET Response / PUT Request Body
interface NotificationPreferences {
  assessmentCompleted: boolean;  // 検査完了通知
  analysisCompleted: boolean;    // AI分析完了通知
  assessmentExpiring: boolean;   // 有効期限通知
  weeklySummary: boolean;        // 週次サマリー
  securityAlerts: boolean;       // セキュリティアラート
}

// PUT Response
interface UpdateResponse {
  success: boolean;
  data: NotificationPreferences;
  updatedAt: string;
}
```

#### エラーハンドリング設計

| API | エラーケース | HTTPステータス | レスポンス |
|-----|------------|--------------|-----------|
| GET /api/settings/notifications | 認証なし | 401 | `{ error: "unauthorized" }` |
| PUT /api/settings/notifications | 認証なし | 401 | `{ error: "unauthorized" }` |
| PUT /api/settings/notifications | バリデーションエラー | 400 | `{ error: "validation_error", details: {...} }` |
| PUT /api/settings/notifications | DB更新失敗 | 500 | `{ error: "internal_error" }` |

#### 非機能要件（API）

| 観点 | 要件 | 検証方法 |
|------|------|---------|
| **レート制限** | 60回/min | 負荷テストで確認 |
| **タイムアウト** | 10秒 | 負荷テストで確認 |
| **最大ペイロード** | 1KB | 境界値テストで確認 |

### 4.3 UI設計

#### 画面一覧

| 画面名 | パス | コンポーネント | 説明 |
|-------|------|---------------|------|
| 通知設定 | `/admin/settings/notifications` | `NotificationSettingsPage` | 通知ON/OFF設定 |

#### data-testid命名規則

```
data-testid="notification-settings"              // ページコンテナ
data-testid="notification-settings-skeleton"     // ローディング状態
data-testid="notification-settings-error"        // エラー状態
data-testid="toggle-assessment-completed"        // 検査完了通知トグル
data-testid="toggle-analysis-completed"          // AI分析完了通知トグル
data-testid="toggle-assessment-expiring"         // 有効期限通知トグル
data-testid="toggle-weekly-summary"              // 週次サマリートグル
data-testid="toggle-security-alerts"             // セキュリティアラートトグル
data-testid="save-notification-settings"         // 保存ボタン
```

#### バリアント実装チェック

| バリアント | 用途 | data-testid |
|-----------|------|-------------|
| Default | 正常データ表示 | `notification-settings` |
| Loading | スケルトンUI | `notification-settings-skeleton` |
| Error | エラー + 再試行ボタン | `notification-settings-error` |

#### 画面遷移図（State Machine）

```mermaid
stateDiagram-v2
    [*] --> 設定一覧: /admin/settings アクセス
    設定一覧 --> 通知設定: 「通知設定」クリック
    通知設定 --> Loading: 初期読込
    Loading --> Default: データ取得成功
    Loading --> Error: データ取得失敗
    Error --> Loading: 再試行クリック
    Default --> Saving: 保存ボタンクリック
    Saving --> Default: 保存成功（トースト表示）
    Saving --> Error: 保存失敗
    通知設定 --> 設定一覧: ← 戻るクリック
```

| 遷移元 | 遷移先 | トリガー | 条件 | テストケース |
|-------|-------|---------|------|-------------|
| 設定一覧 | 通知設定 | 「通知設定」クリック | disabled解除済み | 遷移成功を確認 |
| 通知設定 | 設定一覧 | 「← 戻る」クリック | — | 遷移成功を確認 |
| Default | Saving | 保存ボタン | 設定変更あり | 保存APIコール確認 |

### 4.4 変更ファイル一覧

| ファイルパス | 変更種別 | 概要 |
|-------------|---------|------|
| `supabase/migrations/xxx_user_notification_preferences.sql` | 新規 | テーブル作成 |
| `src/types/database.ts` | 修正 | 型定義追加 |
| `src/app/api/settings/notifications/route.ts` | 新規 | API実装 |
| `src/app/admin/settings/notifications/page.tsx` | 新規 | 設定ページ |
| `src/app/admin/settings/page.tsx` | 修正 | disabled解除 |
| `src/components/settings/NotificationToggle.tsx` | 新規 | トグルコンポーネント |

---

## 5. Phase 5: テスト設計

### 5.1 Gold E2E候補評価（4つのレンズ）

| レンズ | 質問 | 回答 |
|--------|------|------|
| 行動フォーカス | 実装ではなくユーザー目標を検証しているか？ | はい |
| 欺瞞耐性 | モック/スタブでは通過できないか？ | いいえ（単純CRUD） |
| 明確な失敗説明 | 失敗理由を1文で説明できるか？ | はい |
| リスク明示 | このテストがないと何を犠牲にするか説明できるか？ | いいえ（影響小） |

**結論**: Gold E2E対象外（Silver統合テストで十分）

### 5.2 トリアージスコアリング

| 軸 | 評価（1-5） | 理由 |
|----|-----------|------|
| **Impact（影響度）** | 2 | 通知設定ミスは業務に軽微な影響 |
| **Frequency（頻度）** | 2 | 初期設定後はほぼ使わない |
| **Detectability（検知性）** | 4 | 通知が来ない/来るで気づく |
| **Recovery Cost（復旧コスト）** | 1 | 設定変更で即復旧 |
| **合計** | 9/20 | → Silver統合テストで十分 |

### 5.3 単体テスト設計

| 対象関数/コンポーネント | テストケース | 期待結果 |
|----------------------|------------|---------|
| `GET /api/settings/notifications` | 正常系: 設定取得 | 200 + 設定データ |
| `GET /api/settings/notifications` | 正常系: 初回アクセス（デフォルト作成） | 200 + デフォルト設定 |
| `PUT /api/settings/notifications` | 正常系: 設定更新 | 200 + 更新後データ |
| `PUT /api/settings/notifications` | 異常系: 不正なboolean値 | 400 + エラー詳細 |
| `NotificationToggle` | 正常系: トグル切替 | onChange発火 |

### 5.4 トレーサビリティ（UC → テスト追跡）

| UC-ID | テスト種別 | テストファイル | CI Stage |
|-------|-----------|---------------|----------|
| UC-NOTIFY-ADMIN-VIEW-WEB | 単体 | `route.test.ts` | Bronze |
| UC-NOTIFY-ADMIN-UPDATE-WEB | 単体 | `route.test.ts` | Bronze |
| UC-NOTIFY-ADMIN-VIEW-WEB | 統合 | `notifications.integration.spec.ts` | Silver |
| UC-NOTIFY-ADMIN-UPDATE-WEB | 統合 | `notifications.integration.spec.ts` | Silver |

### 5.5 統合テスト設計

#### 5.5.1 DB統合テスト

| テスト対象 | テスト内容 | 前提条件 | 期待結果 |
|-----------|-----------|---------|---------|
| Create操作 | 初回アクセスでデフォルト作成 | 認証済み、設定なし | レコード作成 + デフォルト値 |
| Read操作 | 設定取得 | 認証済み、設定あり | 200 OK + 正しいデータ |
| Update操作 | 設定更新 | 認証済み | 200 OK + 更新反映 |
| RLS検証 | 他ユーザーの設定取得 | 他ユーザーとして認証 | 空結果（自分の設定のみ） |

#### 5.5.2 API統合テスト

| テスト対象 | テスト内容 | 入力 | 期待結果 |
|-----------|-----------|------|---------|
| 認証フロー | 未認証アクセス | Authヘッダーなし | 401 Unauthorized |
| バリデーション | 不正入力 | `{ assessmentCompleted: "yes" }` | 400 + エラー詳細 |

#### 5.5.3 UI統合テスト

| テスト対象 | テスト内容 | 操作 | 期待結果 |
|-----------|-----------|------|---------|
| 画面遷移 | 設定一覧→通知設定 | リンククリック | 遷移成功 |
| フォーム→API | 設定変更→保存 | トグル切替→保存 | API呼出 + 成功トースト |
| ローディング | 初期読込中 | ページアクセス | スケルトン表示 |

#### 5.5.4 統合テスト実装ファイル

| カテゴリ | ファイルパス | フレームワーク |
|---------|-------------|---------------|
| API統合 | `src/app/api/settings/notifications/__tests__/route.test.ts` | Vitest |
| UI統合 | `e2e/integration/notification-settings.spec.ts` | Playwright |

---

## 6. 受け入れ条件

- [ ] 設定一覧から「通知設定」に遷移できる（disabled解除）
- [ ] 各通知設定を個別にON/OFFできる（5項目）
- [ ] 設定変更後に保存ボタンで保存できる
- [ ] 保存成功時にトースト表示される
- [ ] 設定がDB保存される（RLS適用）
- [ ] 初回アクセス時にデフォルト設定が自動作成される
- [ ] ローディング状態が表示される
- [ ] エラー時にエラーメッセージと再試行ボタンが表示される
- [ ] 他ユーザーの設定にアクセスできない（RLS）

---

## 7. 依存関係

**先行（このPRの前提）:**
- なし（独立して実装可能）

**後続（このPRに依存）:**
- 実際のメール通知送信機能（通知設定を参照）

**マージ順序（Stacked PR）:**
- 単一PR（分割不要）

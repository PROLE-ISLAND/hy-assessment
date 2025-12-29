# 設定ページ実装計画

## 概要

現在「準備中」となっている3つの設定ページを実装する。

| ページ | パス | 機能 |
|-------|------|------|
| 組織設定 | `/admin/settings/organization` | 組織情報の確認・編集 |
| 通知設定 | `/admin/settings/notifications` | メール通知の設定 |
| セキュリティ | `/admin/settings/security` | ログイン履歴、セッション管理 |

---

## 1. 画面設計

### 1.1 組織設定ページ

```
┌──────────────────────────────────────────────────────────────┐
│  ← 戻る                                                      │
│                                                              │
│  組織設定                                                     │
│  組織の基本情報を管理します                                    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  基本情報                                               │  │
│  │                                                        │  │
│  │  組織名 *                                               │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ 株式会社サンプル                                   │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  URL スラッグ (変更不可)                                │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ sample-corp                          🔒           │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  作成日: 2024/12/01                                    │  │
│  │                                                        │  │
│  │                                    [ 変更を保存 ]      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  検査設定                                               │  │
│  │                                                        │  │
│  │  デフォルト有効期限                                     │  │
│  │  ┌──────────────┐                                      │  │
│  │  │ 7 日        ▼│                                      │  │
│  │  └──────────────┘                                      │  │
│  │                                                        │  │
│  │  自動リマインドメール                                   │  │
│  │  [✓] 有効期限の3日前に送信                             │  │
│  │  [✓] 有効期限の1日前に送信                             │  │
│  │                                                        │  │
│  │                                    [ 変更を保存 ]      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ⚠️ 危険な操作                                         │  │
│  │                                                        │  │
│  │  組織を削除すると、すべてのデータが失われます。          │  │
│  │  この操作は取り消せません。                             │  │
│  │                                                        │  │
│  │                              [ 組織を削除 ] (赤)       │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 通知設定ページ

```
┌──────────────────────────────────────────────────────────────┐
│  ← 戻る                                                      │
│                                                              │
│  通知設定                                                     │
│  メール通知の受信設定を管理します                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  検査関連の通知                                         │  │
│  │                                                        │  │
│  │  [✓] 検査が完了したとき                                 │  │
│  │      候補者が検査を完了するとメールで通知します           │  │
│  │                                                        │  │
│  │  [✓] AI分析が完了したとき                               │  │
│  │      AI分析結果が利用可能になるとメールで通知します       │  │
│  │                                                        │  │
│  │  [ ] 検査の有効期限が近づいたとき                        │  │
│  │      有効期限の24時間前にメールで通知します               │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  システム通知                                           │  │
│  │                                                        │  │
│  │  [✓] 週次サマリーメール                                 │  │
│  │      毎週月曜日に検査・候補者の統計をまとめて送信        │  │
│  │                                                        │  │
│  │  [✓] セキュリティアラート                               │  │
│  │      不審なログインや重要な変更があった場合に通知        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  通知先メールアドレス                                   │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ admin@example.com                                 │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ※ アカウントのメールアドレスに送信されます             │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│                                        [ 変更を保存 ]        │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 セキュリティページ

```
┌──────────────────────────────────────────────────────────────┐
│  ← 戻る                                                      │
│                                                              │
│  セキュリティ                                                 │
│  アカウントのセキュリティを管理します                          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  2要素認証                                     準備中   │  │
│  │                                                        │  │
│  │  2要素認証を有効にすると、ログイン時にパスワードに      │  │
│  │  加えて認証コードの入力が必要になります。               │  │
│  │                                                        │  │
│  │                              [ 2FAを設定 ] (disabled)  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  アクティブなセッション                                 │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ 🖥️ Chrome on macOS          現在のセッション      │  │  │
│  │  │    東京, 日本 • 最終アクセス: 今すぐ              │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ 📱 Safari on iOS                        [終了]   │  │  │
│  │  │    東京, 日本 • 最終アクセス: 2時間前             │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  [ 他のすべてのセッションを終了 ]                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  ログイン履歴                                           │  │
│  │                                                        │  │
│  │  日時              場所           デバイス     結果     │  │
│  │  ─────────────────────────────────────────────────────  │  │
│  │  12/28 14:30      東京, 日本     Chrome       ✅ 成功  │  │
│  │  12/28 10:15      東京, 日本     Safari       ✅ 成功  │  │
│  │  12/27 22:45      大阪, 日本     Firefox      ❌ 失敗  │  │
│  │  12/27 18:00      東京, 日本     Chrome       ✅ 成功  │  │
│  │                                                        │  │
│  │                              [ すべて表示 → ]          │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. データベース設計

### 2.1 新規テーブル

#### `user_notification_preferences` テーブル

```sql
CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Assessment notifications
    assessment_completed BOOLEAN NOT NULL DEFAULT true,
    analysis_completed BOOLEAN NOT NULL DEFAULT true,
    assessment_expiring BOOLEAN NOT NULL DEFAULT false,

    -- System notifications
    weekly_summary BOOLEAN NOT NULL DEFAULT true,
    security_alerts BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX idx_user_notification_prefs_user ON user_notification_preferences(user_id);
```

#### `login_history` テーブル

```sql
CREATE TABLE login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Login details
    ip_address INET,
    user_agent TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    browser TEXT,     -- 'Chrome', 'Safari', 'Firefox', etc.
    os TEXT,          -- 'macOS', 'Windows', 'iOS', 'Android'

    -- Location (from IP)
    country TEXT,
    city TEXT,

    -- Result
    success BOOLEAN NOT NULL DEFAULT true,
    failure_reason TEXT, -- 'invalid_password', 'account_locked', etc.

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_login_history_user ON login_history(user_id);
CREATE INDEX idx_login_history_created ON login_history(created_at DESC);

-- Keep only last 90 days of login history (optional cleanup)
-- Can be handled by a scheduled function
```

#### `user_sessions` テーブル

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Session info
    session_token TEXT NOT NULL UNIQUE,

    -- Device info
    ip_address INET,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,

    -- Location
    country TEXT,
    city TEXT,

    -- Status
    is_current BOOLEAN NOT NULL DEFAULT false,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
```

### 2.2 既存テーブル拡張

#### `organizations.settings` JSONB 構造

```typescript
interface OrganizationSettings {
  // Assessment defaults
  assessment: {
    defaultValidityDays: number;     // default: 7
    reminderDays: number[];          // default: [3, 1]
    autoReminder: boolean;           // default: true
  };

  // Branding (future)
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}
```

---

## 3. API エンドポイント

### 3.1 組織設定 API

```
GET    /api/settings/organization        # 組織情報取得
PUT    /api/settings/organization        # 組織情報更新
DELETE /api/settings/organization        # 組織削除（admin only）
```

### 3.2 通知設定 API

```
GET    /api/settings/notifications       # 通知設定取得
PUT    /api/settings/notifications       # 通知設定更新
```

### 3.3 セキュリティ API

```
GET    /api/settings/security/sessions   # アクティブセッション一覧
DELETE /api/settings/security/sessions/:id  # セッション終了
DELETE /api/settings/security/sessions   # 他のセッションを全終了

GET    /api/settings/security/login-history  # ログイン履歴取得
```

---

## 4. 実装順序

### Phase 1: 基盤整備
1. DBマイグレーション作成・適用
2. TypeScript型定義追加

### Phase 2: 組織設定
1. API実装 (`/api/settings/organization`)
2. 画面実装 (`/admin/settings/organization/page.tsx`)
3. フォームコンポーネント作成

### Phase 3: 通知設定
1. API実装 (`/api/settings/notifications`)
2. 画面実装 (`/admin/settings/notifications/page.tsx`)
3. 通知プリファレンスコンポーネント作成

### Phase 4: セキュリティ
1. ログイン履歴記録の実装（Auth hook）
2. セッション管理API実装
3. 画面実装 (`/admin/settings/security/page.tsx`)

---

## 5. GitHub Issues

### Issue #1: 組織設定ページ実装

**Title**: feat: 組織設定ページの実装

**Labels**: `feature`, `P2`, `dod:silver`

**Body**:
```markdown
## 背景
設定ページの「組織設定」が現在無効化されている。組織情報の確認・編集機能を実装する。

## 要件
- [ ] 組織名の編集
- [ ] 検査デフォルト設定（有効期限、リマインダー）
- [ ] 組織削除機能（admin限定、確認ダイアログ付き）

## 技術仕様
- API: `/api/settings/organization`
- 画面: `/admin/settings/organization/page.tsx`

## 受け入れ条件
- [ ] 組織名を編集して保存できる
- [ ] 検査設定を変更して保存できる
- [ ] admin以外は削除ボタンが表示されない
```

### Issue #2: 通知設定ページ実装

**Title**: feat: 通知設定ページの実装

**Labels**: `feature`, `P2`, `dod:silver`

**Body**:
```markdown
## 背景
設定ページの「通知設定」が現在無効化されている。メール通知の受信設定機能を実装する。

## 要件
- [ ] 検査完了通知のON/OFF
- [ ] AI分析完了通知のON/OFF
- [ ] 週次サマリーのON/OFF
- [ ] セキュリティアラートのON/OFF

## 技術仕様
- 新規テーブル: `user_notification_preferences`
- API: `/api/settings/notifications`
- 画面: `/admin/settings/notifications/page.tsx`

## 受け入れ条件
- [ ] 各通知設定を個別にON/OFFできる
- [ ] 設定変更が即時反映される
```

### Issue #3: セキュリティページ実装

**Title**: feat: セキュリティページの実装

**Labels**: `feature`, `P2`, `dod:silver`

**Body**:
```markdown
## 背景
設定ページの「セキュリティ」が現在無効化されている。ログイン履歴とセッション管理機能を実装する。

## 要件
- [ ] アクティブセッション一覧表示
- [ ] 他のセッションの強制終了
- [ ] ログイン履歴の表示
- [ ] 2FA設定UI（将来対応のため無効表示）

## 技術仕様
- 新規テーブル: `login_history`, `user_sessions`
- API: `/api/settings/security/*`
- 画面: `/admin/settings/security/page.tsx`

## 受け入れ条件
- [ ] 現在のセッションが「現在のセッション」と表示される
- [ ] 他のセッションを終了できる
- [ ] ログイン履歴が新しい順に表示される
```

---

## 6. テスト計画

### 単体テスト
- 各API エンドポイントのテスト
- フォームバリデーションのテスト

### E2E テスト
- 設定ページのナビゲーション
- 組織名変更フロー
- 通知設定変更フロー
- セッション終了フロー

---

## 7. スケジュール目安

| フェーズ | 内容 | 工数目安 |
|---------|------|----------|
| Phase 1 | DB設計・マイグレーション | 0.5日 |
| Phase 2 | 組織設定 | 1日 |
| Phase 3 | 通知設定 | 1日 |
| Phase 4 | セキュリティ | 1.5日 |
| テスト | E2E・手動テスト | 0.5日 |
| **合計** | | **4.5日** |

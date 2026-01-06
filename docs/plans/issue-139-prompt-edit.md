# Issue #139: プロンプト直接編集機能の実装計画

## 📋 概要

| 項目 | 内容 |
|------|------|
| Issue | [#139](https://github.com/PROLE-ISLAND/hy-assessment/issues/139) |
| 優先度 | P2 (Medium) |
| DoD Level | Silver |
| 影響範囲 | フロントエンド / バックエンド / データベース |

---

## Phase 1: 既存実装調査

### 1.1 現状の構成

```
src/app/admin/prompts/
├── page.tsx              # 一覧ページ ✅
├── new/
│   └── page.tsx          # 新規作成ページ ✅
└── [id]/
    └── page.tsx          # 詳細ページ ✅（編集機能なし）
```

### 1.2 課題

1. **直接編集不可**: 既存プロンプトの編集は「複製して編集」のみ
2. **バージョン管理なし**: 変更履歴を追跡できない
3. **復元不可**: 誤った変更を戻せない

---

## Phase 2: ユースケース定義

| UC-ID | Role | Action | Channel |
|-------|------|--------|---------|
| UC-PROMPT-EDIT | 管理者 | プロンプトを直接編集する | WEB |
| UC-PROMPT-PREVIEW | 管理者 | 編集中のプロンプトをプレビューする | WEB |
| UC-PROMPT-HISTORY | 管理者 | プロンプトの変更履歴を確認する | WEB |
| UC-PROMPT-REVERT | 管理者 | 過去バージョンに戻す | WEB |

---

## Phase 3: 品質基準（Silver DoD）

### 必須項目

- [ ] 型安全性: 全ファイル TypeScript strict mode
- [ ] テストカバレッジ: 85%以上
- [ ] E2Eテスト: 編集・保存・履歴確認フロー
- [ ] アクセシビリティ: キーボード操作対応
- [ ] RLS: organization_id による組織間分離

### Gold E2E 候補評価

| 軸 | スコア | 理由 |
|----|--------|------|
| Impact | 4 | プロンプト変更はAI分析結果に直結 |
| Frequency | 3 | 管理者が定期的に利用 |
| Detectability | 2 | 分析結果異常で発覚 |
| Recovery Cost | 3 | バージョン管理で復旧可能 |
| **合計** | 12/20 | → Silver + E2E推奨 |

---

## Phase 4: 技術設計

### 4.1 データベース設計

#### prompt_versions テーブル（新規）

```sql
CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,  -- "1.0.0", "1.1.0"
    content TEXT NOT NULL,
    change_summary TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(prompt_id, version)
);

-- Indexes
CREATE INDEX idx_prompt_versions_prompt ON prompt_versions(prompt_id);
CREATE INDEX idx_prompt_versions_created ON prompt_versions(created_at DESC);

-- RLS
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_versions_select_policy" ON prompt_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM prompts p
            WHERE p.id = prompt_versions.prompt_id
            AND p.organization_id = (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "prompt_versions_insert_policy" ON prompt_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM prompts p
            WHERE p.id = prompt_versions.prompt_id
            AND p.organization_id = (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        )
    );
```

#### prompts テーブル拡張

```sql
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS current_version VARCHAR(20) DEFAULT '1.0.0';
```

### 4.2 API設計

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/prompts/:id` | プロンプト詳細取得 |
| PUT | `/api/prompts/:id` | プロンプト更新（新バージョン作成） |
| GET | `/api/prompts/:id/versions` | バージョン履歴取得 |
| POST | `/api/prompts/:id/versions/:version/revert` | 過去バージョンに復元 |

#### リクエスト/レスポンス型

```typescript
// PUT /api/prompts/:id
interface UpdatePromptRequest {
  content: string;
  changeSummary?: string;
}

interface UpdatePromptResponse {
  id: string;
  content: string;
  version: string;
  updatedAt: string;
}

// GET /api/prompts/:id/versions
interface VersionHistoryResponse {
  versions: {
    version: string;
    content: string;
    changeSummary: string | null;
    createdBy: { email: string };
    createdAt: string;
  }[];
}
```

### 4.3 変更ファイル一覧

| ファイル | 変更種別 | 概要 |
|---------|----------|------|
| `supabase/migrations/xxx_prompt_versions.sql` | 新規 | バージョン履歴テーブル |
| `src/types/database.ts` | 修正 | 型定義追加 |
| `src/app/admin/prompts/[id]/edit/page.tsx` | 新規 | 編集ページ |
| `src/app/api/prompts/[id]/route.ts` | 修正 | PUT追加 |
| `src/app/api/prompts/[id]/versions/route.ts` | 新規 | バージョン履歴API |
| `src/components/prompts/PromptEditor.tsx` | 新規 | エディタコンポーネント |
| `src/components/prompts/PromptPreview.tsx` | 新規 | プレビューコンポーネント |
| `src/components/prompts/VersionHistory.tsx` | 新規 | 履歴コンポーネント |

### 4.4 UI設計

#### 編集画面

```
┌─────────────────────────────────────────────────────────────┐
│  ← プロンプト一覧                                            │
│                                                             │
│  プロンプト編集: システムプロンプト                          │
│  現在のバージョン: v2.0.0                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [編集] [プレビュー] [履歴]                                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │ あなたは入社前適性検査の専門家です。                     ││
│  │ 候補者 {{candidate_name}} の回答を分析してください。    ││
│  │                                                         ││
│  │ {{#変数ハイライト表示#}}                                ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  利用可能な変数:                                            │
│  • {{candidate_name}} - 候補者名                            │
│  • {{assessment_type}} - 検査種別                           │
│  • {{responses}} - 回答データ                               │
├─────────────────────────────────────────────────────────────┤
│  [キャンセル]                         [保存 → v2.1.0]       │
└─────────────────────────────────────────────────────────────┘
```

#### バリアント

| 状態 | data-testid | 説明 |
|------|-------------|------|
| Default | `prompt-editor` | 通常編集状態 |
| Loading | `prompt-editor-skeleton` | データ読み込み中 |
| Saving | `prompt-editor-saving` | 保存処理中 |
| Error | `prompt-editor-error` | エラー表示 |

---

## Phase 5: テスト設計

### 5.1 単体テスト

| テスト対象 | テストケース |
|-----------|-------------|
| バージョン番号 | インクリメントロジック（1.0.0 → 1.0.1） |
| 変数ハイライト | `{{xxx}}` パターン検出 |
| API PUT | 更新成功、バリデーションエラー |
| API versions | 履歴取得、revert処理 |

### 5.2 E2Eテスト

```typescript
// e2e/integration/prompt-edit.spec.ts
test.describe('プロンプト編集', () => {
  test('編集 → 保存 → バージョン確認', async ({ page }) => {
    // 1. プロンプト詳細ページへ遷移
    // 2. 「編集」ボタンクリック
    // 3. コンテンツ編集
    // 4. 「保存」ボタンクリック
    // 5. バージョン番号が更新されていることを確認
  });

  test('履歴表示 → 過去バージョン復元', async ({ page }) => {
    // 1. 履歴タブを開く
    // 2. 過去バージョンの「復元」ボタンクリック
    // 3. 確認ダイアログで「OK」
    // 4. コンテンツが復元されていることを確認
  });
});
```

---

## ✅ 受け入れ条件

- [ ] プロンプト詳細ページから「編集」ボタンで編集画面に遷移できる
- [ ] テキストエリアで直接プロンプト内容を編集できる
- [ ] 変数（`{{xxx}}`）がハイライト表示される
- [ ] プレビュータブでサンプルデータ適用後の結果を確認できる
- [ ] 保存時にバージョンが自動インクリメントされる
- [ ] 変更履歴タブでバージョン一覧を確認できる
- [ ] 過去バージョンに復元できる（確認ダイアログ付き）
- [ ] ローディング・保存中・エラー状態のバリアント表示

---

## 実装順序

1. **DB**: マイグレーション作成・適用
2. **API**: versions API 実装
3. **UI**: PromptEditor コンポーネント
4. **UI**: VersionHistory コンポーネント
5. **E2E**: テスト作成・実行

# E2Eテスト仕様書

HY Assessment システムのE2Eテストで検証すべき項目を定義する。

---

## 概要

### システムフロー

```
管理者ログイン → 候補者登録 → 検査リンク送付 → 候補者回答 → AI分析 → レポート閲覧/共有
```

### テスト方針

- **data-testid ベース**: セレクタは `[data-testid="xxx"]` を優先
- **Storage State 認証**: 認証済み状態を再利用し、テスト高速化
- **ユーザーフロー重視**: 単体機能より実際の利用シナリオを重視

---

## 1. 認証フロー

### 対象ページ
- `/login`
- `/admin/*`（認証必須）

### チェック項目

| ID | 項目 | 重要度 | 期待結果 |
|----|------|--------|----------|
| AUTH-001 | 未認証で管理画面アクセス | 必須 | `/login` へリダイレクト |
| AUTH-002 | 正しい認証情報でログイン | 必須 | `/admin` へ遷移、セッション確立 |
| AUTH-003 | 誤った認証情報でログイン | 必須 | エラーメッセージ表示、ページ遷移なし |
| AUTH-004 | メール形式バリデーション | 必須 | 不正形式で送信ブロック |
| AUTH-005 | ログアウト | 必須 | セッション破棄、`/login` へ遷移 |

### 使用セレクタ
```typescript
SELECTORS.loginEmail      // [data-testid="login-email"]
SELECTORS.loginPassword   // [data-testid="login-password"]
SELECTORS.loginSubmit     // [data-testid="login-submit"]
SELECTORS.loginError      // [data-testid="login-error"]
```

---

## 2. 候補者管理フロー

### 対象ページ
- `/admin/candidates` - 一覧
- `/admin/candidates/new` - 新規登録
- `/admin/candidates/[id]` - 詳細

### チェック項目

| ID | 項目 | 重要度 | 期待結果 |
|----|------|--------|----------|
| CAND-001 | 候補者一覧表示 | 必須 | テーブル or 空状態メッセージ表示 |
| CAND-002 | 新規登録ボタン表示・動作 | 必須 | `/admin/candidates/new` へ遷移 |
| CAND-003 | 必須項目未入力で登録 | 必須 | バリデーションエラー表示 |
| CAND-004 | 正常な候補者登録 | 必須 | 登録成功、一覧へ遷移、トースト表示 |
| CAND-005 | 候補者詳細表示 | 必須 | 候補者情報・検査状況表示 |
| CAND-006 | 検査リンクコピー | 必須 | クリップボードにURL保存 |
| CAND-007 | 一括選択 | 重要 | チェックボックスで複数選択可能 |
| CAND-008 | 比較画面へ遷移 | 重要 | 選択候補者で `/admin/compare` へ |
| CAND-009 | 候補者削除 | 重要 | 確認ダイアログ→削除→一覧から消去 |

### 使用セレクタ
```typescript
SELECTORS.addCandidateButton   // [data-testid="add-candidate-button"]
SELECTORS.candidateName        // [data-testid="candidate-name"]
SELECTORS.candidateEmail       // [data-testid="candidate-email"]
SELECTORS.candidateSubmit      // [data-testid="candidate-submit"]
SELECTORS.candidateCancel      // [data-testid="candidate-cancel"]
SELECTORS.selectAllButton      // [data-testid="select-all-button"]
SELECTORS.compareButton        // [data-testid="compare-button"]
```

---

## 3. 検査実施フロー（候補者側）

### 対象ページ
- `/assessment/[token]` - 検査回答
- `/assessment/complete` - 完了
- `/assessment/expired` - 期限切れ

### チェック項目

| ID | 項目 | 重要度 | 期待結果 |
|----|------|--------|----------|
| ASSESS-001 | 有効トークンで検査ページ表示 | 必須 | SurveyJS フォーム表示 |
| ASSESS-002 | 無効トークンでエラー | 必須 | 404 or エラーページ表示 |
| ASSESS-003 | 期限切れトークンでエラー | 必須 | `/assessment/expired` へ遷移 |
| ASSESS-004 | 質問への回答入力 | 必須 | ラジオボタン選択可能 |
| ASSESS-005 | ページ遷移で自動保存 | 必須 | 次ページへ遷移時に進捗保存 |
| ASSESS-006 | 全問回答後に完了画面 | 必須 | `/assessment/complete` 表示 |
| ASSESS-007 | 回答済みトークンの再アクセス | 重要 | 完了画面 or 回答不可メッセージ |

### 前提条件
- **テストデータシーディング必要**: 有効な検査トークンを事前に作成

### 使用セレクタ（追加推奨）
```typescript
// 要追加
'[data-testid="survey-container"]'
'[data-testid="survey-next-button"]'
'[data-testid="survey-submit-button"]'
```

---

## 4. AI分析フロー

### 対象ページ
- `/admin/assessments` - 検査一覧
- `/admin/assessments/[id]` - 分析結果

### チェック項目

| ID | 項目 | 重要度 | 期待結果 |
|----|------|--------|----------|
| ANAL-001 | 検査一覧表示 | 必須 | テーブル or 空状態表示 |
| ANAL-002 | 分析結果タブ表示 | 必須 | スコア・チャート表示 |
| ANAL-003 | 履歴タブ切替 | 重要 | 過去の分析バージョン一覧 |
| ANAL-004 | 再分析ダイアログ表示 | 重要 | モデル選択オプション表示 |
| ANAL-005 | 再分析キャンセル | 重要 | ダイアログ閉じる |
| ANAL-006 | 再分析実行 | 重要 | 新しい分析結果生成 |
| ANAL-007 | PDF出力 | 重要 | PDFダウンロード開始 |
| ANAL-008 | 未分析状態の表示 | 必須 | 「分析を実行」ボタン表示 |

### 使用セレクタ（追加推奨）
```typescript
// 要追加
'[data-testid="reanalyze-button"]'
'[data-testid="pdf-download-button"]'
'[data-testid="analysis-tab"]'
'[data-testid="history-tab"]'
```

---

## 5. レポート・共有フロー

### 対象ページ
- `/admin/reports` - 組織レポート
- `/report/[token]` - 公開レポート
- `/report/resend` - レポート再送

### チェック項目

| ID | 項目 | 重要度 | 期待結果 |
|----|------|--------|----------|
| REPORT-001 | 組織レポート表示 | 必須 | ドメイン別・職種別集計表示 |
| REPORT-002 | 公開レポート表示（有効トークン） | 必須 | 分析結果・チャート表示 |
| REPORT-003 | 公開レポート（無効トークン） | 必須 | エラーページ表示 |
| REPORT-004 | レポート再送機能 | 重要 | メール送信成功メッセージ |

### 使用セレクタ（追加推奨）
```typescript
// 要追加
'[data-testid="domain-chart"]'
'[data-testid="position-chart"]'
'[data-testid="resend-button"]'
```

---

## 6. 比較機能

### 対象ページ
- `/admin/compare`

### チェック項目

| ID | 項目 | 重要度 | 期待結果 |
|----|------|--------|----------|
| COMP-001 | 比較画面表示 | 必須 | 選択候補者のスコア比較表示 |
| COMP-002 | 職種フィルター | 重要 | フィルター適用で候補者絞り込み |
| COMP-003 | 全選択/解除 | 重要 | チェック状態一括変更 |
| COMP-004 | レーダーチャート表示 | 必須 | 複数候補者の比較チャート |

### 使用セレクタ
```typescript
SELECTORS.comparePositionFilter    // [data-testid="compare-position-filter"]
SELECTORS.compareSelectAllButton   // [data-testid="compare-select-all-button"]
```

---

## 7. プロンプト管理

### 対象ページ
- `/admin/prompts` - 一覧
- `/admin/prompts/new` - 新規作成
- `/admin/prompts/[id]` - 詳細
- `/admin/prompts/[id]/edit` - 編集
- `/admin/prompts/[id]/test` - テスト実行

### チェック項目

| ID | 項目 | 重要度 | 期待結果 |
|----|------|--------|----------|
| PROMPT-001 | プロンプト一覧表示 | 必須 | テーブル or 空状態表示 |
| PROMPT-002 | 新規作成画面遷移 | 必須 | フォーム表示 |
| PROMPT-003 | プロンプト詳細表示 | 必須 | 内容・設定表示 |
| PROMPT-004 | プロンプトコピー | 重要 | 既存内容でフォーム表示 |
| PROMPT-005 | 有効/無効切替 | 重要 | ステータス変更、反映 |

### 使用セレクタ
```typescript
SELECTORS.promptCreateButton   // [data-testid="prompt-create-button"]
```

---

## 8. テンプレート管理

### 対象ページ
- `/admin/templates` - 一覧
- `/admin/templates/[id]` - 詳細
- `/admin/templates/[id]/edit` - 編集

### チェック項目

| ID | 項目 | 重要度 | 期待結果 |
|----|------|--------|----------|
| TMPL-001 | テンプレート一覧表示 | 必須 | テーブル表示 |
| TMPL-002 | テンプレート詳細表示 | 必須 | 質問内容・設定表示 |
| TMPL-003 | 新バージョン作成 | 重要 | ダイアログ→バージョン追加 |
| TMPL-004 | 有効/無効切替 | 重要 | ステータス変更 |

---

## 9. ナビゲーション

### チェック項目

| ID | 項目 | 重要度 | 期待結果 |
|----|------|--------|----------|
| NAV-001 | サイドバー全リンク動作 | 必須 | 各ページへ正常遷移 |
| NAV-002 | 現在ページのハイライト | 重要 | アクティブ状態表示 |
| NAV-003 | モバイル表示 | 重要 | ハンバーガーメニュー動作 |

### 使用セレクタ
```typescript
SELECTORS.navDashboard    // [data-testid="nav-dashboard"]
SELECTORS.navCandidates   // [data-testid="nav-candidates"]
SELECTORS.navCompare      // [data-testid="nav-compare"]
SELECTORS.navReports      // [data-testid="nav-reports"]
SELECTORS.navTemplates    // [data-testid="nav-templates"]
SELECTORS.navPrompts      // [data-testid="nav-prompts"]
SELECTORS.navSettings     // [data-testid="nav-settings"]
```

---

## 10. 横断的要件

| ID | 項目 | 重要度 | 期待結果 |
|----|------|--------|----------|
| CROSS-001 | ローディング状態表示 | 重要 | スピナー or スケルトン表示 |
| CROSS-002 | エラートースト表示 | 重要 | 操作失敗時にトースト表示 |
| CROSS-003 | 成功トースト表示 | 重要 | 操作成功時にトースト表示 |
| CROSS-004 | 組織間データ分離 | 必須 | 他組織のデータ非表示 |

---

## 実装状況

| フロー | 状態 | 備考 |
|--------|------|------|
| 認証 | ✅ 実装済 | `01-auth.spec.ts` |
| 候補者管理 | ✅ 実装済 | `02-candidates.spec.ts` |
| 検査実施 | ❌ 未実装 | シーディング必要 |
| AI分析 | ⚠️ 部分的 | `03-analysis.spec.ts`（データ依存） |
| レポート | ✅ 実装済 | `08-reports.spec.ts` |
| 比較 | ✅ 実装済 | `09-compare.spec.ts` |
| プロンプト | ⚠️ 部分的 | `04-prompts.spec.ts` |
| テンプレート | ⚠️ 部分的 | `05-templates.spec.ts` |
| ナビゲーション | ✅ 実装済 | `07-navigation.spec.ts` |
| 公開ページ | ⚠️ 部分的 | `06-public-pages.spec.ts` |

---

## 次のステップ

1. **テストデータシーディング導入** - 検査トークン生成スクリプト作成
2. **未実装フロー追加** - レポート、比較、検査実施
3. **data-testid 追加** - コンポーネント側に不足セレクタ追加
4. **Flaky対策** - `waitForTimeout` を確定的待機に置換

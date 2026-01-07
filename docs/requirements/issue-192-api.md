## 1. 調査レポート

**調査レポートリンク**: 親Issue #149 で調査済み、#192 Phase 1-5 統合要件定義で詳細設計完了

### Investigation Report v1 要約

| 項目 | 内容 |
|------|------|
| 既存システム名 | HY Assessment 組織設定機能 |
| エントリーポイント | UI: `/admin/settings/` / API: `/api/settings/` |
| 主要データモデル | organizations, users, candidates, ai_analyses |
| キーファイル | `src/app/api/settings/**`, `src/lib/supabase/client.ts` |
| 拡張ポイント | `/api/settings/job-types` 新規追加、`/api/assessments/personality` 新規追加 |
| 破壊ポイント | API認証・RLS不整合によるデータ漏洩リスク |
| やりたいこと（1行） | 職種マスターCRUD API + パーソナリティ検査APIを実装する |

---

## 2. Phase 2: 要件定義・ユースケース

### 2.1 機能概要

| 項目 | 内容 |
|------|------|
| **なぜ必要か（Why）** | UIと連携する職種マスターCRUDエンドポイント、パーソナリティ検査結果保存APIが必要 |
| **誰が使うか（Who）** | フロントエンドUI（Admin画面）、候補者検査フォーム |
| **何を達成するか（What）** | DB操作をAPI経由で安全に実行、適切な認証・バリデーション・エラーハンドリング |

### 2.2 ユースケース定義（API スコープ）

| UC-ID | Role | Outcome | Channel | 説明 |
|-------|------|---------|---------|------|
| UC-API-JOB-LIST | Admin | 職種一覧取得 | API | GET /api/settings/job-types |
| UC-API-JOB-CREATE | Admin | 職種新規作成 | API | POST /api/settings/job-types |
| UC-API-JOB-UPDATE | Admin | 職種更新 | API | PUT /api/settings/job-types/:id |
| UC-API-JOB-DELETE | Admin | 職種削除 | API | DELETE /api/settings/job-types/:id |
| UC-API-PERSONALITY-TEMPLATE | System | 検査テンプレート取得 | API | GET /api/assessments/personality/template |
| UC-API-PERSONALITY-SAVE | Candidate | 検査結果保存 | API | POST /api/assessments/personality/:candidateId |
| UC-API-PERSONALITY-GET | Admin | 候補者パーソナリティ取得 | API | GET /api/candidates/:id/personality |

### 2.3 カバレッジマトリクス（API）

| Role＼Outcome | 職種一覧 | 職種作成 | 職種更新 | 職種削除 | 検査テンプレート | 結果保存 | 結果取得 |
|---------------|:--------:|:--------:|:--------:|:--------:|:---------------:|:--------:|:--------:|
| Admin | ✅ | ✅ | ✅ | ✅ | — | — | ✅ |
| Candidate | — | — | — | — | ✅ | ✅ | — |
| System | — | — | — | — | ✅ | — | — |

---

## 3. Phase 3: 品質基準

### 3.1 DoD Level: Silver

**選定理由**: DB操作を伴うAPIのため、適切な認証・バリデーション・エラーハンドリングが必要。

### 3.2 Pre-mortem（失敗シナリオ）⚠️

| # | 失敗シナリオ | 発生確率 | 対策 | 確認方法 |
|---|-------------|---------|------|---------|
| 1 | 認証なしでAPI呼び出しされデータ漏洩 | 高 | 全エンドポイントで認証チェック必須 | 未認証リクエストで401確認 |
| 2 | 他組織のデータを取得/更新できる | 高 | organization_idによるフィルタリング + RLS二重チェック | 統合テストで他組織アクセス検証 |
| 3 | バリデーション不足で不正データ保存 | 中 | Zodスキーマによる入力検証 | 境界値・異常値テスト |
| 4 | エラー時に500返却で原因不明 | 中 | 構造化エラーレスポンス設計 | 各エラーパターンで適切なステータスコード確認 |
| 5 | 検査結果の重複保存 | 低 | UNIQUE制約 + APIレベルで既存チェック | 重複保存試行で409確認 |

---

## 4. Phase 4: 技術設計

### 4.1 API設計詳細

#### 4.1.1 職種マスターAPI

**GET /api/settings/job-types**

| 項目 | 内容 |
|------|------|
| 認証 | 必須（Admin） |
| クエリパラメータ | `?includeInactive=true` (任意) |
| レスポンス | `{ jobTypes: JobType[] }` |
| エラー | 401 Unauthorized, 500 Internal Server Error |

**POST /api/settings/job-types**

| 項目 | 内容 |
|------|------|
| 認証 | 必須（Admin） |
| リクエストボディ | `JobTypeCreateInput` (Zodスキーマ) |
| レスポンス | `{ jobType: JobType }` |
| エラー | 400 Bad Request, 401 Unauthorized, 409 Conflict (重複名), 500 Internal Server Error |

**PUT /api/settings/job-types/:id**

| 項目 | 内容 |
|------|------|
| 認証 | 必須（Admin） |
| パスパラメータ | `id` (UUID) |
| リクエストボディ | `JobTypeUpdateInput` (Zodスキーマ) |
| レスポンス | `{ jobType: JobType }` |
| エラー | 400 Bad Request, 401 Unauthorized, 404 Not Found, 409 Conflict, 500 Internal Server Error |

**DELETE /api/settings/job-types/:id**

| 項目 | 内容 |
|------|------|
| 認証 | 必須（Admin） |
| パスパラメータ | `id` (UUID) |
| 動作 | 論理削除 (`deleted_at` 設定) |
| レスポンス | `{ success: true }` |
| エラー | 401 Unauthorized, 404 Not Found, 500 Internal Server Error |

#### 4.1.2 パーソナリティ検査API

**GET /api/assessments/personality/template**

| 項目 | 内容 |
|------|------|
| 認証 | 不要（候補者アクセス用） |
| レスポンス | `{ template: PersonalityTemplate }` |
| 内容 | 67問の検査質問データ（DISC 24問 + ストレス 12問 + EQ 16問 + 価値観 15問） |

**POST /api/assessments/personality/:candidateId**

| 項目 | 内容 |
|------|------|
| 認証 | 候補者トークン検証 |
| パスパラメータ | `candidateId` (UUID) |
| リクエストボディ | `PersonalityResponseInput` (67問の回答) |
| レスポンス | `{ assessment: PersonalityAssessment }` |
| エラー | 400 Bad Request, 401 Unauthorized, 404 Candidate Not Found, 409 Already Submitted, 500 Internal Server Error |

**GET /api/candidates/:id/personality**

| 項目 | 内容 |
|------|------|
| 認証 | 必須（Admin） |
| パスパラメータ | `id` (UUID) |
| レスポンス | `{ personality: PersonalityAssessment | null }` |
| エラー | 401 Unauthorized, 404 Candidate Not Found, 500 Internal Server Error |

### 4.2 エラーハンドリング設計

| API | エラーケース | HTTPステータス | レスポンス |
|-----|------------|--------------|-----------|
| 全API | 未認証アクセス | 401 | `{ error: "unauthorized", message: "認証が必要です" }` |
| 全API | 権限不足 | 403 | `{ error: "forbidden", message: "権限がありません" }` |
| POST/PUT | バリデーションエラー | 400 | `{ error: "validation_error", details: {...} }` |
| GET/PUT/DELETE | リソース不存在 | 404 | `{ error: "not_found", message: "職種が見つかりません" }` |
| POST | 重複登録 | 409 | `{ error: "conflict", message: "同名の職種が存在します" }` |
| 全API | サーバーエラー | 500 | `{ error: "internal_error", message: "サーバーエラーが発生しました" }` |

### 4.3 非機能要件（API）

| 観点 | 要件 | 検証方法 |
|------|------|---------|
| **レート制限** | 60 req/min | 負荷テストで確認 |
| **タイムアウト** | 10秒 | API応答時間監視 |
| **最大ペイロード** | 1MB | 境界値テストで確認 |
| **リトライポリシー** | クライアント側で3回、指数バックオフ | E2Eテストで確認 |

### 4.4 CRUD操作マトリクス（API → DB）

| テーブル | Create | Read | Update | Delete | 担当API |
|---------|:------:|:----:|:------:|:------:|---------|
| job_types | ✅ | ✅ | ✅ | ✅(論理) | /api/settings/job-types |
| personality_assessments | ✅ | ✅ | ❌ | ❌ | /api/assessments/personality |

### 4.5 変更ファイル一覧

| ファイルパス | 変更種別 | 概要 |
|-------------|---------|------|
| `src/app/api/settings/job-types/route.ts` | 新規 | GET/POST 職種一覧・作成 |
| `src/app/api/settings/job-types/[id]/route.ts` | 新規 | PUT/DELETE 職種更新・削除 |
| `src/app/api/assessments/personality/template/route.ts` | 新規 | GET 検査テンプレート |
| `src/app/api/assessments/personality/[candidateId]/route.ts` | 新規 | POST 検査結果保存 |
| `src/app/api/candidates/[id]/personality/route.ts` | 新規 | GET パーソナリティ取得 |
| `src/lib/validations/job-types.ts` | 新規 | Zodスキーマ定義 |
| `src/lib/validations/personality.ts` | 新規 | パーソナリティ入力スキーマ |
| `src/lib/assessments/personality-template.ts` | 新規 | 検査テンプレートデータ |
| `src/lib/assessments/personality-scoring.ts` | 新規 | スコアリングロジック |
| `src/types/job-types.ts` | 新規 | 型定義 |
| `src/types/personality.ts` | 新規 | パーソナリティ型定義 |

---

## 5. Phase 5: テスト設計

### 5.1 Gold E2E候補評価（4つのレンズ）

| レンズ | 質問 | 回答 |
|--------|------|------|
| 行動フォーカス | 実装ではなくユーザー目標を検証しているか？ | いいえ（APIは内部実装） |
| 欺瞞耐性 | モック/スタブでは通過できないか？ | はい |
| 明確な失敗説明 | 失敗理由を1文で説明できるか？ | はい |
| リスク明示 | このテストがないと何を犠牲にするか？ | APIの信頼性 |

**結論**: Silver統合テストで十分（Gold E2E対象外）

### 5.2 単体テスト設計

| 対象 | テストケース | 期待結果 |
|------|------------|---------|
| `parseJobTypeInput` | 正常: 全フィールド入力 | パース成功 |
| `parseJobTypeInput` | 異常: name空文字 | バリデーションエラー |
| `parseJobTypeInput` | 境界値: スコア0/100 | パース成功 |
| `parseJobTypeInput` | 異常: スコア-1/101 | バリデーションエラー |
| `calculateDISCProfile` | 正常: D最高スコア | primary_factor = 'D' |
| `calculateStressRiskLevel` | 境界値: スコア40 | risk = 'medium' |
| `calculateStressRiskLevel` | 境界値: スコア39 | risk = 'high' |
| `calculateStressRiskLevel` | 境界値: スコア70 | risk = 'low' |
| `calculateValuesProfile` | 正常: achievement最高 | primary = 'achievement' |

### 5.3 統合テスト設計（Phase 5.6対応）⚠️ 必須

#### 5.3.1 API統合テスト

| テスト対象 | テスト内容 | 入力 | 期待結果 |
|-----------|-----------|------|---------|
| POST /api/settings/job-types | 正常作成 | 有効なJobTypeInput | 201 + 作成データ |
| POST /api/settings/job-types | 未認証 | Authヘッダーなし | 401 |
| POST /api/settings/job-types | 重複名 | 既存名で作成 | 409 |
| POST /api/settings/job-types | 不正入力 | スコア-1 | 400 + エラー詳細 |
| GET /api/settings/job-types | 一覧取得 | 認証済み | 200 + 職種配列 |
| GET /api/settings/job-types | 他組織データ | 認証済み（別組織） | 200 + 空配列 |
| PUT /api/settings/job-types/:id | 正常更新 | 有効な更新データ | 200 + 更新データ |
| PUT /api/settings/job-types/:id | 存在しないID | 無効UUID | 404 |
| DELETE /api/settings/job-types/:id | 正常削除 | 有効ID | 200 + deleted_at設定 |
| POST /api/assessments/personality/:candidateId | 正常保存 | 67問回答 | 201 + スコア計算結果 |
| POST /api/assessments/personality/:candidateId | 重複送信 | 既存候補者 | 409 |
| GET /api/candidates/:id/personality | 結果取得 | 検査完了候補者 | 200 + パーソナリティデータ |
| GET /api/candidates/:id/personality | 未検査 | 未検査候補者 | 200 + null |

#### 5.3.2 DB統合テスト

| テスト対象 | テスト内容 | 前提条件 | 期待結果 |
|-----------|-----------|---------|---------|
| RLS | 同組織データ読み取り | 認証済みユーザー | 成功 |
| RLS | 他組織データ読み取り | 認証済みユーザー（別組織） | 空結果 |
| RLS | 他組織データ更新 | 認証済みユーザー（別組織） | 失敗 |
| CHECK制約 | スコア範囲外 | INSERT disc_dominance = 101 | エラー |
| UNIQUE制約 | 候補者重複 | 同一candidate_idで再INSERT | エラー |

### 5.4 トレーサビリティ

| UC-ID | テスト種別 | ファイル | CI Stage |
|-------|-----------|---------|----------|
| UC-API-JOB-LIST | 統合テスト | job-types.integration.test.ts | Silver |
| UC-API-JOB-CREATE | 統合テスト | job-types.integration.test.ts | Silver |
| UC-API-JOB-UPDATE | 統合テスト | job-types.integration.test.ts | Silver |
| UC-API-JOB-DELETE | 統合テスト | job-types.integration.test.ts | Silver |
| UC-API-PERSONALITY-TEMPLATE | 単体テスト | personality-template.test.ts | Bronze |
| UC-API-PERSONALITY-SAVE | 統合テスト | personality.integration.test.ts | Silver |
| UC-API-PERSONALITY-GET | 統合テスト | personality.integration.test.ts | Silver |

---

## 6. 受け入れ条件

### 必須
- [ ] 職種マスターCRUD API（4エンドポイント）実装
- [ ] パーソナリティ検査API（3エンドポイント）実装
- [ ] 検査テンプレート（67問）データ作成
- [ ] スコアリングロジック（4カテゴリ）実装
- [ ] Zodバリデーションスキーマ作成
- [ ] 構造化エラーレスポンス実装
- [ ] 全APIで認証チェック実装

### テスト
- [ ] 単体テスト（バリデーション・スコアリング）
- [ ] API統合テスト（正常系・異常系・境界値）
- [ ] RLS統合テスト（組織間分離検証）

---

## 7. 依存関係

**先行（このPRの前提）:**
- PR#205 DB: マイグレーション + RLS（job_types, personality_assessments テーブル必須）

**後続（このPRに依存）:**
- PR#xxx UI: 職種設定画面 + 検査画面

**マージ順序:**
PR#205 (DB) → **この PR (API)** → PR#xxx (UI)

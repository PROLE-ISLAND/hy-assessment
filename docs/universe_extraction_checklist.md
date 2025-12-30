# hy-assessment Universe抽出チェック結果

**作成日**: 2025-12-30
**最終更新**: 2025-12-30（漏れ修正後）

---

## 1. 入力ソース確認

### 必須

- [x] **FEATURES.md** を読んだ
  - 読んだファイル: `docs/FEATURES.md`
  - 機能数: 8 件（主要画面）

- [x] **ルーティング定義** を確認した
  - 確認したパス: `src/app/`
  - 主要ルート: `/admin/*`, `/assessment/*`, `/report/*`

- [x] **DBスキーマ** を確認した
  - 確認: Supabase テーブル定義
  - 主要テーブル: candidates, assessments, responses, analyses

### 推奨

- [x] APIエンドポイント一覧を確認した（Next.js API routes）
- [ ] ユーザーストーリー / PRD（現時点で未整備）
- [x] Figmaデザインを確認した

---

## 2. Role抽出

### 2.1 アクター洗い出し

| # | Role名 | 種別 | 説明 |
|---|--------|------|------|
| 1 | ADMIN | 操作者/受益者 | 管理者（HR/採用担当者） |
| 2 | CAND | 操作者/受益者 | 候補者（検査受験者） |
| 3 | SYS | システム | バックグラウンド処理（AI分析等） |

### 2.2 価値マトリクス

| Role | 提供する価値 | 受け取る価値 |
|------|-------------|-------------|
| ADMIN | 候補者登録、検査設定、プロンプト設定 | 分析結果、採用判断材料、比較分析 |
| CAND | 回答データ | **フィードバックレポート** ★追加 |
| SYS | AI分析結果生成 | —（システムは価値を受け取らない） |

### チェック

- [x] 全Roleの「提供する価値」を記入した
- [x] 全Roleの「受け取る価値」を記入した
- [x] SYSの「受け取る価値」が空の理由: システムは処理を実行するのみ

---

## 3. Outcome抽出

### 3.1 価値タイプ別洗い出し

| 価値タイプ | Outcome一覧 |
|-----------|------------|
| security | AUTH_SUCCESS |
| data_creation | CANDIDATE_REGISTERED |
| data_persistence | RESPONSE_SAVED |
| workflow_trigger | ASSESSMENT_LINK_ISSUED |
| value_creation | ANALYSIS_GENERATED, CANDIDATES_COMPARED |
| value_delivery（管理者向け） | ANALYSIS_VIEWED, REPORT_SHARED |
| value_delivery（候補者向け） | **CANDIDATE_REPORT_VIEWED** ★追加 |
| configuration | TEMPLATE_MANAGED, PROMPT_MANAGED |
| monitoring | ASSESSMENT_LIST_VIEWED, DASHBOARD_VIEWED |
| self_service | REPORT_LINK_RESENT |
| milestone | ASSESSMENT_COMPLETED |

### チェック

- [x] 全価値タイプに対してOutcomeを検討した
- [x] **value_delivery**は全Roleに対して検討した
- [x] DBの主要テーブルに対応するOutcomeがある

---

## 4. マトリクス生成

### 4.1 Role × Outcome 完全マトリクス

| Outcome \ Role | ADMIN | CAND | SYS |
|----------------|-------|------|-----|
| AUTH_SUCCESS | ✅ UC-HY-ADMIN-AUTH-WEB | — 認証フローなし | — |
| CANDIDATE_REGISTERED | ✅ UC-HY-ADMIN-CANDIDATE-WEB | — 管理者操作 | — |
| ASSESSMENT_LINK_ISSUED | 🟡 統合済み | — 受信側 | — |
| RESPONSE_SAVED | — 閲覧のみ | ✅ UC-HY-CAND-RESPONSE-WEB | — |
| ASSESSMENT_COMPLETED | — 閲覧のみ | 🟡 統合済み | — |
| ANALYSIS_GENERATED | — | — | 🟡 統合テスト |
| ANALYSIS_VIEWED | ✅ UC-HY-ADMIN-VIEW-WEB | — 管理者専用 | — |
| CANDIDATES_COMPARED | 🟡 Silver | — 管理者専用 | — |
| REPORT_SHARED | ✅ UC-HY-ADMIN-SHARE-WEB | — 受信側 | — |
| **CANDIDATE_REPORT_VIEWED** | — 候補者専用 | **✅ UC-HY-CAND-REPORT-WEB** ★追加 | — |
| REPORT_LINK_RESENT | — | 🟡 Silver | — |
| TEMPLATE_MANAGED | 🟡 Silver | — 管理者専用 | — |
| PROMPT_MANAGED | 🟡 Silver | — 管理者専用 | — |
| ASSESSMENT_LIST_VIEWED | 🟡 Silver | — 管理者専用 | — |
| DASHBOARD_VIEWED | 🟡 Silver | — 管理者専用 | — |

### チェック

- [x] 全組み合わせを生成した（3 Role × 15 Outcome = 45セル）
- [x] 全セルに「UC-ID」「🟡」「—（理由）」のいずれかが入っている
- [x] 空欄セルがゼロ
- [x] 「—」の理由を説明できる

---

## 5. 外部整合性検証

### 5.1 FEATURES.md突合

| FEATURES.md記載機能 | 対応UC-ID | ステータス |
|---------------------|-----------|-----------|
| `/admin` - ダッシュボード | UC-HY-ADMIN-DASHBOARD-WEB | ✅ |
| `/admin/candidates` - 候補者一覧 | UC-HY-ADMIN-CANDIDATE-WEB | ✅ |
| `/admin/candidates/[id]` - 候補者詳細・分析結果 | UC-HY-ADMIN-VIEW-WEB | ✅ |
| `/admin/assessments` - 検査一覧 | UC-HY-ADMIN-ASSESSMENTS-WEB | ✅ |
| `/admin/prompts` - プロンプト管理 | UC-HY-ADMIN-PROMPT-WEB | ✅ |
| `/assessment/[token]` - 検査実施 | UC-HY-CAND-RESPONSE-WEB | ✅ |
| `/report/[token]` - 候補者レポート | **UC-HY-CAND-REPORT-WEB** | ✅ ★追加 |
| `/report/resend` - リンク再送 | UC-HY-CAND-RESEND-WEB | ✅ ★追加 |

- [x] 全機能に対応UCがある
- 未対応機能数: 0 件

### 5.2 価値フロー検証

```
管理者への価値提供:
入口 → [認証] → [候補者登録] → [分析閲覧] → [レポート共有] → 出口
       GS-001    GS-002          GS-004        GS-005
       ✅        ✅              ✅            ✅

候補者への価値提供:
入口 → [検査回答] → [レポート閲覧] → 出口
       GS-003        GS-006 ★追加
       ✅            ✅
```

- [x] 全Roleに「出口」がある
- [x] 価値フローが途切れていない

---

## 6. Gold選定

### 6.1 Gold採用結果

| # | UC-ID | Role | Outcome | Score | Gold |
|---|-------|------|---------|-------|------|
| 1 | UC-HY-ADMIN-AUTH-WEB | ADMIN | AUTH_SUCCESS | 18 | ✅ |
| 2 | UC-HY-ADMIN-CANDIDATE-WEB | ADMIN | CANDIDATE_REGISTERED | 15 | ✅ |
| 3 | UC-HY-CAND-RESPONSE-WEB | CAND | RESPONSE_SAVED | 17 | ✅ |
| 4 | UC-HY-ADMIN-VIEW-WEB | ADMIN | ANALYSIS_VIEWED | 16 | ✅ |
| 5 | UC-HY-ADMIN-SHARE-WEB | ADMIN | REPORT_SHARED | 13 | ✅ |
| 6 | **UC-HY-CAND-REPORT-WEB** | **CAND** | **CANDIDATE_REPORT_VIEWED** | **16** | **✅** ★追加 |

### 6.2 Gold線引き

- スコア閾値: 13点以上
- Gold採用数: **6本**
- 価値フローカバー: ✅ 管理者入口〜出口、候補者入口〜出口

---

## 7. 漏れ分析（振り返り）

### 初回作成時の漏れ

| 漏れた項目 | 原因 | どのチェックで防げたか |
|-----------|------|----------------------|
| UC-HY-CAND-REPORT-WEB | 候補者の「受け取る価値」を検討しなかった | Role×価値マトリクス |
| UC-HY-CAND-RESEND-WEB | FEATURES.md突合をしなかった | 外部整合性検証 |
| UC-HY-ADMIN-PROMPT-WEB | FEATURES.md突合をしなかった | 外部整合性検証 |
| UC-HY-ADMIN-ASSESSMENTS-WEB | FEATURES.md突合をしなかった | 外部整合性検証 |
| UC-HY-ADMIN-DASHBOARD-WEB | FEATURES.md突合をしなかった | 外部整合性検証 |

### 学び

```
1. 「受け取る価値」を明示的に書き出す → 視点偏りを防ぐ
2. FEATURES.mdとの突合を必ず行う → 入力漏れを防ぐ
3. 価値フロー図で「出口」を全Role分確認 → 価値提供漏れを防ぐ
```

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-30 | 初版作成（漏れ修正後、チェック結果記録） |

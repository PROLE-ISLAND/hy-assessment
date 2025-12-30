# GS-HY-006: 候補者レポート閲覧

## メタ情報

| 項目 | 値 |
|------|-----|
| **Gold Spec ID** | GS-HY-006 |
| **UC-ID** | UC-HY-CAND-REPORT-WEB |
| **Role** | 候補者（CAND） |
| **Outcome** | フィードバックレポート閲覧完了 |
| **Channel** | WEB（ブラウザ） |
| **Triage Score** | 16/20 |
| **作成日** | 2025-12-30 |
| **最終更新** | 2025-12-30 |

---

## 概要

### ユースケース説明

候補者が適性検査完了後に、自分自身のフィードバックレポートを閲覧できる機能。

このユースケースは**候補者への価値提供の唯一の完結点**であり、システムが双方向に価値を提供していることを証明する重要なGold E2Eテストである。

### ビジネス価値

- **候補者体験の向上**: 検査を受けた候補者が自己理解を深める機会を提供
- **サービス差別化**: 単なる選考ツールではなく、候補者にも価値を還元
- **信頼構築**: 候補者との良好な関係を構築し、企業ブランド向上に貢献
- **双方向価値証明**: 管理者だけでなく候補者にもシステムが価値を提供することを証明

### 前提条件

1. 候補者が検査を完了している
2. AI分析が完了している
3. 管理者がレポート公開設定を有効にしている
4. 候補者に有効なレポートトークンが発行されている

---

## Given-When-Then 仕様

### シナリオ1: 候補者がレポートを閲覧できる（Happy Path）

```gherkin
Scenario: 候補者がフィードバックレポートを正常に閲覧できる
  Given 候補者が検査を完了している
  And AI分析が完了している
  And 有効なレポートトークンが発行されている
  When 候補者がレポートリンク `/report/{token}` にアクセスする
  Then レポートページが表示される
  And 候補者の基本情報が表示される
  And 適性分析のサマリーが表示される
  And 強み・改善点が表示される
```

### シナリオ2: 無効なトークンでエラー表示

```gherkin
Scenario: 無効なトークンでアクセスするとエラーが表示される
  Given 無効なレポートトークン "invalid-token-12345" を使用する
  When 候補者が `/report/invalid-token-12345` にアクセスする
  Then エラーメッセージまたは404ページが表示される
  And レポート内容は表示されない
```

### シナリオ3: 期限切れトークンでエラー表示

```gherkin
Scenario: 期限切れトークンでアクセスするとエラーが表示される
  Given レポートトークンの有効期限が切れている
  When 候補者がレポートリンクにアクセスする
  Then 期限切れメッセージが表示される
  And レポートリンク再送フォームが表示される
```

### シナリオ4: 分析未完了でも適切に処理

```gherkin
Scenario: 分析未完了の状態でアクセスした場合
  Given 候補者が検査を完了している
  And AI分析がまだ完了していない
  When 候補者がレポートリンクにアクセスする
  Then 分析中メッセージが表示される
  Or 限定的な結果のみ表示される
```

---

## テスト要件

### 必須検証項目

| # | 検証項目 | 優先度 | data-testid |
|---|---------|--------|-------------|
| 1 | レポートページが表示される | P0 | `candidate-report`, `report-view` |
| 2 | 候補者情報が正しく表示される | P0 | `candidate-info`, `candidate-summary` |
| 3 | 分析サマリーが表示される | P0 | `analysis-summary`, `score-summary` |
| 4 | 強み・改善点が表示される | P1 | `strengths-section`, `improvement-section` |
| 5 | 無効トークンでエラー表示 | P0 | `error-message`, `not-found` |
| 6 | 期限切れでエラー表示 | P1 | `expired-message` |

### 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `E2E_TEST_REPORT_TOKEN` | テスト用有効レポートトークン | Yes |
| `E2E_TEST_EXPIRED_REPORT_TOKEN` | テスト用期限切れトークン | No |

---

## Playwright実装

### ファイル

`e2e/gold/GS-HY-006-candidate-report-view.spec.ts`

### 主要なアサーション

```typescript
// レポートページ表示
await expect(page.locator('[data-testid="candidate-report"]')).toBeVisible();

// 候補者情報表示
await expect(page.locator('[data-testid="candidate-info"]')).toBeVisible();

// 分析サマリー表示
await expect(page.locator('[data-testid="analysis-summary"]')).toBeVisible();

// 無効トークンでエラー
await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
```

---

## 関連ドキュメント

- [UC-HY-CAND-REPORT-WEB](../usecase_universe.yml#UC-HY-CAND-REPORT-WEB)
- [Coverage Matrix](../coverage_matrix.md)
- [価値フローマップ](../value_flow_map.md)

---

## 変更履歴

| 日付 | 変更者 | 内容 |
|------|--------|------|
| 2025-12-30 | Claude | 初版作成 |

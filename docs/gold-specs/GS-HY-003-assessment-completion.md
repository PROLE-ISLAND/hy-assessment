# GS-HY-003: 検査回答→完了

**UC-ID**: UC-HY-CAND-RESPONSE-WEB
**Role**: 候補者（CAND）
**Outcome**: 回答データ保存・検査完了
**Triage Score**: 17/20

---

## Given（前提条件）

- [ ] 有効な検査リンク（トークン）が存在する
- [ ] 検査テンプレートに設問が設定されている
- [ ] 検査期限内

## When（操作）

1. 検査リンク `/assessment/{token}` にアクセス
2. 候補者情報を入力（必要な場合）
3. 各設問に回答
4. 「送信」または「完了」ボタンをクリック

## Then（期待結果）

- [ ] 回答データがサーバーに保存される
- [ ] 完了画面が表示される
- [ ] ステータスが「完了」に更新される
- [ ] 再回答できない状態になる（または再回答不可の表示）

---

## 見て良い（Assert対象）

| 項目 | 検証方法 |
|------|---------|
| 完了画面表示 | `data-testid="assessment-complete"` が visible |
| URL変化 | `/assessment/{token}/complete` または同等 |
| 再アクセス時 | 完了済みメッセージ表示 |

## 見てはいけない（Assert対象外）

| 項目 | 理由 |
|------|------|
| 回答内容の正確性 | 単体テストで検証 |
| 設問のUI詳細 | Bronze（スナップショット）で検証 |
| 自動保存の動作 | 統合テストで検証 |

---

## 失敗時の意味

「候補者の回答データが保存されない」
→ 分析対象データなし。採用判断不可。事業の核心機能停止。

---

## Playwright実装

**ファイル**: `e2e/gold/GS-HY-003-assessment-completion.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('GS-HY-003: 検査回答→完了', () => {
  // Note: テスト用の検査トークンが必要
  const TEST_ASSESSMENT_TOKEN = process.env.E2E_TEST_ASSESSMENT_TOKEN;

  test('候補者が検査に回答し完了できる', async ({ page }) => {
    test.skip(!TEST_ASSESSMENT_TOKEN, 'E2E_TEST_ASSESSMENT_TOKEN not configured');

    // Given: 検査ページにアクセス
    await page.goto(`/assessment/${TEST_ASSESSMENT_TOKEN}`);

    // Given: 候補者情報入力（必要な場合）
    const candidateInfoForm = page.locator('[data-testid="candidate-info-form"]');
    if (await candidateInfoForm.isVisible()) {
      await page.fill('[data-testid="candidate-name"]', 'Test Candidate');
      await page.click('[data-testid="start-assessment-button"]');
    }

    // When: 設問に回答
    // Note: SurveyJS の場合、設問ナビゲーションが異なる可能性あり
    const surveyContainer = page.locator('.sv-root-modern, [data-testid="survey-container"]');
    await expect(surveyContainer).toBeVisible();

    // 全設問に回答（最小限の回答で進む）
    while (await page.locator('[data-testid="next-button"], .sv-btn--navigation-next').isVisible()) {
      // 各設問に回答（ラジオボタン/チェックボックスの最初の選択肢を選ぶ）
      const radioOption = page.locator('input[type="radio"]').first();
      if (await radioOption.isVisible()) {
        await radioOption.click();
      }

      await page.click('[data-testid="next-button"], .sv-btn--navigation-next');
      await page.waitForTimeout(300); // ページ遷移待機
    }

    // When: 検査を完了
    await page.click('[data-testid="complete-button"], .sv-btn--complete');

    // Then: 完了画面が表示される
    await expect(page.locator('[data-testid="assessment-complete"]')).toBeVisible({ timeout: 10000 });
  });

  test('完了済み検査に再アクセスすると完了メッセージが表示される', async ({ page }) => {
    test.skip(!TEST_ASSESSMENT_TOKEN, 'E2E_TEST_ASSESSMENT_TOKEN not configured');

    // Given: 完了済みの検査トークンでアクセス
    await page.goto(`/assessment/${TEST_ASSESSMENT_TOKEN}`);

    // Then: 完了済みメッセージまたは完了画面が表示
    const completedIndicator = page.locator(
      '[data-testid="assessment-complete"], [data-testid="already-completed"]'
    );
    await expect(completedIndicator).toBeVisible();
  });
});
```

---

## トレーサビリティ

| 項目 | 値 |
|------|-----|
| Universe ID | UC-HY-CAND-RESPONSE-WEB |
| Gold Spec ID | GS-HY-003 |
| Playwright File | `e2e/gold/GS-HY-003-assessment-completion.spec.ts` |
| CI Job | `e2e-gold` |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-30 | 初版作成 |

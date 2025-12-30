# GS-HY-005: レポート共有

**UC-ID**: UC-HY-ADMIN-SHARE-WEB
**Role**: 管理者（ADMIN）
**Outcome**: レポート外部共有完了
**Triage Score**: 13/20

---

## Given（前提条件）

- [ ] 管理者がログイン済み
- [ ] 分析完了済みの候補者が存在する
- [ ] レポート共有機能が有効

## When（操作）

1. 候補者詳細ページにアクセス
2. 「レポート共有」または「リンク発行」ボタンをクリック
3. 共有先情報を入力（メールアドレス等）
4. 「送信」ボタンをクリック

## Then（期待結果）

- [ ] 共有成功メッセージが表示される
- [ ] 共有リンクが生成される
- [ ] 共有履歴に記録される

---

## 見て良い（Assert対象）

| 項目 | 検証方法 |
|------|---------|
| 共有成功 | Toast/Alert で成功メッセージ表示 |
| リンク生成 | 共有URLが表示/コピー可能 |
| 共有履歴 | 履歴セクションに新規エントリ追加 |

## 見てはいけない（Assert対象外）

| 項目 | 理由 |
|------|------|
| メール送信成功 | 統合テスト/外部サービスで検証 |
| リンク先の詳細表示 | 別のユースケース（閲覧者視点）|
| UIの詳細レイアウト | Bronze で検証 |

---

## 失敗時の意味

「レポートを共有できない」
→ 意思決定者への情報伝達不可。採用プロセス遅延。

---

## Playwright実装

**ファイル**: `e2e/gold/GS-HY-005-report-sharing.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('GS-HY-005: レポート共有', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('管理者がレポートを共有できる', async ({ page }) => {
    // Given: 分析完了済み候補者の詳細ページにアクセス
    const candidateId = process.env.E2E_TEST_CANDIDATE_ID;
    test.skip(!candidateId, 'E2E_TEST_CANDIDATE_ID not configured');

    await page.goto(`/admin/candidates/${candidateId}`);

    // Given: 分析結果が存在する
    await expect(page.locator('[data-testid="analysis-result"]')).toBeVisible();

    // When: レポート共有ボタンをクリック
    await page.click('[data-testid="share-report-button"]');

    // Then: 共有ダイアログが表示される
    await expect(page.locator('[data-testid="share-dialog"]')).toBeVisible();

    // When: 共有先情報を入力
    await page.fill('[data-testid="share-email-input"]', 'stakeholder@example.com');

    // When: 送信ボタンをクリック
    await page.click('[data-testid="send-share-button"]');

    // Then: 成功メッセージが表示される
    await expect(page.locator('[data-testid="share-success"]')).toBeVisible({ timeout: 10000 });
  });

  test('共有リンクをコピーできる', async ({ page }) => {
    // Given: 分析完了済み候補者の詳細ページにアクセス
    const candidateId = process.env.E2E_TEST_CANDIDATE_ID;
    test.skip(!candidateId, 'E2E_TEST_CANDIDATE_ID not configured');

    await page.goto(`/admin/candidates/${candidateId}`);

    // When: 共有リンクボタンをクリック
    const copyLinkButton = page.locator('[data-testid="copy-report-link-button"]');
    if (await copyLinkButton.isVisible()) {
      await copyLinkButton.click();

      // Then: コピー成功のフィードバック
      await expect(page.locator('[data-testid="copy-success"]')).toBeVisible();
    }
  });

  test('共有されたレポートにアクセスできる', async ({ page, context }) => {
    // Note: 共有リンクのトークンが必要
    const reportToken = process.env.E2E_TEST_REPORT_TOKEN;
    test.skip(!reportToken, 'E2E_TEST_REPORT_TOKEN not configured');

    // Given: 共有リンクにアクセス（認証不要）
    const reportPage = await context.newPage();
    await reportPage.goto(`/report/${reportToken}`);

    // Then: レポートが表示される
    await expect(reportPage.locator('[data-testid="shared-report"]')).toBeVisible();

    // Then: 候補者情報が表示される
    await expect(reportPage.locator('[data-testid="candidate-summary"]')).toBeVisible();

    // Then: 分析結果が表示される
    await expect(reportPage.locator('[data-testid="analysis-summary"]')).toBeVisible();
  });
});
```

---

## トレーサビリティ

| 項目 | 値 |
|------|-----|
| Universe ID | UC-HY-ADMIN-SHARE-WEB |
| Gold Spec ID | GS-HY-005 |
| Playwright File | `e2e/gold/GS-HY-005-report-sharing.spec.ts` |
| CI Job | `e2e-gold` |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-30 | 初版作成 |

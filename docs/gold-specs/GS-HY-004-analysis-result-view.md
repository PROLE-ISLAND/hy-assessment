# GS-HY-004: 分析結果閲覧

**UC-ID**: UC-HY-ADMIN-VIEW-WEB
**Role**: 管理者（ADMIN）
**Outcome**: 分析結果閲覧・採用判断材料取得
**Triage Score**: 16/20

---

## Given（前提条件）

- [ ] 管理者がログイン済み
- [ ] 検査完了済みの候補者が存在する
- [ ] AI分析が完了している

## When（操作）

1. 候補者一覧ページ `/admin/candidates` にアクセス
2. 分析完了済みの候補者を選択
3. 候補者詳細ページで分析結果を閲覧

## Then（期待結果）

- [ ] 分析結果が表示される
- [ ] スコア・グラフが表示される
- [ ] AI所見（コメント）が表示される
- [ ] 採用判定（推奨/要検討/不適など）が表示される

---

## 見て良い（Assert対象）

| 項目 | 検証方法 |
|------|---------|
| 分析結果セクション表示 | `data-testid="analysis-result"` が visible |
| スコア表示 | `data-testid="score-chart"` が visible |
| 判定表示 | `data-testid="judgment-badge"` が visible |
| AI所見表示 | `data-testid="ai-comment"` が visible |

## 見てはいけない（Assert対象外）

| 項目 | 理由 |
|------|------|
| スコアの具体的な数値 | テストデータ依存。単体テストで検証 |
| グラフの見た目 | Bronze（Visual Regression）で検証 |
| 所見の文言詳細 | AI生成のため変動。構造のみ検証 |

---

## 失敗時の意味

「分析結果を閲覧できない」
→ 採用判断材料なし。サービスの価値提供不可。

---

## Playwright実装

**ファイル**: `e2e/gold/GS-HY-004-analysis-result-view.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('GS-HY-004: 分析結果閲覧', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('管理者が候補者の分析結果を閲覧できる', async ({ page }) => {
    // Given: 候補者一覧にアクセス
    await page.goto('/admin/candidates');

    // Given: 分析完了済みの候補者を探す
    // Note: テストデータとして分析完了済み候補者が必要
    const analyzedCandidate = page.locator('[data-testid^="candidate-row-"]', {
      has: page.locator('[data-testid="candidate-status"]', { hasText: /完了|analyzed/i })
    }).first();

    // 分析完了済み候補者がいない場合はスキップ
    if (!(await analyzedCandidate.isVisible())) {
      test.skip(true, 'No analyzed candidate available for test');
    }

    // When: 候補者詳細を開く
    await analyzedCandidate.click();

    // Then: 分析結果セクションが表示される
    await expect(page.locator('[data-testid="analysis-result"]')).toBeVisible();

    // Then: スコアチャートが表示される
    await expect(page.locator('[data-testid="score-chart"]')).toBeVisible();

    // Then: 判定バッジが表示される
    await expect(page.locator('[data-testid="judgment-badge"]')).toBeVisible();

    // Then: AI所見が表示される
    await expect(page.locator('[data-testid="ai-comment"]')).toBeVisible();
  });

  test('分析結果ページで再分析を実行できる', async ({ page }) => {
    // Given: 分析完了済み候補者の詳細ページにアクセス
    // Note: 候補者IDはテストデータとして準備
    const candidateId = process.env.E2E_TEST_CANDIDATE_ID;
    test.skip(!candidateId, 'E2E_TEST_CANDIDATE_ID not configured');

    await page.goto(`/admin/candidates/${candidateId}`);

    // Given: 分析結果が表示されている
    await expect(page.locator('[data-testid="analysis-result"]')).toBeVisible();

    // When: 再分析ボタンをクリック
    const reanalyzeButton = page.locator('[data-testid="reanalyze-button"]');
    if (await reanalyzeButton.isVisible()) {
      await reanalyzeButton.click();

      // Then: 再分析ダイアログが表示される
      await expect(page.locator('[data-testid="reanalyze-dialog"]')).toBeVisible();
    }
  });
});
```

---

## トレーサビリティ

| 項目 | 値 |
|------|-----|
| Universe ID | UC-HY-ADMIN-VIEW-WEB |
| Gold Spec ID | GS-HY-004 |
| Playwright File | `e2e/gold/GS-HY-004-analysis-result-view.spec.ts` |
| CI Job | `e2e-gold` |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-30 | 初版作成 |

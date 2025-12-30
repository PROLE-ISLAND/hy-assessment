# GS-HY-002: 候補者登録→検査リンク発行

**UC-ID**: UC-HY-ADMIN-CANDIDATE-WEB
**Role**: 管理者（ADMIN）
**Outcome**: 候補者登録完了・検査リンク発行
**Triage Score**: 15/20

---

## Given（前提条件）

- [ ] 管理者がログイン済み
- [ ] 候補者一覧ページにアクセス可能
- [ ] 新規候補者情報（名前、メール）が準備されている

## When（操作）

1. 候補者一覧ページ `/admin/candidates` にアクセス
2. 「候補者追加」ボタンをクリック
3. 候補者情報を入力
   - 名前
   - メールアドレス
   - 応募職種（任意）
4. 「登録」ボタンをクリック
5. 検査リンク発行を確認

## Then（期待結果）

- [ ] 成功メッセージが表示される
- [ ] 候補者一覧に新規候補者が追加される
- [ ] 候補者のステータスが「検査待ち」
- [ ] 検査リンクが発行される（表示またはメール送信）

---

## 見て良い（Assert対象）

| 項目 | 検証方法 |
|------|---------|
| 候補者追加成功 | Toast/Alert で成功メッセージ表示 |
| 一覧に表示 | `data-testid="candidate-row-*"` に新規候補者 |
| ステータス | Badge に「検査待ち」または同等のステータス |

## 見てはいけない（Assert対象外）

| 項目 | 理由 |
|------|------|
| フォームのバリデーションメッセージ | Bronze（単体テスト）で検証 |
| メール送信の詳細 | 統合テストで検証 |
| UI のレイアウト | Bronze（スナップショット）で検証 |

---

## 失敗時の意味

「候補者を登録できない」
→ 検査対象者を設定できない。採用プロセス開始不可。

---

## Playwright実装

**ファイル**: `e2e/gold/GS-HY-002-candidate-registration.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('GS-HY-002: 候補者登録→検査リンク発行', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('管理者が候補者を登録し検査リンクを発行できる', async ({ page }) => {
    const testCandidate = {
      name: `Test Candidate ${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
    };

    // Given: 候補者一覧ページにアクセス
    await page.goto('/admin/candidates');

    // When: 候補者を追加
    await page.click('[data-testid="add-candidate-button"]');
    await page.fill('[data-testid="candidate-name-input"]', testCandidate.name);
    await page.fill('[data-testid="candidate-email-input"]', testCandidate.email);
    await page.click('[data-testid="submit-candidate-button"]');

    // Then: 候補者が一覧に追加される
    await expect(page.locator(`text=${testCandidate.name}`)).toBeVisible();

    // Then: 検査リンクが発行される（ステータス確認）
    const candidateRow = page.locator(`[data-testid^="candidate-row-"]`, { hasText: testCandidate.name });
    await expect(candidateRow.locator('[data-testid="candidate-status"]')).toContainText(/検査待ち|pending/i);
  });
});
```

---

## トレーサビリティ

| 項目 | 値 |
|------|-----|
| Universe ID | UC-HY-ADMIN-CANDIDATE-WEB |
| Gold Spec ID | GS-HY-002 |
| Playwright File | `e2e/gold/GS-HY-002-candidate-registration.spec.ts` |
| CI Job | `e2e-gold` |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-30 | 初版作成 |

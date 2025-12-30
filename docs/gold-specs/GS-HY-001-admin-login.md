# GS-HY-001: 管理者ログイン

**UC-ID**: UC-HY-ADMIN-AUTH-WEB
**Role**: 管理者（ADMIN）
**Outcome**: 認証成功・システムアクセス
**Triage Score**: 18/20

---

## Given（前提条件）

- [ ] 有効な管理者アカウントが存在する
- [ ] アカウントはアクティブ状態
- [ ] ログインページにアクセス可能

## When（操作）

1. ログインページ `/login` にアクセス
2. メールアドレスを入力
3. パスワードを入力
4. 「ログイン」ボタンをクリック

## Then（期待結果）

- [ ] ダッシュボード `/admin` にリダイレクト
- [ ] ユーザー名が表示される
- [ ] ナビゲーションメニューが表示される
- [ ] セッションが確立される（Cookie/Token）

---

## 見て良い（Assert対象）

| 項目 | 検証方法 |
|------|---------|
| リダイレクト先URL | `page.url()` が `/admin` を含む |
| ダッシュボード表示 | `data-testid="dashboard"` が visible |
| 認証状態 | ナビゲーションにユーザー情報表示 |

## 見てはいけない（Assert対象外）

| 項目 | 理由 |
|------|------|
| ダッシュボードの具体的数値 | Bronze/Silverで検証 |
| UIの色・文言 | Bronze（スナップショット）で検証 |
| API応答時間 | 負荷テストで検証 |

---

## 失敗時の意味

「管理者がシステムにログインできない」
→ サービス利用不可。事業停止レベル。

---

## Playwright実装

**ファイル**: `e2e/gold/GS-HY-001-admin-login.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('GS-HY-001: 管理者ログイン', () => {
  test('管理者がログインしてダッシュボードにアクセスできる', async ({ page }) => {
    // Given: ログインページにアクセス
    await page.goto('/login');

    // When: 認証情報を入力してログイン
    await page.fill('[data-testid="email-input"]', process.env.E2E_TEST_EMAIL!);
    await page.fill('[data-testid="password-input"]', process.env.E2E_TEST_PASSWORD!);
    await page.click('[data-testid="login-button"]');

    // Then: ダッシュボードにリダイレクト
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });
});
```

---

## トレーサビリティ

| 項目 | 値 |
|------|-----|
| Universe ID | UC-HY-ADMIN-AUTH-WEB |
| Gold Spec ID | GS-HY-001 |
| Playwright File | `e2e/gold/GS-HY-001-admin-login.spec.ts` |
| CI Job | `e2e-gold` |

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-30 | 初版作成 |

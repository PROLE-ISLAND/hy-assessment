# トラブルシューティング

## 開発環境

### `npm install` が失敗する

**症状**: 依存関係インストール時にエラー

**原因**: Node.jsバージョンが古い

**解決策**:
```bash
# Node.jsバージョン確認
node -v  # 18以上必要

# nvmを使っている場合
nvm install 18
nvm use 18

# キャッシュクリア
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 開発サーバーが起動しない

**症状**: `npm run dev` でエラー

**原因**: 環境変数の不足

**解決策**:
```bash
# .env.local が存在するか確認
ls -la .env.local

# 必須変数の確認
grep NEXT_PUBLIC_SUPABASE_URL .env.local
```

### ビルドエラー

**症状**: `npm run build` が失敗

**原因**: 型エラー or Lintエラー

**解決策**:
```bash
# 型チェック
npx tsc --noEmit

# Lint
npm run lint

# キャッシュクリア
rm -rf .next
npm run build
```

---

## 認証

### ログインできない

**症状**: ログイン画面でエラー

**チェックリスト**:
```bash
# 1. Supabase URLの確認
echo $NEXT_PUBLIC_SUPABASE_URL

# 2. Supabase Dashboardでユーザー確認
# Authentication → Users

# 3. ネットワーク確認
curl https://kiqlyeoxccuxtofktwlm.supabase.co/rest/v1/
```

### セッションが切れる

**症状**: 操作中に突然ログアウト

**原因**: トークン期限切れ

**解決策**:
```typescript
// middleware.ts でセッション更新を確認
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // リダイレクト処理
}
```

---

## データベース

### RLSエラー

**症状**: `new row violates row-level security policy`

**原因**: organization_idの不一致

**解決策**:
```sql
-- 1. ポリシー確認
SELECT * FROM pg_policies WHERE tablename = 'candidates';

-- 2. ユーザーのorganization_id確認
SELECT organization_id FROM users WHERE id = '<user_id>';

-- 3. 挿入時にorganization_id指定
INSERT INTO candidates (organization_id, person_id, ...)
VALUES ('<correct_org_id>', ...);
```

### クエリが遅い

**症状**: ページ読み込みが遅い

**解決策**:
```sql
-- インデックス確認
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public';

-- 実行計画確認
EXPLAIN ANALYZE SELECT * FROM candidates WHERE ...;
```

---

## AI分析

### OpenAI APIエラー

**症状**: 分析実行時にエラー

**チェックリスト**:
```bash
# 1. APIキー確認（先頭10文字）
echo $OPENAI_API_KEY | head -c 10

# 2. レート制限確認
# https://platform.openai.com/usage

# 3. モデル名確認
# gpt-4, gpt-4-turbo, gpt-5.2 など
```

### 分析結果がおかしい

**症状**: 出力が不正確

**チェックリスト**:
1. プロンプトテンプレート確認（`/admin/prompts`）
2. 温度設定確認（0.3が推奨）
3. トークン使用量確認

```typescript
// 分析ログ確認
console.log('AI Response:', {
  model: response.model,
  tokens: response.usage,
  content: response.choices[0].message.content,
});
```

---

## デプロイ

### Vercelデプロイ失敗

**症状**: CIは通るがVercelで失敗

**チェックリスト**:
```bash
# 1. Vercelログ確認
vercel logs <deployment-url>

# 2. 環境変数確認
vercel env ls

# 3. ローカルで本番ビルド
npm run build
npm run start
```

### Preview環境が動かない

**症状**: PRのプレビューでエラー

**原因**: 環境変数の不足

**解決策**:
```bash
# Preview用環境変数を設定
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
```

---

## E2Eテスト

### テストがタイムアウト

**症状**: Playwrightテストが遅い/失敗

**解決策**:
```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 60000,  // タイムアウト延長
  retries: 2,      // リトライ追加
});
```

### 要素が見つからない

**症状**: `locator not found`

**解決策**:
```typescript
// 待機を追加
await page.waitForSelector('[data-testid="element"]');

// または
await expect(page.locator('[data-testid="element"]'))
  .toBeVisible({ timeout: 10000 });
```

---

## パフォーマンス

### ページが重い

**チェックリスト**:
1. Network タブで大きなリクエスト確認
2. React DevTools で再レンダリング確認
3. Next.js Bundle Analyzer 実行

```bash
# バンドル分析
ANALYZE=true npm run build
```

### メモリリーク

**症状**: 長時間使用でブラウザが重くなる

**チェックリスト**:
```typescript
// useEffect のクリーンアップ確認
useEffect(() => {
  const interval = setInterval(...);
  return () => clearInterval(interval);  // クリーンアップ
}, []);
```

---

## よくあるエラーコード

| コード | 意味 | 対処 |
|-------|------|------|
| `401 Unauthorized` | 認証失敗 | 再ログイン |
| `403 Forbidden` | 権限不足 | 役割確認 |
| `404 Not Found` | リソースなし | IDを確認 |
| `422 Unprocessable` | バリデーションエラー | 入力値確認 |
| `429 Too Many Requests` | レート制限 | 時間を置く |
| `500 Internal Server` | サーバーエラー | ログ確認 |

---

## ログの確認方法

### ブラウザ

```
F12 → Console
F12 → Network
```

### サーバー（Vercel）

```bash
vercel logs <deployment-url> --follow
```

### Sentry

```
https://sentry.io/organizations/{org}/issues/
```

### Supabase

```
Dashboard → Logs → API/Auth/Database
```

---

## サポート

解決しない場合:

1. **Slack**: #hy-assessment で質問
2. **Issue作成**: バグの場合はGitHub Issue
3. **ペアプログラミング**: チームメンバーと画面共有

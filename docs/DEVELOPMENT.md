# 開発ガイド

## クイックスタート

### 前提条件

- Node.js 18+
- npm 9+
- Git
- Supabase CLI（任意）

### セットアップ

```bash
# 1. リポジトリクローン
git clone https://github.com/PROLE-ISLAND/hy-assessment.git
cd hy-assessment

# 2. 依存関係インストール
npm install

# 3. 環境変数設定
cp .env.example .env.local
# .env.local を編集（下記参照）

# 4. 開発サーバー起動
npm run dev

# 5. ブラウザで確認
open http://localhost:3000
```

### 環境変数

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://kiqlyeoxccuxtofktwlm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_DEFAULT_MODEL=gpt-4

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend) - 開発時は省略可
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@example.com

# Sentry - 開発時は省略可
NEXT_PUBLIC_SENTRY_DSN=https://...
```

## 開発コマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# 本番起動
npm run start

# Lint
npm run lint
npm run lint:fix

# 型チェック
npx tsc --noEmit

# テスト
npm run test           # Watch mode
npm run test:run       # 単発実行
npm run test:coverage  # カバレッジ

# E2E
npm run test:e2e       # ヘッドレス
npm run test:e2e:ui    # UI付き
```

## コーディング規約

### TypeScript

```typescript
// ✅ 推奨
interface Props {
  id: string;
  name: string;
  onSubmit: (data: FormData) => Promise<void>;
}

export function Component({ id, name, onSubmit }: Props) {
  // ...
}

// ❌ 非推奨
export function Component(props: any) {
  // ...
}
```

### コンポーネント

```typescript
// Server Component（デフォルト）
// src/app/admin/page.tsx
export default async function AdminPage() {
  const data = await fetchData(); // サーバーサイドで実行
  return <Dashboard data={data} />;
}

// Client Component（必要な場合のみ）
// src/components/dashboard/InteractiveChart.tsx
'use client';

import { useState } from 'react';

export function InteractiveChart() {
  const [selected, setSelected] = useState(null);
  // ...
}
```

### ファイル命名

```
src/
├── app/
│   └── admin/
│       ├── page.tsx           # ページコンポーネント
│       ├── layout.tsx         # レイアウト
│       ├── loading.tsx        # ローディングUI
│       └── error.tsx          # エラーUI
├── components/
│   ├── ui/                    # 汎用UI（shadcn）
│   │   └── button.tsx
│   └── dashboard/             # 機能別
│       └── StatsCard.tsx      # PascalCase
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # camelCase
│   │   └── server.ts
│   └── utils.ts
└── types/
    └── database.ts            # 型定義
```

### インポート順序

```typescript
// 1. React/Next.js
import { useState } from 'react';
import Link from 'next/link';

// 2. 外部ライブラリ
import { z } from 'zod';
import { format } from 'date-fns';

// 3. 内部モジュール（絶対パス）
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

// 4. 型
import type { Candidate } from '@/types/database';

// 5. 相対パス（最後）
import { helper } from './utils';
```

## Git ワークフロー

### ブランチ命名

```
feature/issue-123-add-pdf-export
bugfix/issue-456-fix-login-error
hotfix/issue-789-critical-fix
chore/update-dependencies
docs/add-api-documentation
ci/improve-pipeline
```

### コミットメッセージ

```bash
# Conventional Commits
feat: add PDF export feature
fix: resolve login redirect issue
docs: update API documentation
chore: update dependencies
refactor: simplify scoring engine
test: add e2e tests for assessment flow
```

### PR作成

```bash
# ブランチ作成
git checkout -b feature/issue-123-description

# 変更をコミット
git add .
git commit -m "feat: add new feature"

# プッシュ
git push -u origin feature/issue-123-description

# PR作成（日本語テンプレート使用）
gh pr create --title "機能追加: 説明" --body "..."

# マージ（adminフラグ必要）
gh pr merge {番号} --squash --delete-branch --admin
```

## テスト

### ユニットテスト（Vitest）

```typescript
// src/lib/analysis/__tests__/scoring-engine.test.ts
import { describe, it, expect } from 'vitest';
import { calculateScores } from '../scoring-engine';

describe('calculateScores', () => {
  it('should calculate GOV score correctly', () => {
    const responses = [
      { question_id: 'q1', answer: 4 },
      { question_id: 'q2', answer: 5 },
    ];

    const result = calculateScores(responses);

    expect(result.GOV).toBeGreaterThan(0);
    expect(result.GOV).toBeLessThanOrEqual(100);
  });
});
```

### E2Eテスト（Playwright）

```typescript
// e2e/01-auth.spec.ts
import { test, expect } from './fixtures';

test.describe('認証フロー', () => {
  test('ログインできる', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/admin');
  });
});
```

### data-testid 規則

```html
<!-- ボタン -->
<button data-testid="add-candidate-button">追加</button>

<!-- 入力 -->
<input data-testid="candidate-name-input" />

<!-- 動的要素 -->
<tr data-testid="candidate-row-{id}">...</tr>

<!-- リンク -->
<a data-testid="candidate-detail-{id}">詳細</a>
```

## デバッグ

### ログ出力

```typescript
// 開発時のみ表示
if (process.env.NODE_ENV === 'development') {
  console.log('[DEBUG]', data);
}

// 構造化ログ
import { logger } from '@/lib/logging';
logger.info('Assessment completed', {
  assessmentId,
  candidateId,
  duration: Date.now() - startTime,
});
```

### Supabaseデバッグ

```typescript
// クエリのデバッグ
const { data, error } = await supabase
  .from('candidates')
  .select('*')
  .eq('organization_id', orgId);

if (error) {
  console.error('Supabase error:', error);
  throw error;
}
```

### OpenAIデバッグ

```typescript
// トークン使用量の確認
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [...],
});

console.log('Tokens used:', {
  prompt: response.usage?.prompt_tokens,
  completion: response.usage?.completion_tokens,
  total: response.usage?.total_tokens,
});
```

## トラブルシューティング

### よくある問題

#### `npm install` が失敗する

```bash
# Node.jsバージョン確認
node -v  # 18以上必要

# キャッシュクリア
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Supabase接続エラー

```bash
# 環境変数確認
echo $NEXT_PUBLIC_SUPABASE_URL

# 接続テスト
curl https://kiqlyeoxccuxtofktwlm.supabase.co/rest/v1/ \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
```

#### OpenAI APIエラー

```bash
# APIキー確認
echo $OPENAI_API_KEY | head -c 10

# レート制限確認
# https://platform.openai.com/usage
```

#### ビルドエラー

```bash
# 型チェック
npx tsc --noEmit

# Lintエラー確認
npm run lint

# キャッシュクリア
rm -rf .next
npm run build
```

## パフォーマンス

### 開発時の注意

```typescript
// ❌ 遅い：毎回全件取得
const allCandidates = await supabase
  .from('candidates')
  .select('*');

// ✅ 速い：ページネーション
const { data, count } = await supabase
  .from('candidates')
  .select('*', { count: 'exact' })
  .range(0, 19);
```

### React最適化

```typescript
// ❌ 不要な再レンダリング
export function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <ExpensiveChild data={data} /> {/* 毎回再レンダリング */}
    </>
  );
}

// ✅ メモ化
const MemoizedChild = memo(ExpensiveChild);
export function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <MemoizedChild data={data} />
    </>
  );
}
```

## IDE設定

### VSCode推奨拡張

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma"
  ]
}
```

### VSCode設定

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

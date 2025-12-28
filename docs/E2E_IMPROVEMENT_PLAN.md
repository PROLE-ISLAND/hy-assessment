# HY-Assessment E2E改善計画 - 詳細要件定義

**作成日**: 2024-12-24
**ステータス**: 計画中
**目標**: E2Eテスト成功率を13.3%から90%以上に向上

---

## 改善項目一覧

| # | 項目 | 優先度 | 影響範囲 | 工数 |
|---|------|--------|----------|------|
| 1 | テスト用認証システム構築 | P0 | 全テスト | 2h |
| 2 | セレクタ改善（data-testid） | P0 | UI全体 | 4h |
| 3 | 認証フィクスチャ改善 | P1 | テスト基盤 | 2h |
| 4 | タイムアウト・リトライ設定 | P1 | テスト設定 | 1h |
| 5 | ログインフォームUI改善 | P1 | 認証画面 | 1h |
| 6 | 主要ボタンへのdata-testid追加 | P2 | 管理画面 | 3h |
| 7 | GitHub Actions設定 | P2 | CI/CD | 2h |
| 8 | アクセシビリティ改善 | P3 | UI全体 | 4h |

---

## 改善項目1: テスト用認証システム構築

### 1.1 概要
E2Eテスト専用のユーザーアカウントを作成し、テスト実行時に使用する。

### 1.2 要件

#### 機能要件
- [ ] テスト専用ユーザーの作成
- [ ] 環境変数による認証情報管理
- [ ] ローカル・CI両対応

#### 非機能要件
- セキュリティ: テスト認証情報は`.env.local`と`secrets`で管理
- 分離: 本番データに影響を与えない

### 1.3 実装詳細

#### Step 1: Supabase CLIでテストユーザー作成
```bash
# テストユーザー作成スクリプト
npx supabase functions new create-test-user
```

**scripts/create-e2e-user.ts**:
```typescript
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createE2EUser() {
  const email = 'e2e-test@hy-assessment.local';
  const password = 'E2ETestSecure123!';

  // 1. Auth ユーザー作成
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already exists')) {
      console.log('E2E user already exists');
      return;
    }
    throw authError;
  }

  console.log('Created auth user:', authData.user?.id);

  // 2. 組織を取得（最初の組織を使用）
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .limit(1);

  if (!orgs?.length) {
    throw new Error('No organization found');
  }

  const organizationId = orgs[0].id;

  // 3. users テーブルに追加
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user!.id,
      organization_id: organizationId,
      email,
      name: 'E2E Test User',
      role: 'admin',
    });

  if (userError) {
    console.error('Failed to create user record:', userError);
    throw userError;
  }

  console.log('E2E test user created successfully');
  console.log('Email:', email);
  console.log('Password:', password);
}

createE2EUser().catch(console.error);
```

#### Step 2: 環境変数設定

**.env.local に追加**:
```
# E2E Test Credentials
E2E_TEST_EMAIL=e2e-test@hy-assessment.local
E2E_TEST_PASSWORD=E2ETestSecure123!
```

**.env.example に追加（パスワードなし）**:
```
# E2E Test Credentials (for CI, set via secrets)
E2E_TEST_EMAIL=
E2E_TEST_PASSWORD=
```

#### Step 3: package.json にスクリプト追加
```json
{
  "scripts": {
    "e2e:setup": "tsx scripts/create-e2e-user.ts",
    "test:e2e": "playwright test",
    "test:e2e:setup": "npm run e2e:setup && npm run test:e2e"
  }
}
```

### 1.4 受け入れ条件
- [ ] `npm run e2e:setup` でテストユーザーが作成される
- [ ] テストユーザーでログインできる
- [ ] 環境変数が正しく読み込まれる

---

## 改善項目2: セレクタ改善（data-testid追加）

### 2.1 概要
テストの安定性と保守性を向上させるため、主要なUI要素に`data-testid`属性を追加する。

### 2.2 対象コンポーネント一覧

#### ログイン関連
| ファイル | 要素 | data-testid |
|----------|------|-------------|
| src/app/login/page.tsx | メールInput | `login-email` |
| src/app/login/page.tsx | パスワードInput | `login-password` |
| src/app/login/page.tsx | ログインButton | `login-submit` |

#### 候補者管理
| ファイル | 要素 | data-testid |
|----------|------|-------------|
| CandidateListClient.tsx | 追加ボタン | `add-candidate-button` |
| CandidateListClient.tsx | 全選択ボタン | `select-all-button` |
| CandidateListClient.tsx | 比較ボタン | `compare-button` |
| CandidateListClient.tsx | 詳細ボタン | `candidate-detail-{id}` |
| CandidateListClient.tsx | 分析ボタン | `candidate-analysis-{id}` |
| CandidateForm.tsx | 名前Input | `candidate-name` |
| CandidateForm.tsx | メールInput | `candidate-email` |
| CandidateForm.tsx | 登録ボタン | `candidate-submit` |
| CandidateForm.tsx | キャンセルボタン | `candidate-cancel` |

#### 分析結果
| ファイル | 要素 | data-testid |
|----------|------|-------------|
| AnalysisResultsClient.tsx | PDFボタン | `pdf-download-button` |
| AnalysisResultsClient.tsx | 再分析ボタン | `reanalyze-button` |
| AnalysisResultsClient.tsx | 分析タブ | `analysis-tab` |
| AnalysisResultsClient.tsx | 履歴タブ | `history-tab` |
| ReanalyzeDialog.tsx | デフォルト使用チェック | `use-defaults-checkbox` |
| ReanalyzeDialog.tsx | モデル選択 | `model-select` |
| ReanalyzeDialog.tsx | 実行ボタン | `reanalyze-confirm` |
| ReanalyzeDialog.tsx | キャンセルボタン | `reanalyze-cancel` |
| ShareReportSection.tsx | 共有ボタン | `share-report-button` |
| ShareReportSection.tsx | コピーボタン | `copy-share-url` |

#### プロンプト管理
| ファイル | 要素 | data-testid |
|----------|------|-------------|
| /admin/prompts/page.tsx | 新規作成ボタン | `create-prompt-button` |
| /admin/prompts/page.tsx | 詳細ボタン | `prompt-detail-{id}` |
| /admin/prompts/page.tsx | 複製ボタン | `prompt-copy-{id}` |
| PromptActions.tsx | 有効/無効 | `prompt-toggle-{id}` |
| PromptActions.tsx | 削除 | `prompt-delete-{id}` |

#### テンプレート管理
| ファイル | 要素 | data-testid |
|----------|------|-------------|
| TemplateStatusToggle.tsx | トグル | `template-toggle` |
| CreateVersionButton.tsx | 作成ボタン | `create-version-button` |
| CreateVersionButton.tsx | バージョン入力 | `version-input` |
| CreateVersionButton.tsx | 確認ボタン | `version-confirm` |

#### ナビゲーション
| ファイル | 要素 | data-testid |
|----------|------|-------------|
| Sidebar.tsx | サイドバー | `sidebar` |
| Sidebar.tsx | ダッシュボード | `nav-dashboard` |
| Sidebar.tsx | 候補者 | `nav-candidates` |
| Sidebar.tsx | 比較 | `nav-compare` |
| Sidebar.tsx | レポート | `nav-reports` |
| Sidebar.tsx | テンプレート | `nav-templates` |
| Sidebar.tsx | プロンプト | `nav-prompts` |
| Header.tsx | ユーザーメニュー | `user-menu` |

### 2.3 実装例

**src/app/login/page.tsx**:
```tsx
<CardContent className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="email">メールアドレス</Label>
    <Input
      id="email"
      type="email"
      data-testid="login-email"
      placeholder="admin@example.com"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
    />
  </div>
  <div className="space-y-2">
    <Label htmlFor="password">パスワード</Label>
    <Input
      id="password"
      type="password"
      data-testid="login-password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
    />
  </div>
  <Button
    type="submit"
    className="w-full"
    data-testid="login-submit"
    disabled={loading}
  >
    {loading ? <Loader2 className="animate-spin" /> : 'ログイン'}
  </Button>
</CardContent>
```

### 2.4 受け入れ条件
- [ ] 上記すべての要素にdata-testidが追加されている
- [ ] テストで`page.getByTestId('xxx')`が使用できる
- [ ] 既存機能に影響がない

---

## 改善項目3: 認証フィクスチャ改善

### 3.1 概要
テスト間で認証状態を効率的に共有し、テスト実行時間を短縮する。

### 3.2 実装

**e2e/fixtures.ts（改善版）**:
```typescript
import { test as base, expect, type Page } from '@playwright/test';

// 認証状態を保存するファイル
const AUTH_FILE = 'e2e/.auth/user.json';

export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ browser }, use) => {
    // 保存された認証状態を使用してコンテキスト作成を試みる
    let context;
    try {
      context = await browser.newContext({ storageState: AUTH_FILE });
    } catch {
      // 認証状態がない場合は新規ログイン
      context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('/login');
      await page.fill('[data-testid="login-email"]', process.env.E2E_TEST_EMAIL!);
      await page.fill('[data-testid="login-password"]', process.env.E2E_TEST_PASSWORD!);
      await page.click('[data-testid="login-submit"]');
      await page.waitForURL('/admin**', { timeout: 30000 });

      // 認証状態を保存
      await context.storageState({ path: AUTH_FILE });
      await page.close();
    }

    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
```

**playwright.config.ts（更新）**:
```typescript
import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'e2e-results/results.json' }],
  ],
  timeout: 60000,

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    // 認証セットアップ（最初に実行）
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },
    // メインテスト
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 3.3 受け入れ条件
- [ ] 認証状態がファイルに保存される
- [ ] 2回目以降のテストで再ログイン不要
- [ ] テスト間で認証状態が共有される

---

## 改善項目4: タイムアウト・リトライ設定

### 4.1 設定変更

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 60000,      // グローバルタイムアウト: 60秒
  retries: process.env.CI ? 2 : 1, // リトライ回数

  expect: {
    timeout: 10000,    // アサーションタイムアウト: 10秒
  },

  use: {
    actionTimeout: 15000,     // アクションタイムアウト: 15秒
    navigationTimeout: 30000, // ナビゲーションタイムアウト: 30秒
  },
});
```

### 4.2 受け入れ条件
- [ ] タイムアウトエラーが減少する
- [ ] 不安定なテストがリトライで成功する

---

## 改善項目5: ログインフォームUI改善

### 5.1 変更内容

**src/app/login/page.tsx**:
```tsx
// 変更前
<Card>
  <CardHeader>
    <CardTitle className="text-2xl font-bold text-center">
      管理者ログイン
    </CardTitle>
    <CardDescription className="text-center">
      管理者アカウントでログインしてください
    </CardDescription>
  </CardHeader>
  ...
</Card>

// 変更後
<Card data-testid="login-card">
  <CardHeader>
    <CardTitle
      className="text-2xl font-bold text-center"
      data-testid="login-title"
    >
      管理者ログイン
    </CardTitle>
    <CardDescription
      className="text-center"
      data-testid="login-description"
    >
      管理者アカウントでログインしてください
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="email">メールアドレス</Label>
      <Input
        id="email"
        type="email"
        data-testid="login-email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        aria-label="メールアドレス"
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="password">パスワード</Label>
      <Input
        id="password"
        type="password"
        data-testid="login-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        aria-label="パスワード"
      />
    </div>
    {error && (
      <Alert variant="destructive" data-testid="login-error">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}
    <Button
      type="submit"
      className="w-full"
      data-testid="login-submit"
      disabled={loading}
      aria-label="ログイン"
    >
      {loading ? <Loader2 className="animate-spin" /> : 'ログイン'}
    </Button>
  </CardContent>
</Card>
```

### 5.2 受け入れ条件
- [ ] data-testidが追加されている
- [ ] aria-labelが追加されている
- [ ] 既存のスタイルが維持されている

---

## 改善項目6: 主要ボタンへのdata-testid追加

### 6.1 実装ファイル一覧

| ファイルパス | 変更内容 |
|-------------|---------|
| src/components/candidates/CandidateListClient.tsx | 5箇所 |
| src/components/candidates/CandidateForm.tsx | 4箇所 |
| src/components/candidates/IssueAssessmentButton.tsx | 1箇所 |
| src/components/analysis/AnalysisResultsClient.tsx | 4箇所 |
| src/components/analysis/ReanalyzeDialog.tsx | 4箇所 |
| src/components/analysis/ShareReportSection.tsx | 3箇所 |
| src/app/admin/prompts/page.tsx | 3箇所 |
| src/components/prompts/PromptActions.tsx | 2箇所 |
| src/components/templates/TemplateStatusToggle.tsx | 1箇所 |
| src/components/templates/CreateVersionButton.tsx | 3箇所 |
| src/components/layout/Sidebar.tsx | 7箇所 |
| src/components/layout/Header.tsx | 1箇所 |

### 6.2 受け入れ条件
- [ ] すべての対象要素にdata-testidが追加されている
- [ ] テストからアクセス可能
- [ ] 既存機能に影響がない

---

## 改善項目7: GitHub Actions設定

### 7.1 ワークフローファイル

**.github/workflows/e2e.yml**:
```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e:
    name: Run E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
          E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload screenshots
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-screenshots
          path: e2e-results/
          retention-days: 7
```

### 7.2 必要なSecrets設定
- `E2E_TEST_EMAIL`: テストユーザーのメールアドレス
- `E2E_TEST_PASSWORD`: テストユーザーのパスワード
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key

### 7.3 受け入れ条件
- [ ] PR作成時にE2Eテストが実行される
- [ ] テスト結果がArtifactとして保存される
- [ ] 失敗時にスクリーンショットが保存される

---

## 改善項目8: アクセシビリティ改善

### 8.1 対象要素

| 要素 | 追加する属性 |
|------|-------------|
| フォーム入力 | `aria-label`, `aria-describedby` |
| ボタン | `aria-label` (アイコンのみの場合) |
| ダイアログ | `aria-labelledby`, `aria-describedby` |
| タブ | `aria-selected`, `aria-controls` |
| トグル | `aria-checked`, `aria-label` |
| アラート | `role="alert"`, `aria-live="polite"` |

### 8.2 受け入れ条件
- [ ] スクリーンリーダーで読み上げ可能
- [ ] キーボード操作が可能
- [ ] Lighthouse アクセシビリティスコア90以上

---

## 実装スケジュール

### Week 1（即座対応）
- [ ] Day 1: 改善項目1（テスト用認証システム）
- [ ] Day 2-3: 改善項目2（ログイン/候補者のdata-testid）
- [ ] Day 4: 改善項目3（認証フィクスチャ）
- [ ] Day 5: テスト再実行・検証

### Week 2（高優先度）
- [ ] Day 1-2: 改善項目2の続き（分析/プロンプト/テンプレート）
- [ ] Day 3: 改善項目4（タイムアウト設定）
- [ ] Day 4: 改善項目5（ログインフォーム改善）
- [ ] Day 5: テスト再実行・検証

### Week 3（中優先度）
- [ ] Day 1-2: 改善項目6（残りのdata-testid）
- [ ] Day 3-4: 改善項目7（GitHub Actions）
- [ ] Day 5: 最終テスト・ドキュメント更新

### Week 4以降（継続改善）
- 改善項目8（アクセシビリティ）
- テストカバレッジ向上
- パフォーマンステスト追加

---

## 成功指標

| 指標 | 現状 | 目標 |
|------|------|------|
| テスト成功率 | 13.3% | 90%以上 |
| 認証関連テスト成功率 | 28.6% | 100% |
| 候補者管理テスト成功率 | 0% | 95%以上 |
| 分析結果テスト成功率 | 0% | 95%以上 |
| CI実行時間 | - | 10分以内 |

---

*計画作成: 2024-12-24*

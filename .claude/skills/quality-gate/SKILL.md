---
name: quality-gate
description: AIミス防止 + DoD準拠の統合品質ゲート。実行検証・Import確認・エラーパス・バリアント完全性を検証
context: fork
arguments:
  - name: level
    description: DoD Level（Bronze/Silver/Gold）
    required: true
  - name: target
    description: 検証対象（PR番号/ブランチ/ファイルパス）
    required: false
    default: "HEAD"
  - name: fix
    description: 自動修正を試みる（true/false）
    required: false
    default: "false"
  - name: strict
    description: 警告もブロック扱い（true/false）
    required: false
    default: "false"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash(npm:*)
  - Bash(npx:*)
  - Bash(pnpm:*)
  - Bash(tsc:*)
  - Bash(git:*)
  - Bash(gh:*)
  - mcp__gpt5-devops__code_review
  - mcp__gpt5-devops__guard
  - Task
  - TodoWrite
skills:
  - variant-check
  - code-review
  - security
---

# /quality-gate - 統合品質ゲートスキル

AIミス防止 + DoD準拠を統合検証する品質ゲート。

## 設計思想

**AIがやりがちなミスを防ぐ:**
- 書いたコードを実行しない → 実行検証
- 存在しないモジュールをimport → Import検証
- Happy pathだけ実装 → エラーパス検証
- Defaultだけ作る → バリアント検証
- 単体で動くが繋がらない → 統合検証

## DoD Level別 検証項目

### Bronze（基本品質）

| チェック | 内容 | ブロック |
|---------|------|---------|
| **compile** | `tsc --noEmit` 成功 | Yes |
| **lint** | ESLint エラーなし | Yes |
| **format** | Prettier 適用済み | Warning |
| **test-unit** | カバレッジ 80%+ | Yes |
| **basic-run** | 基本実行確認 | Yes |

### Silver（+AIミス防止）

| チェック | 内容 | ブロック |
|---------|------|---------|
| Bronze全項目 | - | - |
| **import-check** | 全Import解決確認 | Yes |
| **error-handling** | エラーパス実装確認 | Yes |
| **variant-check** | UIバリアント完全性 | Yes (UI変更時) |
| **test-integration** | カバレッジ 85%+ | Yes |
| **type-safety** | any/unknown 最小化 | Warning |

### Gold（+非機能・セキュリティ）

| チェック | 内容 | ブロック |
|---------|------|---------|
| Silver全項目 | - | - |
| **test-e2e** | E2Eテスト存在・成功 | Yes |
| **coverage** | 全体 95%+ | Yes |
| **usecase-coverage** | 全UC にテスト | Yes |
| **performance** | LCP < 2.5s, API p95 < 500ms | Yes |
| **security** | OWASP Top 10 チェック | Yes |
| **a11y** | アクセシビリティ検証 | Warning |

## 実行フロー

```
/quality-gate level=Silver target=#123
  ↓
1. 変更ファイル取得
   git diff --name-only origin/main...HEAD
  ↓
2. Bronze チェック（必須）
   ├─ tsc --noEmit
   ├─ npm run lint
   └─ npm run test:unit --coverage
  ↓
3. Silver チェック（level >= Silver）
   ├─ Import解決検証（スクリプト）
   ├─ エラーパス検証（静的解析）
   ├─ バリアント検証（UI変更時）
   └─ npm run test:integration
  ↓
4. Gold チェック（level == Gold）
   ├─ npm run test:e2e
   ├─ Lighthouse パフォーマンス
   └─ セキュリティスキャン
  ↓
5. レポート生成
   ├─ 合格/不合格判定
   ├─ 不足項目リスト
   └─ 修正提案（fix=true時は自動修正）
```

## 検証スクリプト

### Import解決検証

```typescript
// scripts/verify-imports.ts
import { Project } from 'ts-morph';

export async function verifyImports(files: string[]) {
  const project = new Project({ tsConfigFilePath: './tsconfig.json' });
  const errors: string[] = [];

  for (const file of files) {
    const sourceFile = project.getSourceFile(file);
    if (!sourceFile) continue;

    const imports = sourceFile.getImportDeclarations();
    for (const imp of imports) {
      const moduleSpecifier = imp.getModuleSpecifierValue();

      // 相対パスの解決確認
      if (moduleSpecifier.startsWith('.')) {
        const resolved = imp.getModuleSpecifierSourceFile();
        if (!resolved) {
          errors.push(`${file}: Cannot resolve '${moduleSpecifier}'`);
        }
      }
    }
  }

  return { passed: errors.length === 0, errors };
}
```

### エラーパス検証

```typescript
// scripts/check-error-paths.ts
export async function checkErrorPaths(files: string[]) {
  const issues: string[] = [];

  for (const file of files) {
    const content = await Deno.readTextFile(file);

    // fetch/axios without error handling
    const fetchMatches = content.match(/await\s+fetch\([^)]+\)(?!\.catch)/g);
    if (fetchMatches) {
      issues.push(`${file}: fetch() without error handling`);
    }

    // async function without try-catch
    const asyncFnMatches = content.match(/async\s+function\s+\w+[^{]+\{(?![^}]*try)/g);
    if (asyncFnMatches) {
      issues.push(`${file}: async function without try-catch`);
    }
  }

  return { passed: issues.length === 0, issues };
}
```

### バリアント検証

```typescript
// scripts/check-variants.ts
const REQUIRED_VARIANTS = ['Default', 'Loading', 'Empty', 'Error'];

export async function checkVariants(componentFiles: string[]) {
  const missing: Record<string, string[]> = {};

  for (const file of componentFiles) {
    const content = await Deno.readTextFile(file);
    const foundVariants = REQUIRED_VARIANTS.filter(v =>
      content.includes(`isLoading`) ||
      content.includes(`isEmpty`) ||
      content.includes(`error`) ||
      content.includes(`Skeleton`)
    );

    const missingVariants = REQUIRED_VARIANTS.filter(v =>
      !foundVariants.includes(v)
    );

    if (missingVariants.length > 0) {
      missing[file] = missingVariants;
    }
  }

  return { passed: Object.keys(missing).length === 0, missing };
}
```

## 出力レポート

```markdown
## 🚦 Quality Gate Report

### Summary
- **DoD Level**: Silver
- **Target**: PR #123
- **Result**: ❌ BLOCKED

### Bronze Checks
| Check | Status | Details |
|-------|--------|---------|
| compile | ✅ Pass | No errors |
| lint | ✅ Pass | 0 errors, 2 warnings |
| test-unit | ✅ Pass | 87% coverage (>80%) |
| basic-run | ✅ Pass | Build successful |

### Silver Checks
| Check | Status | Details |
|-------|--------|---------|
| import-check | ✅ Pass | All imports resolved |
| error-handling | ❌ Fail | 2 unhandled async calls |
| variant-check | ⚠️ Warning | Missing: Empty, Error |
| test-integration | ✅ Pass | 86% coverage (>85%) |
| type-safety | ✅ Pass | 0 `any` usage |

### Blocking Issues

1. **error-handling** (Silver required)
   - `src/lib/api/users.ts:34` - fetch without catch
   - `src/lib/api/orders.ts:56` - async without try-catch

2. **variant-check** (Silver required for UI)
   - `src/components/UserList.tsx` - Missing: Empty, Error

### Recommended Fixes

```typescript
// src/lib/api/users.ts:34
- const data = await fetch('/api/users').then(r => r.json());
+ const data = await fetch('/api/users')
+   .then(r => {
+     if (!r.ok) throw new Error(`HTTP ${r.status}`);
+     return r.json();
+   })
+   .catch(e => {
+     console.error('Failed to fetch users:', e);
+     throw e;
+   });
```

### Next Steps
- [ ] Fix error handling in 2 files
- [ ] Add Empty/Error variants to UserList
- [ ] Re-run: `/quality-gate level=Silver`
```

## 使用例

```bash
# Bronze検証
/quality-gate level=Bronze

# Silver検証（PR対象）
/quality-gate level=Silver target=#123

# Gold検証 + 自動修正
/quality-gate level=Gold fix=true

# 厳格モード（警告もブロック）
/quality-gate level=Silver strict=true
```

## CI統合

```yaml
# .github/workflows/quality-gate.yml
name: Quality Gate

on:
  pull_request:
    branches: [main]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Determine DoD Level
        id: dod
        run: |
          if [[ "${{ github.head_ref }}" == *"-gold" ]]; then
            echo "level=Gold" >> $GITHUB_OUTPUT
          elif [[ "${{ contains(github.event.pull_request.labels.*.name, 'dod:silver') }}" == "true" ]]; then
            echo "level=Silver" >> $GITHUB_OUTPUT
          else
            echo "level=Bronze" >> $GITHUB_OUTPUT
          fi

      - name: Run Quality Gate
        run: |
          # Bronze checks
          npm run lint
          npm run typecheck
          npm run test:unit -- --coverage

          # Silver checks (if applicable)
          if [[ "${{ steps.dod.outputs.level }}" != "Bronze" ]]; then
            npm run test:integration
            npx ts-node scripts/verify-imports.ts
            npx ts-node scripts/check-error-paths.ts
          fi

          # Gold checks (if applicable)
          if [[ "${{ steps.dod.outputs.level }}" == "Gold" ]]; then
            npm run test:e2e
            npx lighthouse-ci
          fi
```

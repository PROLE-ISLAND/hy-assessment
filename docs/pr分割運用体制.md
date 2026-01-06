# PR分割運用体制 - Stacked PR & ラベル駆動CI

> **ステータス**: 運用中
> **作成日**: 2026-01-06
> **関連**: GitHub Actions、CI/CD、コードレビュー

## 概要

大規模機能を安全にマージするための PR 分割戦略と、ラベルによる CI 制御の運用ガイド。

## PR依存関係の管理

### GitHub の現状

GitHub には PR 間の依存関係を強制する公式機能がない。以下の運用で代替する。

### 依存表現方法

#### 1. PR本文に明示

```markdown
## Dependencies（依存PR）
- Depends on #123 (DBスキーマ変更)
- Blocked by #124 (API変更)
```

#### 2. Draft PR で待機

- 依存 PR がマージされるまで Draft 状態を維持
- 依存解決後に Ready for Review に変更

#### 3. Stacked PR（ブランチ階層化）

```
main
 └── feature/issue-100-db-schema      # 1st PR（先にマージ）
      └── feature/issue-101-api       # 2nd PR（DBマージ後にリベース）
           └── feature/issue-102-ui   # 3rd PR（APIマージ後にリベース）
```

### マージ順序

| 順序 | ドメイン | 理由 |
|------|----------|------|
| 1 | DB（スキーマ変更） | 他すべての基盤 |
| 2 | API（バックエンド） | DB に依存、UI が依存 |
| 3 | UI（フロントエンド） | API に依存 |
| 4 | E2E（テスト） | 全機能完成後 |

### リベース手順

依存元 PR がマージされた後:

```bash
# 1. main を最新化
git checkout main && git pull

# 2. 依存先ブランチをリベース
git checkout feature/issue-101-api
git rebase main

# 3. コンフリクト解消後
git push --force-with-lease
```

## ラベル駆動 CI

### ラベル体系

#### CI 制御ラベル

| ラベル | 動作 | ユースケース |
|--------|------|-------------|
| `ci:skip` | CI スキップ | ドキュメントのみの変更 |
| `ci:fast` | lint + 型チェックのみ | Draft PR、依存待ち |
| `ci:full` | フル CI | 通常の実装 PR |
| `ci:e2e` | フル CI + E2E | 最終統合テスト |

#### type ラベル（自動付与）

| ラベル | ブランチパターン | デフォルト CI |
|--------|-----------------|--------------|
| `type:requirements` | `requirements/*`, `plan/*` | `ci:skip` |
| `type:docs` | `docs/*` | `ci:skip` |
| `type:implementation` | `feature/*`, `feat/*` | `ci:full` |
| `type:bugfix` | `bugfix/*`, `fix/*` | `ci:full` |
| `type:refactor` | `refactor/*` | `ci:full` |

### 自動ラベリング

`actions/labeler` を使用してファイルパス・ブランチ名から自動付与。

```yaml
# .github/labeler.yml
frontend:
  - changed-files:
      - any-glob-to-any-file:
        - 'src/components/**'

'type:implementation':
  - head-branch: ['^feature/', '^feat/']
```

### CI フロー

```
┌─────────────────────────────────────────────────────────────┐
│                    PR 作成/更新                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Auto Labeler    │
                    │ (labeler.yml)   │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Check Labels    │
                    │ (ci.yml)        │
                    └─────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │  ci:skip    │    │  ci:fast    │    │  ci:full    │
   │ (スキップ)  │    │ (lint+型)   │    │ (フルCI)    │
   └─────────────┘    └─────────────┘    └─────────────┘
```

## 運用ルール

### PR 作成時

1. ブランチ名を規約に従って命名（自動ラベル付与のため）
2. 依存がある場合は PR 本文に `Depends on #xxx` を記載
3. 依存 PR がマージされるまで Draft 状態を維持

### レビュー時

1. `blocked` ラベルがある PR は依存解決まで待機
2. 依存 PR のマージ後、リベースを依頼
3. `ci:e2e` ラベルで最終確認

### マージ時

1. マージ順序を確認（DB → API → UI → E2E）
2. 依存先 PR にリベース依頼をコメント
3. 全 PR マージ後に動作確認

## 参考リンク

- [actions/labeler](https://github.com/actions/labeler)
- [GitHub Stacked PRs](https://github.com/marketplace/stacked-pull-requests)
- [組織共通ルール Wiki](https://github.com/PROLE-ISLAND/.github/wiki)

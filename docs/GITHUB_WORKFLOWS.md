# GitHub Actions Workflows 解説

> 最終更新: 2025-12-30

## 概要

hy-assessmentでは10個のGitHub Actionsワークフローを使用しています。

| カテゴリ | ワークフロー | トリガー |
|---------|------------|---------|
| **コア** | ci.yml, codeql.yml, deploy-production.yml | push/PR |
| **PR管理** | pr-governance.yml, quality-gate.yml | PR |
| **テスト** | e2e.yml, e2e-test-generation.yml | push/PR/schedule |
| **自動化** | auto-approve.yml, release.yml, stale.yml | 各種 |

> **Note**: `pr-check.yml` は `pr-governance.yml` に統合されました。

---

## 1. ci.yml - CI ワークフロー

### 目的
PR・プッシュ時の基本的な品質チェック（lint、型チェック、テスト、ビルド）

### トリガー
- `push`: main, develop
- `pull_request`: main, develop

### ジョブ構成
```
lint ──────┐
type-check ├─→ build
unit-test ─┘
```

### 実行内容
| ジョブ | 内容 | 所要時間目安 |
|-------|------|-------------|
| lint | ESLint実行 | ~1分 |
| type-check | `tsc --noEmit` | ~1分 |
| unit-test | Vitest + カバレッジ | ~2分 |
| build | Next.jsビルド | ~2分 |

### 改善余地
| 項目 | 現状 | 改善案 | 優先度 |
|------|------|--------|--------|
| キャッシュ | setup-node共通アクション使用 | ✅ 最適化済み | - |
| 並列実行 | lint/type-check/testが並列 | ✅ 最適化済み | - |
| ビルド成果物 | 1日保持 | 7日に延長も可 | 低 |

---

## 2. codeql.yml - CodeQL Security Analysis

### 目的
静的セキュリティ解析（SAST）でコードの脆弱性を検出

### トリガー
- `push`: main
- `pull_request`: main
- `schedule`: 毎週月曜 12:00 JST

### 実行内容
- JavaScript/TypeScript コードをスキャン
- `security-extended` クエリで拡張チェック
- 結果はSecurity タブに表示

### 改善余地
| 項目 | 現状 | 改善案 | 優先度 |
|------|------|--------|--------|
| クエリセット | security-extended | ✅ 適切 | - |
| スケジュール | 週1回 | 十分 | - |
| actions/checkout | v4 | v6に更新可能 | 低 |

---

## 3. deploy-production.yml - 本番デプロイ

### 目的
mainブランチへのプッシュ時にVercel本番環境へ自動デプロイ

### トリガー
- `push`: main

### 実行内容
1. Vercel CLI でプロジェクト取得
2. ビルド実行
3. 本番デプロイ
4. コミットステータス更新

### 改善余地
| 項目 | 現状 | 改善案 | 優先度 |
|------|------|--------|--------|
| 環境保護 | environment: production設定 | ✅ 適切 | - |
| 通知 | コミットステータスのみ | Slack通知追加も可 | 低 |
| ロールバック | なし | 失敗時の自動ロールバック | 中 |

---

## 4. e2e.yml - E2Eテスト

### 目的
Playwright E2Eテストの実行

### トリガー
- `pull_request`: main（スモークテストのみ、src/e2e変更時）
- `push`: main（フルテスト）
- `schedule`: 毎日 9:00 JST
- `workflow_dispatch`: 手動実行（full/smoke選択可）

### 実行内容
1. Chromiumブラウザインストール
2. アプリケーションビルド
3. E2Eテスト実行（PRはスモーク、mainはフル）
4. レポート・スクリーンショットアップロード

### 改善余地
| 項目 | 現状 | 改善案 | 優先度 |
|------|------|--------|--------|
| ブラウザ | Chromiumのみ | Firefox/WebKit追加で互換性テスト | 低 |
| 並列実行 | シングル | shardingで並列化可能 | 中 |
| PRトリガー | ✅ スモークテスト実行 | - | - |
| タイムアウト | 30分 | ✅ 適切 | - |

---

## 5. ~~pr-check.yml~~ (削除済み)

> **Note**: このワークフローは `pr-governance.yml` に統合されました。
> ブランチ命名規則チェックは `pr-governance.yml` の pr-quality-gate ジョブで実行されます。

---

## 6. pr-governance.yml - PR Governance

### 目的
Why必須チェック・ブランチ命名規則チェック・自動ラベリング・変更サマリー生成

### トリガー
- `pull_request`: opened, edited, synchronize, reopened

### ジョブ構成
| ジョブ | 内容 |
|-------|------|
| pr-quality-gate | Why/目的/リスク評価/ブランチ命名規則のチェック |
| auto-labeler | ファイルパスに基づく自動ラベル付与 |
| file-change-summary | 変更サマリー生成・レビュー観点提示 |

### 自動付与ラベル
- frontend, backend, database, infrastructure
- documentation, config, tests, ui, ai
- size/small, size/medium, size/large

### 改善余地
| 項目 | 現状 | 改善案 | 優先度 |
|------|------|--------|--------|
| サイズ基準 | 100/500行 | チーム好みで調整 | 低 |
| レビュー観点 | 自動生成 | より詳細なガイドライン | 低 |
| actions/github-script | v7 | v8に更新可能 | 低 |

---

## 7. quality-gate.yml - 品質ゲート（DoD判定）

### 目的
CI完了後にDoD（Definition of Done）レベルを判定してPRにレポート投稿

### トリガー
- `workflow_run`: CI完了後

### DoD レベル
| レベル | カバレッジ基準 | 用途 |
|-------|--------------|------|
| Bronze | 80%以上 | プロトタイプ |
| Silver | 85%以上 | 開発版（デフォルト） |
| Gold | 95%以上 | 本番品質 |

### 改善余地
| 項目 | 現状 | 改善案 | 優先度 |
|------|------|--------|--------|
| カバレッジ取得 | ハードコード85% | 実際のartifactから取得 | **高** |
| 重複 | pr-governanceと一部重複 | 統合検討 | 中 |
| DoD判定 | PR本文から検出 | ラベルベースに変更 | 低 |

---

## 8. auto-approve.yml - 自動承認

### 目的
安全なPRタイプ（chore/, deps/, docs/, ci/）の自動承認

### トリガー
- `pull_request_target`: opened, synchronize, reopened

### 条件
- actor: `ryu1aida1126`, `dependabot[bot]`, `renovate[bot]`
- ブランチ: `chore/`, `deps/`, `docs/`, `fix/sync`, `ci/`, `dependabot/`, `renovate/`

### 改善余地
| 項目 | 現状 | 改善案 | 優先度 |
|------|------|--------|--------|
| actor制限 | ✅ Dependabot/Renovate対応済み | - | - |
| PAT | APPROVE_PAT使用 | Bot専用アカウント | 低 |
| 自己承認 | 不可（GitHub制限） | 別アカウント必要 | - |

---

## 9. release.yml - 自動リリース

### 目的
semantic-releaseによるバージョン判定・GitHub Release作成

### トリガー
- `push`: main
- `workflow_dispatch`: 手動

### 実行内容
1. コミットメッセージ解析
2. バージョン決定（feat→minor, fix→patch）
3. GitHub Release作成
4. Git Tag作成

### 改善余地
| 項目 | 現状 | 改善案 | 優先度 |
|------|------|--------|--------|
| CHANGELOG | 自動更新なし | 手動PRで対応 | 低 |
| package.json | バージョン未更新 | 必要なら手動 | 低 |
| actions/checkout | v4 | v6に更新可能 | 低 |

---

## 10. stale.yml - Stale Bot

### 目的
放置されたIssue/PRへの警告・自動クローズ

### トリガー
- `schedule`: 毎日 9:00 JST
- `workflow_dispatch`: 手動

### 設定
| 対象 | stale警告 | クローズ |
|------|----------|---------|
| Issue | 30日後 | +7日（計37日） |
| PR | 14日後 | +7日（計21日） |

### 除外条件
- P0: Critical, P1: High, blocked, in-progress, decision
- ドラフトPR

### 改善余地
| 項目 | 現状 | 改善案 | 優先度 |
|------|------|--------|--------|
| 設定 | ✅ 適切 | - | - |
| 除外ラベル | 5種類 | 必要に応じて追加 | 低 |

---

## 11. e2e-test-generation.yml - E2Eテスト自動生成

### 目的
AI/ルールベースでE2Eテストを自動生成

### トリガー
- `pull_request`: main (opened, synchronize)
- `workflow_dispatch`: 手動

### ジョブ構成
1. **analyze-changes**: 変更ファイル分析
2. **generate-tests**: テストコード生成
3. **comment-on-pr**: 結果をPRにコメント

### 改善余地
| 項目 | 現状 | 改善案 | 優先度 |
|------|------|--------|--------|
| ファイルサイズ | **443行（17KB）** | 分割・外部化 | **高** |
| 複雑性 | 高い | ロジックをスクリプトに分離 | 高 |
| AI利用 | OpenAI API | コスト監視追加 | 中 |

---

## 統合・改善提案

### 完了済み ✅
1. **actions バージョン統一**: v4 → v6, v7 → v8 に更新 ✅
2. **PR関連ワークフロー統合**: `pr-check.yml` → `pr-governance.yml` に統合 ✅
3. **E2E PR対応**: PR時にスモークテスト実行 ✅
4. **Dependabot自動承認**: auto-approve.yml が Dependabot/Renovate に対応 ✅

### 今後の検討事項
1. **e2e-test-generation.yml 分割**:
   - 生成ロジックを `scripts/e2e-generator.ts` に外部化
   - ワークフローはオーケストレーションのみ

2. **E2Eテストのシャーディング**:
   - テスト時間短縮のため並列実行

3. **Slack/Discord通知**: デプロイ・テスト結果の通知

4. **本番ロールバック**: 失敗時の自動復旧

---

## ワークフロー依存関係図

```
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐
│ pull_request│───→│ ci.yml      │───→│ quality-gate.yml│
│             │    │ (並列実行)   │    │ (CI完了後)       │
└─────────────┘    └─────────────┘    └─────────────────┘
       │
       ├───────→ pr-governance.yml (ブランチ規約+品質チェック)
       ├───────→ e2e.yml (スモークテスト)
       ├───────→ auto-approve.yml (条件付き)
       └───────→ e2e-test-generation.yml

┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│ push (main) │───→│ deploy-production│    │ release.yml │
│             │    │ e2e.yml (フル)   │    │             │
└─────────────┘    └─────────────────┘    └─────────────┘

┌─────────────┐
│ schedule    │───→ stale.yml, e2e.yml, codeql.yml
└─────────────┘
```

---

## 参考リンク

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Playwright CI](https://playwright.dev/docs/ci)

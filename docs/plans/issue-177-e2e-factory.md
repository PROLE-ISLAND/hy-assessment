# Issue #177: E2Eテストデータ設計・ファクトリー基盤構築

## 概要

E2Eテストで環境変数に依存せず、ファクトリーパターンでテストデータを動的生成する基盤を構築。

## 実装フェーズ

| Phase | Issue | PR | 状態 | 内容 |
|-------|-------|-----|------|------|
| 1 | #178 | #187 | ✅ 完了 | ファクトリー基盤（Supabase Admin Client, TestDataManager） |
| 2 | #179 | #188 | ✅ 完了 | 個別ファクトリー（候補者、検査、分析、レポート） |
| 3 | #180 | #191 | ✅ 完了 | セットアップ統合（data.setup.ts, data.teardown.ts） |
| 4 | #181 | - | ⏳ 次 | テスト移行（既存テストをファクトリーに移行） |
| 5 | #182 | - | ⏳ 待機 | ドキュメント・ワークフロー更新 |

## アーキテクチャ

```
e2e/
├── factories/
│   ├── supabase-admin.ts      # Supabase Admin Client（型安全）
│   ├── candidate.factory.ts   # 候補者ファクトリー
│   ├── assessment.factory.ts  # 検査ファクトリー
│   ├── analysis.factory.ts    # 分析ファクトリー
│   ├── report.factory.ts      # レポートファクトリー
│   └── index.ts               # エクスポート
├── helpers/
│   └── test-data-manager.ts   # テストデータ永続化
├── setup/
│   ├── data.setup.ts          # テストデータセットアップ
│   └── data.teardown.ts       # テストデータクリーンアップ
└── types/
    └── test-fixtures.ts       # 共通型定義
```

## Playwrightプロジェクト依存

```
setup → data-setup → gold/integration → cleanup
```

## 成功指標

| 指標 | 現状 | 目標 |
|------|------|------|
| Gold E2E実行テスト数 | 8/14 | 14/14 |
| スキップテスト数 | 6 | 0 |
| 環境変数依存 | 4個 | 0個 |

## 関連Issue/PR

- 親Issue: #177
- 要件定義PR: #184
- 実装PR: #187, #188, #191

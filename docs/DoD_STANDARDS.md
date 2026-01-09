# Definition of Done (DoD) Standards

> **Version**: 1.0
> **Created**: 2025-12-30
> **Scope**: PROLE-ISLAND Organization - All Repositories

---

## Overview

本ドキュメントは、PROLE-ISLAND組織内のすべてのリポジトリに適用される**厳格な品質基準**を定義する。

### DoD Levels

| Level | Badge | 用途 | 必須タイミング |
|-------|-------|------|---------------|
| **Bronze** | :bronze: | PR最低基準 | PRオープン時 |
| **Silver** | :silver: | マージ可能基準 | マージ前 |
| **Gold** | :gold: | 本番リリース基準 | プロダクションデプロイ前 |

### 成熟度計算

```
総合成熟度 = (Bronze完了率 × 40%) + (Silver完了率 × 30%) + (Gold完了率 × 30%)

:gold: Gold:   90%以上 - 本番リリース可能
:silver: Silver: 70%以上 - マージ可能
:bronze: Bronze: 40%以上 - レビュー可能
```

---

## Phase横断: 作業開始前チェック（3観点）

> **全作業に適用**。コードを書く前に必ず実施する。

### P. プロセス品質（3観点）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| P1 | **完了定義確認** | Wiki/DoDに完了定義が存在することを確認 | 「何をもって完了か」を明確化 |
| P2 | **Pre-mortem実施** | 失敗原因を3つ以上洗い出し | 失敗を予測して防ぐ |
| P3 | **事前確認** | ユーザーに完了定義とリスクを報告 | 認識齟齬の防止 |

**詳細**: [作業開始ルール](https://github.com/PROLE-ISLAND/.github/wiki/作業開始ルール)

```
なぜ必要か:
❌ リアクティブ: 作業 → 失敗 → 原因分析 → ドキュメント追加
⭕ プロアクティブ: 完了定義確認 → リスク洗い出し → 作業 → 検証 → 完了
```

---

## Bronze :bronze: - PR最低基準（27観点）

> CI自動チェック可能な基本品質。PRオープンの最低条件。

### A. コード品質（7観点）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| A1 | **型安全性** | `tsc --noEmit` エラー0 | 実行時エラー防止、IDE補完有効化 |
| A2 | **Lint通過** | `eslint` 警告0 | コードスタイル統一 |
| A3 | **循環複雑度≦10** | ESLint complexity rule | 関数の理解しやすさ維持 |
| A4 | **重複度≦5%** | SonarQube / jscpd | DRY原則遵守 |
| A5 | **コードコメント** | PR diff確認 | 意図（Why）の明確化 |
| A6 | **命名規則遵守** | ESLint naming-convention | 一貫した命名 |
| A7 | **デッドコード排除** | ESLint no-unused-vars | コード肥大化防止 |

### B. テスト（9観点）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| B1 | **単体テスト通過** | `vitest run` / `jest` | 基本動作保証 |
| B2 | **カバレッジ≧80%** | Coverage report | テスト網羅性 |
| B3 | **境界値テスト** | テストコード確認 | エッジケース検証 |
| B4 | **異常系テスト** | テストコード確認 | エラーパス検証 |
| B5 | **モック設計** | 外部依存の分離確認 | テスト安定性 |
| B6 | **テストデータ** | fixtures / factories | 再現可能性 |
| B7 | **回帰テスト** | CI全テスト通過 | 既存機能維持 |
| B8 | **テスト命名** | describe/it の明確さ | テスト意図の理解 |
| B9 | **テスト独立性** | 順序依存なし | 並列実行可能 |

### H. 設定/環境（4観点）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| H1 | **設定外部化** | ハードコード検出 | 環境依存排除 |
| H2 | **環境分離** | .env.example 存在 | dev/staging/prod分離 |
| H3 | **シークレット管理** | .gitignore確認 | 認証情報漏洩防止 |
| H4 | **ビルド再現性** | lockファイル確認 | 環境差異防止 |

### K. CI/CD（4観点）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| K1 | **自動ビルド通過** | CI green | ビルド壊れ検出 |
| K2 | **自動テスト通過** | CI green | テスト失敗検出 |
| K3 | **ビルド時間** | ≦10分 | 開発効率維持 |
| K4 | **CI設定有効** | workflow存在 | 自動化維持 |

### L. レビュー基本（3観点）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| L1 | **PR説明記載** | What/Why記載 | 変更意図の明確化 |
| L2 | **ブランチ規約** | feature/bugfix/etc. | 管理の統一 |
| L3 | **コミットメッセージ** | Conventional Commits | 履歴の追跡性 |

---

## Silver :silver: - マージ可能基準（31観点）

> Bronze + セキュリティ・統合・レビュー完了。マージ承認の条件。

### C. セキュリティ（11観点）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| C1 | **入力検証** | zod/yup/手動確認 | SQLi, XSS防止 |
| C2 | **出力エスケープ** | React JSX / sanitize | XSS防止 |
| C3 | **認証実装** | 認証フロー確認 | 不正ログイン防止 |
| C4 | **認可チェック** | RLS / middleware | 権限昇格防止 |
| C5 | **CSRF対策** | トークン確認 | 不正リクエスト防止 |
| C6 | **SQLインジェクション対策** | ORM / Prepared Statement | DB保護 |
| C7 | **暗号化** | 機密データ保護確認 | 平文漏洩防止 |
| C8 | **セッション管理** | セッション設定確認 | ハイジャック防止 |
| C9 | **セキュリティヘッダ** | CSP, HSTS確認 | 攻撃防御 |
| C10 | **依存脆弱性スキャン** | `npm audit` / Dependabot | 既知脆弱性排除 |
| C11 | **機密情報管理** | env/secrets確認 | 認証情報保護 |

### F. API/統合（8観点）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| F1 | **API仕様準拠** | OpenAPI / 型定義 | 連携先との整合性 |
| F2 | **破壊的変更なし** | バージョニング確認 | 後方互換性 |
| F3 | **エラーレスポンス** | HTTP status確認 | エラー原因特定 |
| F4 | **レート制限** | 制限設定確認 | 過負荷防止 |
| F5 | **タイムアウト設定** | fetch/axios設定 | 無限待ち防止 |
| F6 | **リトライ設計** | リトライロジック | 一時障害復旧 |
| F7 | **フォールバック** | 代替処理確認 | 部分障害耐性 |
| F8 | **統合テスト** | API連携テスト | コンポーネント連携 |

### G. データベース（6観点）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| G1 | **マイグレーション安全性** | DROP/ALTER影響確認 | データ損失防止 |
| G2 | **RLS/権限分離** | ポリシー確認 | マルチテナント分離 |
| G3 | **インデックス設計** | EXPLAIN確認 | 検索性能 |
| G4 | **ロールバック可能** | down migration | 復旧可能性 |
| G5 | **トランザクション** | 整合性確認 | データ整合性 |
| G6 | **N+1クエリ排除** | クエリログ確認 | DB負荷削減 |

### L. レビュー完了（3観点追加）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| L4 | **ピアレビュー完了** | Approve取得 | 第三者確認 |
| L5 | **セキュリティレビュー** | セキュリティ観点確認 | 脆弱性の人的確認 |
| L6 | **設計レビュー** | アーキテクチャ確認 | 技術負債防止 |

---

## Gold :gold: - 本番リリース基準（19観点）

> Silver + E2E・パフォーマンス・監視・ドキュメント完備。プロダクションデプロイの条件。

### B. テスト追加（2観点）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| B10 | **E2Eテスト** | Playwright通過 | ユーザーシナリオ検証 |
| B11 | **負荷テスト** | k6 / Artillery | スケーラビリティ確認 |

#### B10: Gold E2Eテスト完了定義

> **重要**: E2Eテストは「仕様書を書いた」だけでは完了ではない。
> 以下の全てを満たして初めて「完了」とする。

| # | 完了条件 | 確認方法 |
|---|---------|---------|
| B10-1 | **Secrets設定済み** | `gh secret list`で必要な変数が存在 |
| B10-2 | **テストデータ準備済み** | DBに検証用データが存在 |
| B10-3 | **セレクター存在確認済み** | `data-testid`が実アプリに存在 |
| B10-4 | **ローカル実行成功** | `npx playwright test e2e/gold/` が3回連続pass |
| B10-5 | **CI実行成功** | PR作成後のチェックがgreen |

詳細: [Gold実装完了チェックリスト](https://github.com/PROLE-ISLAND/.github/wiki/Gold実装完了チェックリスト)

### D. パフォーマンス（7観点）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| D1 | **応答時間≦2秒** | Lighthouse / 実測 | ユーザー体験 |
| D2 | **初期描画≦1秒** | FCP測定 | 待機ストレス軽減 |
| D3 | **API応答≦500ms** | API計測 | バックエンド性能 |
| D4 | **メモリ使用量** | プロファイリング | OOM防止 |
| D5 | **バンドルサイズ** | Bundle Analyzer | 初回ロード最適化 |
| D6 | **Core Web Vitals** | LCP, FID, CLS | SEO・UX指標 |
| D7 | **同時接続耐性** | 負荷テスト | アクセス集中対応 |

### E. アクセシビリティ（6観点）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| E1 | **キーボード操作** | Tab操作確認 | マウス不要操作 |
| E2 | **スクリーンリーダー対応** | ARIA属性確認 | 視覚障害者対応 |
| E3 | **色コントラスト** | 4.5:1以上確認 | 色覚異常者対応 |
| E4 | **フォーカス表示** | :focus-visible | 現在位置視覚化 |
| E5 | **レスポンシブ** | 各デバイス確認 | マルチデバイス |
| E6 | **フォームラベル** | label関連付け | 入力欄説明 |

### I. ログ/監視（5観点）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| I1 | **構造化ログ** | JSON形式確認 | 検索・分析可能 |
| I2 | **エラーログ** | 例外キャッチ確認 | 原因特定 |
| I3 | **監査ログ** | 操作記録確認 | セキュリティ監査 |
| I4 | **アラート設定** | 通知設定確認 | 異常検知 |
| I5 | **メトリクス収集** | ダッシュボード | 性能追跡 |

### J. ドキュメント（5観点）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| J1 | **README更新** | セットアップ手順 | オンボーディング |
| J2 | **API仕様書** | OpenAPI / 型定義 | 連携開発 |
| J3 | **変更履歴** | CHANGELOG更新 | 変更追跡 |
| J4 | **運用手順** | トラブルシュート | 障害対応 |
| J5 | **アーキテクチャ図** | 構成図更新 | 全体像理解 |

### K. デプロイ（1観点追加）

| # | 観点 | 検証方法 | 役割 |
|---|------|---------|------|
| K5 | **ロールバック手順** | 復旧手順確認 | 緊急時対応 |

---

## Quick Reference

### Bronze Checklist (PR Open)

```markdown
## Bronze :bronze: Checklist

### Code Quality
- [ ] A1: 型エラー 0
- [ ] A2: Lint警告 0
- [ ] A3: 循環複雑度 ≦10
- [ ] A4: コード重複 ≦5%
- [ ] A5: コメント（Why）記載
- [ ] A6: 命名規則遵守
- [ ] A7: 未使用コードなし

### Testing
- [ ] B1: 単体テスト通過
- [ ] B2: カバレッジ ≧80%
- [ ] B3: 境界値テストあり
- [ ] B4: 異常系テストあり
- [ ] B5: モック適切
- [ ] B6: テストデータ整備
- [ ] B7: 回帰テスト通過
- [ ] B8: テスト命名明確
- [ ] B9: テスト独立性あり

### Config
- [ ] H1: 設定外部化
- [ ] H2: 環境分離
- [ ] H3: シークレット管理
- [ ] H4: lockファイル更新

### CI/CD
- [ ] K1: ビルド通過
- [ ] K2: テスト通過
- [ ] K3: ビルド時間 ≦10分
- [ ] K4: CI設定有効

### Review Basics
- [ ] L1: PR説明記載
- [ ] L2: ブランチ規約準拠
- [ ] L3: コミットメッセージ規約
```

### Silver Checklist (Merge Ready)

```markdown
## Silver :silver: Checklist

### Security
- [ ] C1: 入力検証
- [ ] C2: 出力エスケープ
- [ ] C3: 認証実装
- [ ] C4: 認可チェック
- [ ] C5: CSRF対策
- [ ] C6: SQLi対策
- [ ] C7: 暗号化
- [ ] C8: セッション管理
- [ ] C9: セキュリティヘッダ
- [ ] C10: 依存脆弱性なし
- [ ] C11: 機密情報管理

### API/Integration
- [ ] F1: API仕様準拠
- [ ] F2: 破壊的変更なし
- [ ] F3: エラーレスポンス適切
- [ ] F4: レート制限
- [ ] F5: タイムアウト設定
- [ ] F6: リトライ設計
- [ ] F7: フォールバック
- [ ] F8: 統合テスト通過

### Database
- [ ] G1: マイグレーション安全
- [ ] G2: RLS/権限分離
- [ ] G3: インデックス適切
- [ ] G4: ロールバック可能
- [ ] G5: トランザクション適切
- [ ] G6: N+1クエリなし

### Review Complete
- [ ] L4: ピアレビュー完了
- [ ] L5: セキュリティレビュー
- [ ] L6: 設計レビュー
```

### Gold Checklist (Production Deploy)

```markdown
## Gold :gold: Checklist

### E2E & Load
- [ ] B10: E2Eテスト通過
- [ ] B11: 負荷テスト通過

### Performance
- [ ] D1: 応答時間 ≦2秒
- [ ] D2: FCP ≦1秒
- [ ] D3: API応答 ≦500ms
- [ ] D4: メモリ使用量適正
- [ ] D5: バンドルサイズ適正
- [ ] D6: Core Web Vitals合格
- [ ] D7: 同時接続耐性

### Accessibility
- [ ] E1: キーボード操作可能
- [ ] E2: スクリーンリーダー対応
- [ ] E3: 色コントラスト 4.5:1+
- [ ] E4: フォーカス表示
- [ ] E5: レスポンシブ
- [ ] E6: フォームラベル

### Monitoring
- [ ] I1: 構造化ログ
- [ ] I2: エラーログ
- [ ] I3: 監査ログ
- [ ] I4: アラート設定
- [ ] I5: メトリクス収集

### Documentation
- [ ] J1: README更新
- [ ] J2: API仕様書
- [ ] J3: CHANGELOG更新
- [ ] J4: 運用手順
- [ ] J5: アーキテクチャ図

### Deploy
- [ ] K5: ロールバック手順
```

---

## Automation Integration

### ローカルチェックスクリプト（推奨）

PR作成前にローカルで品質基準を確認するためのスクリプト。

```json
{
  "scripts": {
    "check:bronze": "npm run lint && npm run test:run -- --coverage && npm run build",
    "check:silver": "npm run check:bronze && npm audit --audit-level=high",
    "check:gold": "npm run check:silver && npm run test:e2e"
  }
}
```

| コマンド | チェック内容 | 使用タイミング |
|---------|------------|---------------|
| `npm run check:bronze` | lint, 型, 単体テスト, カバレッジ, ビルド | PR作成前 |
| `npm run check:silver` | Bronze + npm audit (high/critical) | マージ前 |
| `npm run check:gold` | Silver + E2Eテスト | 本番リリース前 |

> **Note**: 各プロジェクトの `package.json` に上記スクリプトを追加することを推奨。
> カバレッジ閾値やE2Eディレクトリはプロジェクトに合わせて調整。

### GitHub Actions Quality Gate

```yaml
# .github/workflows/quality-gate.yml
name: Quality Gate

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  bronze-gate:
    name: Bronze Gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Type Check
        run: npx tsc --noEmit
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm run test:coverage
      - name: Coverage Check
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% < 80%"
            exit 1
          fi

  silver-gate:
    name: Silver Gate
    needs: bronze-gate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Security Audit
        run: npm audit --audit-level=high
      - name: Integration Tests
        run: npm run test:integration
```

### PR Template Integration

PRテンプレートにDoD Levelを選択させる：

```markdown
## DoD Level

<!-- 該当するレベルを選択 -->
- [ ] Bronze - 開発中/プロトタイプ
- [ ] Silver - レビュー・マージ準備完了
- [ ] Gold - 本番リリース準備完了
```

---

## References

- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Core Web Vitals](https://web.dev/vitals/)

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.2 | 2025-12-30 | ローカルチェックスクリプト（check:bronze/silver/gold）を追加 |
| 1.1 | 2025-12-30 | B10にGold E2E完了定義（5条件）を追加 |
| 1.0 | 2025-12-30 | Initial release - 77 criteria across Bronze/Silver/Gold |

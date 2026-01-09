# {リポジトリ名} 開発ルール

## 📚 必読ドキュメント

開発開始前に以下を確認すること：

| ドキュメント | 内容 | 必須度 |
|-------------|------|--------|
| [DoD_STANDARDS.md](https://github.com/PROLE-ISLAND/.github/blob/main/DoD_STANDARDS.md) | 品質基準（77観点） | ⚠️ 最優先 |
| [組織Wiki](https://github.com/PROLE-ISLAND/.github/wiki) | 開発標準・CI/CD・テスト戦略 | ⚠️ 必須 |
| [組織CLAUDE.md](https://github.com/PROLE-ISLAND/.github/blob/main/CLAUDE.md) | 組織共通開発ルール | ⚠️ 必須 |
| このファイル | プロジェクト固有ルール | 📖 参照 |

> **ルール優先順位**: DoD_STANDARDS.md > 組織Wiki > 組織CLAUDE.md > このファイル

---

## 🔧 技術スタック

<!-- プロジェクトの技術スタックを記載 -->

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 15+ |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| UI コンポーネント | shadcn/ui |
| データベース | Supabase |
| テスト | Vitest, Playwright |

---

## 📁 ディレクトリ構成

<!-- プロジェクトのディレクトリ構成を記載 -->

```
src/
├── app/           # App Router
├── components/    # UIコンポーネント
│   ├── ui/        # 基本UI（shadcn/ui等）
│   └── {feature}/ # 機能別
├── lib/           # ユーティリティ
└── types/         # 型定義
```

---

## 🎯 プロジェクト固有ルール

<!-- このリポジトリ固有のルールを記載 -->

### コーディング規約

- 組織Wiki の [開発標準](https://github.com/PROLE-ISLAND/.github/wiki/開発標準) に準拠
- 追加ルールがあれば以下に記載

### テスト方針

- 組織Wiki の [テスト戦略](https://github.com/PROLE-ISLAND/.github/wiki/テスト戦略) に準拠
- 追加ルールがあれば以下に記載

---

## 🎯 DoD達成のための開発フロー

### 1. ローカル事前チェック

PR作成前に必ず実行:

```bash
# Bronze Gate チェック（PR最低基準）
npm run check:bronze

# Silver Gate チェック（マージ前）
npm run check:silver

# Gold Gate チェック（本番リリース前）
npm run check:gold
```

### 2. 実装ガイド参照

| ガイド | 内容 |
|--------|------|
| [DoD達成ガイド](https://github.com/PROLE-ISLAND/.github/wiki/DoD達成ガイド) | 77観点の具体的達成方法 |
| [テスト実装パターン](https://github.com/PROLE-ISLAND/.github/wiki/テスト実装パターン) | カバレッジ80%達成のパターン |
| [Goldテストチャーター](https://github.com/PROLE-ISLAND/.github/wiki/Goldテストチャーター) | Gold E2Eの目的・採用基準 |
| [Gold仕様テンプレート](https://github.com/PROLE-ISLAND/.github/wiki/Gold仕様テンプレート) | GWT形式の仕様テンプレート |
| [セキュリティ実装ガイド](https://github.com/PROLE-ISLAND/.github/wiki/セキュリティ実装ガイド) | C1-C11の実装方法 |
| [DB設計レビューガイド](https://github.com/PROLE-ISLAND/.github/wiki/DB設計レビューガイド) | G1-G6の確認プロセス |
| [API設計ガイド](https://github.com/PROLE-ISLAND/.github/wiki/API設計ガイド) | F1-F8 + OpenAPIテンプレート |

### 3. DB/API変更時の注意

Issue/PRテンプレートのチェックリストを確認:

**DB変更時**:
- [ ] マイグレーションファイル作成
- [ ] RLSポリシー設定
- [ ] インデックス検討

**API変更時**:
- [ ] OpenAPI仕様更新
- [ ] 破壊的変更の確認
- [ ] エラーレスポンス定義

---

## 🔗 関連ドキュメント

### 組織レベル
- [DoD_STANDARDS.md](https://github.com/PROLE-ISLAND/.github/blob/main/DoD_STANDARDS.md) - 品質基準（77観点）
- [組織Wiki](https://github.com/PROLE-ISLAND/.github/wiki) - 詳細ガイドライン
- [組織CLAUDE.md](https://github.com/PROLE-ISLAND/.github/blob/main/CLAUDE.md) - 組織共通開発ルール

### プロジェクトレベル
- [プロジェクトWiki](https://github.com/PROLE-ISLAND/{リポジトリ名}/wiki) - プロジェクト固有ドキュメント

---

## 📝 使い方

1. このテンプレートをリポジトリルートに `CLAUDE.md` としてコピー
2. `{リポジトリ名}` を実際のリポジトリ名に置換
3. 技術スタック・ディレクトリ構成を実際の内容に更新
4. プロジェクト固有ルールを追記
5. Copilot 用にシンボリックリンクを作成:
   ```bash
   ln -sf CLAUDE.md .github/copilot-instructions.md
   ```

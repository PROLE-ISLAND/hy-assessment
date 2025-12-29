# オンボーディングガイド

> 新しいエンジニア向けクイックスタート

## Day 1: 環境構築

### 1. アクセス権取得（管理者に依頼）

- [ ] GitHub リポジトリへの招待
- [ ] Supabase プロジェクトへの招待
- [ ] Vercel チームへの招待
- [ ] Slack チャンネルへの追加

### 2. ローカル環境セットアップ

```bash
# リポジトリクローン
git clone https://github.com/PROLE-ISLAND/hy-assessment.git
cd hy-assessment

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
```

### 3. 環境変数の設定

`.env.local` を編集:

```bash
# Supabaseチームから取得
NEXT_PUBLIC_SUPABASE_URL=https://kiqlyeoxccuxtofktwlm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI（チームから取得 or 個人キー）
OPENAI_API_KEY=sk-...

# アプリURL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 開発サーバー起動

```bash
npm run dev
# → http://localhost:3000
```

### 5. 動作確認

1. ブラウザで http://localhost:3000 を開く
2. ログインページが表示されることを確認
3. テストアカウントでログイン（チームに確認）

---

## Day 2: コードベース理解

### 読むべきドキュメント

| 順番 | ドキュメント | 所要時間 |
|-----|------------|---------|
| 1 | [ARCHITECTURE.md](./ARCHITECTURE.md) | 30分 |
| 2 | [DATABASE.md](./DATABASE.md) | 20分 |
| 3 | [FEATURES.md](./FEATURES.md) | 30分 |
| 4 | [DEVELOPMENT.md](./DEVELOPMENT.md) | 20分 |

### 確認すべきファイル

```bash
# プロジェクト構造
tree src -L 2

# メインページ
code src/app/admin/page.tsx

# 主要コンポーネント
code src/components/dashboard/

# AI分析エンジン
code src/lib/analysis/
```

### 手を動かす

```bash
# 型チェック
npx tsc --noEmit

# Lint
npm run lint

# テスト実行
npm run test:run

# ビルド
npm run build
```

---

## Day 3: 開発フロー体験

### 1. 練習Issue取得

```bash
# 簡単なIssueを探す
gh issue list -l "good first issue"
```

### 2. ブランチ作成

```bash
git checkout -b feature/issue-XXX-description
```

### 3. 変更を加える

例：小さなUI修正

```typescript
// src/components/ui/button.tsx
// ボタンのスタイル微調整など
```

### 4. コミット

```bash
git add .
git commit -m "fix: update button styling"
```

### 5. PR作成

```bash
git push -u origin feature/issue-XXX-description
gh pr create --title "修正: ボタンスタイル調整" --body "..."
```

### 6. CIを観察

- GitHub Actions の実行を確認
- Vercel Preview デプロイを確認

---

## 重要な概念

### マルチテナント

```
Organization A のユーザー
  ↓
自組織のデータのみ表示（RLS）
  ↓
Organization A の候補者・検査のみ
```

### 検査フロー

```
候補者登録 → 検査発行 → 候補者回答 → AI分析 → レポート
```

### 認証

```
Supabase Auth
  ↓
JWT Token
  ↓
Middleware で検証
  ↓
usersテーブル参照
```

---

## よくある質問

### Q: ローカルでメール送信はどうなる？

A: 開発環境では `RESEND_API_KEY` を設定しなければメール送信はスキップされます。コンソールにログが出力されます。

### Q: OpenAI APIキーがない場合は？

A: モックモードで動作します。実際のAI分析結果ではなくダミーデータが返されます。

### Q: DBのデータを見たい

A: Supabase Dashboard → Table Editor で確認できます。

```
https://supabase.com/dashboard/project/kiqlyeoxccuxtofktwlm
```

### Q: PRのマージ方法は？

A: ソロ開発のため、以下のコマンドでマージします：

```bash
gh pr merge {番号} --squash --delete-branch --admin
```

---

## 連絡先

| 役割 | 担当 | 連絡方法 |
|-----|-----|---------|
| プロジェクトオーナー | 相田龍一 | Slack: @ryuichi |
| 技術質問 | チーム | Slack: #hy-assessment |

---

## チェックリスト

### Week 1

- [ ] ローカル環境構築完了
- [ ] ドキュメント読了
- [ ] テストアカウントでログイン成功
- [ ] 初めてのPR作成

### Week 2

- [ ] 主要機能の動作理解
- [ ] コードレビュー参加
- [ ] 小規模な機能修正

### Week 3

- [ ] 独立したタスク着手
- [ ] E2Eテスト実行
- [ ] デプロイフロー理解

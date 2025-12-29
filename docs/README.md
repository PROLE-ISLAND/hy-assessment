# HY Assessment - 技術ドキュメント

> シニアエンジニア向け完全引き継ぎドキュメント

## ドキュメント構成

| ドキュメント | 内容 | 対象者 |
|------------|------|--------|
| [ONBOARDING.md](./ONBOARDING.md) | クイックスタート・初日にやること | 新規参画者 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | システム全体像・技術選定理由 | 全エンジニア |
| [DATABASE.md](./DATABASE.md) | スキーマ・ER図・RLSポリシー | バックエンド |
| [FEATURES.md](./FEATURES.md) | 機能詳細・ユーザーフロー | 全エンジニア |
| [API.md](./API.md) | APIリファレンス | バックエンド |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | 開発環境・ワークフロー・規約 | 全エンジニア |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | CI/CD・本番運用 | DevOps |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | よくある問題と解決策 | 全エンジニア |

## プロジェクト概要

**HY Assessment** は、企業の採用プロセスを効率化するAI検査プラットフォーム。

### 主要機能
- 候補者管理（マルチテナント対応）
- オンライン適性検査（SurveyJS）
- AI分析（OpenAI GPT-4/5）
- レポート生成・共有

### 技術スタック
```
Frontend:  Next.js 16 + React 19 + TypeScript + Tailwind CSS v4
Backend:   Next.js API Routes + Server Actions
Database:  Supabase (PostgreSQL + RLS)
AI:        OpenAI API (GPT-4/5)
Infra:     Vercel + GitHub Actions
```

## クイックリンク

- **本番環境**: https://hy-assessment.vercel.app
- **Supabase**: https://supabase.com/dashboard/project/kiqlyeoxccuxtofktwlm
- **Vercel**: https://vercel.com/prole-hybrand/hy-assessment
- **GitHub**: https://github.com/PROLE-ISLAND/hy-assessment

## 連絡先

- **プロジェクトオーナー**: 相田龍一 (ryu1aida1126)
- **Slack**: #hy-assessment

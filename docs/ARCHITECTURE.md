# システムアーキテクチャ

## 全体構成図

```mermaid
graph TB
    subgraph "クライアント"
        Browser[ブラウザ]
        Mobile[モバイル]
    end

    subgraph "Vercel Edge Network"
        Edge[Edge Functions]
        Middleware[Middleware<br/>認証・トレース]
    end

    subgraph "Next.js Application"
        subgraph "Frontend"
            Pages[App Router Pages]
            Components[React Components]
            UI[shadcn/ui + Radix]
        end

        subgraph "Backend"
            API[API Routes]
            Actions[Server Actions]
            Inngest[Inngest Functions]
        end
    end

    subgraph "External Services"
        Supabase[(Supabase<br/>PostgreSQL + Auth)]
        OpenAI[OpenAI API<br/>GPT-4/5]
        Resend[Resend<br/>メール送信]
        Sentry[Sentry<br/>エラー追跡]
    end

    Browser --> Edge
    Mobile --> Edge
    Edge --> Middleware
    Middleware --> Pages
    Middleware --> API

    Pages --> Components
    Components --> UI

    API --> Supabase
    API --> OpenAI
    Actions --> Supabase
    Inngest --> OpenAI
    Inngest --> Resend

    API --> Sentry
```

## 技術選定理由

### Next.js 16 (App Router)

| 選定理由 | 詳細 |
|---------|------|
| **Server Components** | DBアクセスをサーバーサイドで完結、バンドルサイズ削減 |
| **Server Actions** | フォーム処理の簡素化、型安全なAPI呼び出し |
| **Edge Runtime** | 認証ミドルウェアの高速化 |
| **Streaming** | AI分析結果の段階的表示 |

### Supabase

| 選定理由 | 詳細 |
|---------|------|
| **PostgreSQL** | 堅牢なRDBMS、複雑なクエリ対応 |
| **RLS** | テーブルレベルのマルチテナント分離 |
| **Auth** | JWT認証、Magic Link対応 |
| **リアルタイム** | 将来的なリアルタイム機能拡張 |

### OpenAI API

| 選定理由 | 詳細 |
|---------|------|
| **GPT-4/5** | 高精度な文章理解・分析 |
| **JSON Mode** | 構造化されたレスポンス |
| **Function Calling** | 複雑な分析タスクの分解 |

## レイヤー構成

```
┌─────────────────────────────────────────────────────────────┐
│ Presentation Layer                                          │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │   Pages     │ │  Components │ │     UI      │            │
│ │ (App Router)│ │   (React)   │ │(shadcn/Radix│            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ Application Layer                                           │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │   Actions   │ │     API     │ │   Inngest   │            │
│ │  (Server)   │ │   Routes    │ │  Functions  │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ Domain Layer                                                │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │  Analysis   │ │   Scoring   │ │   Reports   │            │
│ │   Engine    │ │   Engine    │ │  Generator  │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ Infrastructure Layer                                        │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │  Supabase   │ │   OpenAI    │ │   Resend    │            │
│ │   Client    │ │   Client    │ │   Client    │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## ディレクトリ構造

```
src/
├── app/                      # Next.js App Router
│   ├── admin/                # 管理画面（認証必須）
│   │   ├── candidates/       # 候補者管理
│   │   ├── assessments/      # 検査管理
│   │   ├── prompts/          # プロンプト管理
│   │   ├── compare/          # 候補者比較
│   │   └── settings/         # ユーザー設定
│   ├── assessment/[token]/   # 候補者検査ページ（公開）
│   ├── report/[token]/       # レポート閲覧（公開）
│   ├── auth/                 # 認証フロー
│   └── api/                  # APIエンドポイント
│
├── components/               # Reactコンポーネント
│   ├── ui/                   # shadcn/ui基盤
│   ├── analysis/             # 分析関連
│   ├── dashboard/            # ダッシュボード
│   └── candidates/           # 候補者管理
│
├── lib/                      # ビジネスロジック
│   ├── supabase/             # DB接続
│   ├── analysis/             # AI分析エンジン
│   ├── actions/              # Server Actions
│   ├── email/                # メール送信
│   └── validations/          # Zodスキーマ
│
└── types/                    # 型定義
    └── database.ts           # Supabase自動生成型
```

## データフロー

### 検査実施フロー

```mermaid
sequenceDiagram
    participant Admin as 管理者
    participant App as Next.js
    participant DB as Supabase
    participant Candidate as 候補者
    participant AI as OpenAI
    participant Email as Resend

    Admin->>App: 検査作成
    App->>DB: Assessment INSERT
    App->>Email: 招待メール送信
    Email-->>Candidate: 検査URL通知

    Candidate->>App: 検査アクセス (token)
    App->>DB: Assessment取得
    App-->>Candidate: 検査フォーム表示

    loop 回答
        Candidate->>App: 回答送信
        App->>DB: Response INSERT
    end

    Candidate->>App: 検査完了
    App->>DB: Status更新
    App->>AI: 分析リクエスト (Inngest)
    AI-->>App: 分析結果
    App->>DB: AIAnalysis INSERT
    App->>Email: 完了通知
    Email-->>Admin: レポート準備完了
    Email-->>Candidate: フィードバック通知
```

### 認証フロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Browser as ブラウザ
    participant Middleware as Middleware
    participant Supabase as Supabase Auth
    participant App as Next.js

    User->>Browser: ログインページアクセス
    Browser->>Middleware: リクエスト
    Middleware->>Middleware: セッション確認
    Middleware-->>Browser: /login表示

    User->>Browser: メール入力
    Browser->>Supabase: Magic Link送信
    Supabase-->>User: メール受信

    User->>Browser: Magic Linkクリック
    Browser->>Supabase: トークン検証
    Supabase-->>Browser: JWT発行
    Browser->>Middleware: リダイレクト
    Middleware->>Middleware: セッション作成
    Middleware-->>Browser: /admin表示
```

## マルチテナント設計

```mermaid
graph TB
    subgraph "Organization A"
        UA[Users A]
        CA[Candidates A]
        AA[Assessments A]
    end

    subgraph "Organization B"
        UB[Users B]
        CB[Candidates B]
        AB[Assessments B]
    end

    subgraph "RLS Policy"
        RLS[organization_id = <br/>auth.jwt→organization_id]
    end

    UA --> RLS
    UB --> RLS
    CA --> RLS
    CB --> RLS
    AA --> RLS
    AB --> RLS

    RLS --> DB[(PostgreSQL)]
```

### RLSの仕組み

```sql
-- 例：candidates テーブル
CREATE POLICY "Users can view own organization candidates"
ON candidates FOR SELECT
USING (
  organization_id = (
    SELECT organization_id FROM users
    WHERE id = auth.uid()
  )
);
```

## 非同期処理

```mermaid
graph LR
    subgraph "同期処理"
        A[検査完了] --> B[ステータス更新]
    end

    subgraph "非同期処理 (Inngest)"
        B --> C[Event: analysis/requested]
        C --> D[Step 1: 回答取得]
        D --> E[Step 2: AI分析]
        E --> F[Step 3: DB保存]
        F --> G[Step 4: メール送信]
    end
```

### なぜInngestか

| 課題 | Inngestの解決策 |
|-----|----------------|
| API timeout | バックグラウンド実行 |
| 失敗時のリトライ | 自動リトライ（3回） |
| 処理の可視化 | ダッシュボードでモニタリング |
| スケーラビリティ | サーバーレス実行 |

## セキュリティ設計

### 多層防御

```
┌────────────────────────────────────────┐
│ Layer 1: Edge (Vercel)                 │
│ - DDoS Protection                      │
│ - Rate Limiting                        │
└──────────────────┬─────────────────────┘
                   ↓
┌────────────────────────────────────────┐
│ Layer 2: Middleware                    │
│ - 認証チェック                          │
│ - トレースID付与                        │
│ - セキュリティヘッダー                   │
└──────────────────┬─────────────────────┘
                   ↓
┌────────────────────────────────────────┐
│ Layer 3: API Routes                    │
│ - Input Validation (Zod)               │
│ - 権限チェック                          │
└──────────────────┬─────────────────────┘
                   ↓
┌────────────────────────────────────────┐
│ Layer 4: Database (RLS)                │
│ - Row Level Security                   │
│ - Organization スコープ                 │
└────────────────────────────────────────┘
```

### セキュリティヘッダー

```typescript
// middleware.ts
headers: {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

## パフォーマンス最適化

### キャッシュ戦略

| リソース | TTL | 戦略 |
|---------|-----|------|
| Static Assets | 1年 | immutable |
| API Responses | 0 | no-cache |
| ページ | ISR対応 | revalidate |

### コード分割

```typescript
// 動的インポートでバンドルサイズ削減
const SurveyComponent = dynamic(
  () => import('@/components/survey/SurveyRunner'),
  { loading: () => <Skeleton /> }
);
```

## 監視・運用

```mermaid
graph TB
    subgraph "Monitoring Stack"
        Sentry[Sentry<br/>エラー追跡]
        Vercel[Vercel Analytics<br/>パフォーマンス]
        Supabase[Supabase Logs<br/>DBクエリ]
    end

    subgraph "Alerting"
        Error[エラー発生]
        Perf[パフォーマンス低下]
        DB[DBエラー]
    end

    Error --> Sentry
    Perf --> Vercel
    DB --> Supabase

    Sentry --> Slack[Slack通知]
    Vercel --> Slack
```

## 今後の拡張ポイント

1. **スケーラビリティ**
   - Edge Functions活用
   - DB接続プーリング
   - CDNキャッシュ強化

2. **機能拡張**
   - リアルタイム通知（Supabase Realtime）
   - 多言語対応（next-intl）
   - カスタムAIモデル統合

3. **運用改善**
   - Feature Flags（Vercel Edge Config）
   - A/Bテスト基盤
   - より詳細なログ分析

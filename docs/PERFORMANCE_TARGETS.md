# パフォーマンス目標

HY Assessment システムの性能目標と負荷テスト基準を定義します。

## 目標レベル

| レベル | 同時ユーザー | レスポンスタイム (p95) | エラー率 |
|--------|-------------|----------------------|---------|
| Bronze | 10 | 500ms | < 1% |
| Silver | 50 | 500ms | < 0.5% |
| Gold | 100 | 300ms | < 0.1% |

## エンドポイント別目標

### クリティカル（常時監視）

| エンドポイント | p50 | p95 | p99 | 備考 |
|---------------|-----|-----|-----|------|
| GET /api/health | 50ms | 100ms | 200ms | ヘルスチェック |
| GET /login | 200ms | 500ms | 1000ms | ログインページ |

### 標準

| エンドポイント | p50 | p95 | p99 | 備考 |
|---------------|-----|-----|-----|------|
| GET /admin | 300ms | 800ms | 1500ms | ダッシュボード |
| GET /admin/candidates | 400ms | 1000ms | 2000ms | 候補者一覧 |
| POST /api/analysis | 2000ms | 5000ms | 10000ms | AI分析（OpenAI依存） |

## 負荷テストシナリオ

### 1. Smoke Test（動作確認）
- **目的**: システムが正常に動作することを確認
- **負荷**: 1ユーザー × 2分間
- **実行頻度**: デプロイ後毎回

```bash
k6 run --env LOAD_PROFILE=smoke load-tests/scenarios/api-load.js
```

### 2. Load Test（通常負荷）
- **目的**: 通常運用時の性能を確認
- **負荷**: 10-20ユーザー × 5分間
- **実行頻度**: 週次

```bash
k6 run --env LOAD_PROFILE=load load-tests/scenarios/api-load.js
```

### 3. Stress Test（限界テスト）
- **目的**: システムの限界を把握
- **負荷**: 20-100ユーザー × 7分間
- **実行頻度**: リリース前

```bash
k6 run --env LOAD_PROFILE=stress load-tests/scenarios/api-load.js
```

### 4. Spike Test（急増テスト）
- **目的**: トラフィック急増への耐性を確認
- **負荷**: 5→100→5ユーザー
- **実行頻度**: 四半期

```bash
k6 run --env LOAD_PROFILE=spike load-tests/scenarios/api-load.js
```

### 5. Assessment Flow Test（ユーザーフロー）
- **目的**: 実際の利用パターンをシミュレート
- **負荷**: 5-10ユーザー × 5分間

```bash
k6 run load-tests/scenarios/assessment-flow.js
```

## 閾値定義

### レスポンスタイム
```javascript
http_req_duration: [
  'p(50)<200',   // 50%が200ms以内
  'p(95)<500',   // 95%が500ms以内
  'p(99)<1000',  // 99%が1000ms以内
]
```

### エラー率
```javascript
http_req_failed: ['rate<0.01']  // 失敗率1%未満
```

### スループット
```javascript
http_reqs: ['rate>10']  // 10リクエスト/秒以上
```

## 実行方法

### ローカル実行

```bash
# k6をインストール（macOS）
brew install k6

# スモークテスト実行
npm run test:load:smoke

# 負荷テスト実行
npm run test:load

# ストレステスト実行
npm run test:load:stress
```

### 環境変数

| 変数 | 説明 | デフォルト |
|------|------|----------|
| BASE_URL | テスト対象URL | http://localhost:3000 |
| LOAD_PROFILE | 負荷プロファイル (smoke/load/stress/spike/soak) | load |
| API_TOKEN | 認証トークン（認証が必要なテスト用） | - |

### 本番環境テスト

```bash
# 本番URLに対してスモークテストのみ実行
k6 run --env BASE_URL=https://hy-assessment.vercel.app \
       --env LOAD_PROFILE=smoke \
       load-tests/scenarios/api-load.js
```

> ⚠️ 本番環境への負荷テストは事前に関係者へ通知すること

## レポート出力

### HTML レポート

```bash
k6 run --out json=results.json load-tests/scenarios/api-load.js
# 別途可視化ツール（Grafana等）で確認
```

### コンソール出力例

```
✓ health check status is 200
✓ health check response time < 100ms
✓ login page status is 200
✓ login page loads under 2s

     checks.........................: 100.00% ✓ 1200      ✗ 0
     data_received..................: 2.5 MB  42 kB/s
     data_sent......................: 150 kB  2.5 kB/s
     http_req_duration..............: avg=45ms min=12ms max=234ms p(95)=98ms
     http_reqs......................: 1200    20/s
     iterations.....................: 300     5/s
```

## 改善アクション

### レスポンスタイムが目標超過時
1. ボトルネックAPI特定（APMツール使用）
2. データベースクエリ最適化
3. キャッシュ戦略見直し
4. Edge Functionへの移行検討

### エラー率が目標超過時
1. エラーログ分析
2. レート制限の調整
3. リトライロジック見直し
4. サーキットブレーカー閾値調整

---

更新履歴:
- 2024-12: 初版作成

---
name: perf
description: 非機能要件検証スキル。パフォーマンス・スケーラビリティ・可用性を定義・計測・検証
context: fork
arguments:
  - name: mode
    description: 実行モード（define/measure/verify）
    required: true
  - name: target
    description: 検証対象（ページURL/API/コンポーネント）
    required: false
  - name: requirements
    description: 非機能要件ファイルパス
    required: false
    default: "docs/requirements/nfr.md"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash(npm:*)
  - Bash(npx:*)
  - Bash(lighthouse:*)
  - WebFetch
  - Task
  - TodoWrite
---

# /perf - 非機能要件検証スキル

非機能要件（NFR: Non-Functional Requirements）を定義・計測・検証する。

## 実行モード

### mode=define - 非機能要件定義
```bash
/perf mode=define
# → 非機能要件テンプレートを生成
```

### mode=measure - 計測実行
```bash
/perf mode=measure target=/dashboard
# → Lighthouse + カスタム計測実行
```

### mode=verify - 要件検証
```bash
/perf mode=verify target=/api/users
# → 定義済み要件との比較検証
```

## 非機能要件カテゴリ

### 1. パフォーマンス (Performance)

| 指標 | 説明 | 目標例 |
|------|------|--------|
| **LCP** | Largest Contentful Paint | < 2.5s |
| **FID** | First Input Delay | < 100ms |
| **CLS** | Cumulative Layout Shift | < 0.1 |
| **TTFB** | Time to First Byte | < 200ms |
| **API Response** | APIレスポンス時間 | p95 < 500ms |

### 2. スケーラビリティ (Scalability)

| 指標 | 説明 | 目標例 |
|------|------|--------|
| **Concurrent Users** | 同時接続ユーザー数 | 1000+ |
| **RPS** | Requests Per Second | 500+ |
| **Data Volume** | 処理可能データ量 | 100万レコード |

### 3. 可用性 (Availability)

| 指標 | 説明 | 目標例 |
|------|------|--------|
| **Uptime** | 稼働率 | 99.9% |
| **MTTR** | 平均復旧時間 | < 1時間 |
| **MTBF** | 平均故障間隔 | > 30日 |

### 4. セキュリティ (Security)

| 指標 | 説明 | 目標例 |
|------|------|--------|
| **認証** | 認証方式 | OAuth 2.0 / JWT |
| **暗号化** | 通信・保存 | TLS 1.3 / AES-256 |
| **監査** | ログ保持期間 | 90日 |

## 非機能要件テンプレート

```markdown
# 非機能要件定義書 (NFR)

## 1. パフォーマンス要件

### Web Vitals
| 指標 | 目標 | 計測方法 |
|------|------|---------|
| LCP | < 2.5s | Lighthouse |
| FID | < 100ms | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| TTFB | < 200ms | WebPageTest |

### API パフォーマンス
| エンドポイント | p50 | p95 | p99 |
|---------------|-----|-----|-----|
| GET /api/users | 50ms | 200ms | 500ms |
| POST /api/orders | 100ms | 500ms | 1000ms |

### データベース
| クエリ種別 | 目標 |
|-----------|------|
| 単純SELECT | < 10ms |
| JOINクエリ | < 50ms |
| 集計クエリ | < 200ms |

## 2. スケーラビリティ要件

| 項目 | 現在 | 目標 | 上限 |
|------|------|------|------|
| 同時ユーザー | 100 | 1000 | 10000 |
| データ量 | 10万 | 100万 | 1000万 |
| ファイルサイズ | 10MB | 100MB | 1GB |

## 3. 可用性要件

| 項目 | 目標 | 許容ダウンタイム |
|------|------|----------------|
| 月間稼働率 | 99.9% | 43分/月 |
| 計画メンテ | 月1回 | 2時間以内 |
| 障害復旧 | MTTR | 1時間以内 |

## 4. セキュリティ要件

- [ ] OWASP Top 10 対策済み
- [ ] 通信暗号化 (TLS 1.3)
- [ ] 保存データ暗号化
- [ ] 監査ログ 90日保持
- [ ] 年1回 脆弱性診断
```

## 計測実行

### Lighthouse (Web Vitals)

```bash
npx lighthouse https://example.com/dashboard \
  --output=json \
  --output-path=./reports/lighthouse-dashboard.json
```

### API パフォーマンス

```typescript
// カスタム計測スクリプト
const results = await Promise.all(
  endpoints.map(async (endpoint) => {
    const times = [];
    for (let i = 0; i < 100; i++) {
      const start = performance.now();
      await fetch(endpoint);
      times.push(performance.now() - start);
    }
    return {
      endpoint,
      p50: percentile(times, 50),
      p95: percentile(times, 95),
      p99: percentile(times, 99),
    };
  })
);
```

## 検証レポート

```markdown
## 非機能要件検証レポート

### 検証日時
2026-01-08 23:00 JST

### サマリー
- **総項目数**: 15
- **合格**: 12 (80%)
- **不合格**: 2 (13%)
- **未計測**: 1 (7%)

### パフォーマンス検証結果

| 指標 | 目標 | 実測 | 判定 |
|------|------|------|------|
| LCP | < 2.5s | 1.8s | ✅ PASS |
| FID | < 100ms | 45ms | ✅ PASS |
| CLS | < 0.1 | 0.15 | ❌ FAIL |
| TTFB | < 200ms | 180ms | ✅ PASS |

### API パフォーマンス

| エンドポイント | 目標 p95 | 実測 p95 | 判定 |
|---------------|---------|---------|------|
| GET /api/users | 200ms | 150ms | ✅ PASS |
| POST /api/orders | 500ms | 620ms | ❌ FAIL |

### 不合格項目の改善提案

1. **CLS 0.15 → 目標 0.1**
   - 原因: 画像のwidth/height未指定
   - 対策: next/image で固定サイズ指定

2. **POST /api/orders p95 620ms → 目標 500ms**
   - 原因: DB書き込み待機
   - 対策: 非同期キュー導入検討

### 次回検証予定
- CLS改善後: 2026-01-15
- API最適化後: 2026-01-20
```

## CI統合

```yaml
# .github/workflows/perf.yml
name: Performance Check

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            https://preview-${{ github.event.pull_request.number }}.vercel.app/
          budgetPath: ./lighthouse-budget.json
```

# API リファレンス

## 概要

HY Assessment APIは、Next.js API Routesで実装されたRESTful APIです。

### ベースURL

```
開発: http://localhost:3000/api
本番: https://hy-assessment.vercel.app/api
```

### 認証

ほとんどのエンドポイントはSupabase Auth認証が必要です。

```typescript
// リクエストヘッダー
Authorization: Bearer <access_token>

// または Cookie（ブラウザから）
sb-access-token: <token>
```

### レスポンス形式

```typescript
// 成功
{
  "data": { ... },
  "message": "Success"
}

// エラー
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Assessment API

### 検査情報取得

```
GET /api/assessment/[token]
```

**認証**: 不要（tokenベース）

**レスポンス**:
```json
{
  "data": {
    "id": "uuid",
    "token": "abc123",
    "status": "pending",
    "template": {
      "name": "適性検査 v2.0",
      "questions": { ... }
    },
    "candidate": {
      "name": "田中 太郎",
      "email": "tanaka@example.com"
    },
    "expires_at": "2024-01-20T00:00:00Z"
  }
}
```

### 候補者情報更新

```
POST /api/assessment/[token]/candidate-info
```

**認証**: 不要（tokenベース）

**リクエスト**:
```json
{
  "name": "田中 太郎",
  "email": "tanaka@example.com"
}
```

**レスポンス**:
```json
{
  "data": {
    "status": "in_progress",
    "started_at": "2024-01-15T10:00:00Z"
  }
}
```

### 回答保存

```
POST /api/assessment/[token]/save
```

**認証**: 不要（tokenベース）

**リクエスト**:
```json
{
  "responses": [
    { "question_id": "q1", "answer": 4 },
    { "question_id": "q2", "answer": 3 }
  ],
  "progress": {
    "currentPage": 2,
    "answeredQuestions": 10
  }
}
```

**レスポンス**:
```json
{
  "data": {
    "saved": true,
    "progress": {
      "currentPage": 2,
      "answeredQuestions": 10,
      "lastSavedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### 検査完了

```
POST /api/assessment/[token]/complete
```

**認証**: 不要（tokenベース）

**リクエスト**:
```json
{
  "responses": [
    { "question_id": "q1", "answer": 4 },
    ...
  ]
}
```

**レスポンス**:
```json
{
  "data": {
    "status": "completed",
    "completed_at": "2024-01-15T11:00:00Z",
    "analysis_queued": true
  }
}
```

### 進捗確認

```
GET /api/assessment/[token]/progress
```

**認証**: 不要（tokenベース）

**レスポンス**:
```json
{
  "data": {
    "status": "in_progress",
    "progress": {
      "currentPage": 2,
      "answeredQuestions": 15,
      "totalQuestions": 50,
      "percentComplete": 30
    }
  }
}
```

---

## Analysis API

### 最新分析取得

```
GET /api/analysis/[assessmentId]
```

**認証**: 必須

**レスポンス**:
```json
{
  "data": {
    "id": "uuid",
    "assessment_id": "uuid",
    "scores": {
      "GOV": 72,
      "CONFLICT": 65,
      "REL": 78,
      "COG": 85,
      "WORK": 70,
      "VALID": 90
    },
    "enhanced_strengths": [
      {
        "title": "高い論理的思考力",
        "behavior": "複雑な問題を体系的に分解",
        "evidence": "Q15, Q23の回答パターン"
      }
    ],
    "enhanced_watchouts": [...],
    "risk_scenarios": [...],
    "interview_checks": [...],
    "summary": "...",
    "recommendation": "...",
    "version": 2,
    "is_latest": true,
    "analyzed_at": "2024-01-15T12:00:00Z"
  }
}
```

### 新規分析実行

```
POST /api/analysis/[assessmentId]
```

**認証**: 必須

**リクエスト**:
```json
{
  "model": "gpt-4",        // オプション
  "promptVersion": "2.0.0" // オプション
}
```

**レスポンス**:
```json
{
  "data": {
    "id": "uuid",
    "version": 3,
    "tokens_used": 1500,
    "analyzed_at": "2024-01-15T13:00:00Z"
  }
}
```

### 再分析

```
PUT /api/analysis/[assessmentId]
```

**認証**: 必須

**リクエスト**:
```json
{
  "model": "gpt-5.2",
  "temperature": 0.5,
  "customPrompt": "追加の指示..."
}
```

**レスポンス**:
```json
{
  "data": {
    "id": "uuid",
    "version": 4,
    "is_latest": true
  }
}
```

### 分析履歴

```
GET /api/analysis/[assessmentId]/history
```

**認証**: 必須

**レスポンス**:
```json
{
  "data": [
    {
      "id": "uuid",
      "version": 3,
      "model_version": "gpt-4",
      "tokens_used": 1500,
      "analyzed_at": "2024-01-15T13:00:00Z",
      "is_latest": true
    },
    {
      "id": "uuid",
      "version": 2,
      "model_version": "gpt-4",
      "tokens_used": 1400,
      "analyzed_at": "2024-01-15T12:00:00Z",
      "is_latest": false
    }
  ]
}
```

### 特定バージョン取得

```
GET /api/analysis/[assessmentId]/version/[version]
```

**認証**: 必須

### レポート共有

```
POST /api/analysis/[assessmentId]/share
```

**認証**: 必須

**リクエスト**:
```json
{
  "expiresInDays": 90,
  "sendEmail": true
}
```

**レスポンス**:
```json
{
  "data": {
    "report_token": "abc123xyz",
    "report_url": "https://hy-assessment.vercel.app/report/abc123xyz",
    "expires_at": "2024-04-15T00:00:00Z",
    "email_sent": true
  }
}
```

### PDF生成

```
GET /api/analysis/pdf/[assessmentId]
```

**認証**: 必須

**レスポンス**: `application/pdf`

---

## Settings API

### プロフィール取得

```
GET /api/settings/profile
```

**認証**: 必須

**レスポンス**:
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "山田 太郎",
    "role": "admin",
    "organization": {
      "id": "uuid",
      "name": "株式会社Example"
    }
  }
}
```

### プロフィール更新

```
PUT /api/settings/profile
```

**認証**: 必須

**リクエスト**:
```json
{
  "name": "山田 次郎"
}
```

### パスワード変更

```
POST /api/settings/password
```

**認証**: 必須

**リクエスト**:
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

---

## System API

### ヘルスチェック

```
GET /api/health
```

**認証**: 不要

**レスポンス**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "version": "1.0.0"
}
```

---

## エラーコード

| コード | 説明 |
|-------|------|
| `UNAUTHORIZED` | 認証が必要 |
| `FORBIDDEN` | 権限不足 |
| `NOT_FOUND` | リソースが見つからない |
| `VALIDATION_ERROR` | バリデーションエラー |
| `EXPIRED` | 検査期限切れ |
| `ALREADY_COMPLETED` | 既に完了済み |
| `RATE_LIMITED` | レート制限 |
| `INTERNAL_ERROR` | サーバーエラー |

## レート制限

| エンドポイント | 制限 |
|--------------|------|
| `/api/assessment/*` | 60回/分 |
| `/api/analysis/*` | 10回/分 |
| `/api/analysis/pdf/*` | 5回/分 |

## Webhook（将来実装）

```
POST <your-webhook-url>
```

**イベント**:
- `assessment.completed` - 検査完了時
- `analysis.completed` - 分析完了時

**ペイロード**:
```json
{
  "event": "analysis.completed",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "assessment_id": "uuid",
    "candidate_id": "uuid",
    "scores": { ... }
  }
}
```

---
name: security
description: セキュリティ監査スキル。OWASP Top 10チェック・依存関係脆弱性・機密情報検出を実行
context: fork
arguments:
  - name: target
    description: 監査対象（all/frontend/backend/deps）
    required: false
    default: "all"
  - name: depth
    description: 監査深度（quick/standard/deep）
    required: false
    default: "standard"
  - name: report
    description: レポート形式（summary/detailed/sarif）
    required: false
    default: "detailed"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash(npm audit:*)
  - Bash(npx:*)
  - Bash(git log:*)
  - Bash(git diff:*)
  - mcp__gpt5-devops__code_review
  - mcp__gpt5-devops__guard
  - WebSearch
  - Task
  - TodoWrite
  - Write
---

# /security - セキュリティ監査スキル

OWASP Top 10に基づくセキュリティ監査を実行。

## 監査カテゴリ

### target=all（デフォルト）
全領域を監査

### target=frontend
- XSS脆弱性
- CSRFトークン
- 機密情報のクライアント露出
- サードパーティスクリプト

### target=backend
- SQLインジェクション
- 認証・認可
- 入力バリデーション
- エラー情報露出

### target=deps
- 依存関係の脆弱性（npm audit）
- ライセンス問題
- 非推奨パッケージ

## 監査深度

| 深度 | 内容 | 所要時間 |
|------|------|---------|
| **quick** | 既知パターンのみ | ~30秒 |
| **standard** | + コード分析 | ~2分 |
| **deep** | + 依存関係、git履歴 | ~5分 |

## 実行フロー

```
1. 依存関係チェック
   npm audit --json
   ↓
2. 機密情報スキャン
   Grep: (password|secret|api_key|token)
   ↓
3. OWASP Top 10 チェック
   mcp__gpt5-devops__guard + code_review
   ↓
4. 設定ファイル監査
   .env, next.config.js, etc.
   ↓
5. レポート生成
```

## OWASP Top 10 チェックリスト

| # | 脆弱性 | チェック内容 |
|---|-------|-------------|
| A01 | Broken Access Control | 認可バイパス、IDOR |
| A02 | Cryptographic Failures | 弱い暗号、平文保存 |
| A03 | Injection | SQL/NoSQL/OS/LDAP |
| A04 | Insecure Design | 設計上の欠陥 |
| A05 | Security Misconfiguration | デフォルト設定、エラー露出 |
| A06 | Vulnerable Components | 脆弱な依存関係 |
| A07 | Auth Failures | 認証バイパス、セッション |
| A08 | Data Integrity | 安全でないデシリアライズ |
| A09 | Logging Failures | 監査ログ不足 |
| A10 | SSRF | サーバーサイドリクエスト偽造 |

## gpt5-devops統合

### セキュリティガード

```typescript
mcp__gpt5-devops__guard({
  planStep: "npm install new-package",
  repoFacts: "production deployment, handles PII"
})
```

**レスポンス:**
```json
{
  "riskScore": 65,
  "risks": ["未検証パッケージ", "PII処理あり"],
  "requiredChecks": ["npm audit", "ライセンス確認"],
  "proceed": false
}
```

### コードセキュリティレビュー

```typescript
mcp__gpt5-devops__code_review({
  filename: "src/app/api/users/route.ts",
  language: "typescript",
  content: "{ファイル内容}",
  policy: "OWASP Top 10準拠、入力検証必須"
})
```

## 機密情報検出パターン

```bash
# 検出パターン
password|passwd|pwd
secret|api_key|apikey|api-key
token|bearer|jwt
private_key|privatekey
credentials|auth
```

## 出力レポート

```markdown
## Security Audit Report

### Summary
- **Risk Level**: Medium
- **Critical**: 0
- **High**: 2
- **Medium**: 5
- **Low**: 8

### Critical Issues
なし

### High Priority
1. **A03 Injection Risk**
   - File: src/app/api/search/route.ts:34
   - Issue: SQLクエリにユーザー入力を直接使用
   - Fix: Prepared statementを使用

2. **A02 Cryptographic Failure**
   - File: src/lib/auth.ts:23
   - Issue: MD5でパスワードハッシュ
   - Fix: bcryptに変更

### Dependency Vulnerabilities
| Package | Severity | Fix |
|---------|----------|-----|
| lodash | High | 4.17.21 |
| axios | Medium | 1.6.0 |

### Recommendations
1. npm audit fix --force
2. 入力バリデーション追加
3. セキュリティヘッダー設定

### Next Steps
- [ ] Critical/High 修正
- [ ] 依存関係更新
- [ ] 再監査実行
```

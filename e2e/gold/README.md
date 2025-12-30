# Gold E2E Tests

**事業継続に必須のユースケーステスト（5本）**

---

## テスト一覧

| ファイル | GS-ID | ユースケース |
|----------|-------|-------------|
| `GS-HY-001-admin-login.spec.ts` | GS-HY-001 | 管理者ログイン |
| `GS-HY-002-candidate-registration.spec.ts` | GS-HY-002 | 候補者登録 |
| `GS-HY-003-assessment-completion.spec.ts` | GS-HY-003 | 検査回答→完了 |
| `GS-HY-004-analysis-result-view.spec.ts` | GS-HY-004 | 分析結果閲覧 |
| `GS-HY-005-report-sharing.spec.ts` | GS-HY-005 | レポート共有 |

---

## 実行方法

```bash
# Gold E2Eのみ実行
npx playwright test e2e/gold/

# 特定のGold Specを実行
npx playwright test e2e/gold/GS-HY-001-admin-login.spec.ts

# UIモードで実行
npx playwright test e2e/gold/ --ui
```

---

## 必要な環境変数

| 変数 | 説明 | 必須 |
|------|------|------|
| `E2E_TEST_EMAIL` | テスト管理者のメール | ✅ |
| `E2E_TEST_PASSWORD` | テスト管理者のパスワード | ✅ |
| `E2E_TEST_ASSESSMENT_TOKEN` | テスト用検査トークン | GS-003用 |
| `E2E_TEST_CANDIDATE_ID` | テスト用候補者ID | GS-004/005用 |
| `E2E_TEST_REPORT_TOKEN` | テスト用レポートトークン | GS-005用 |

---

## CI連携

- **Job**: `e2e-gold`
- **トリガー**: `dod:gold` ラベルPR、main push
- **失敗時**: マージ/デプロイブロック

---

## 仕様書

詳細なGiven/When/Then仕様は `docs/gold-specs/` を参照。

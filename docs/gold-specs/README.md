# Gold Spec 一覧

**hy-assessment Gold E2Eテスト仕様書**

---

## Gold採用ユースケース（6本）

| GS-ID | ユースケース | UC-ID | Playwright |
|-------|-------------|-------|------------|
| [GS-HY-001](./GS-HY-001-admin-login.md) | 管理者ログイン | UC-HY-ADMIN-AUTH-WEB | `e2e/gold/GS-HY-001-admin-login.spec.ts` |
| [GS-HY-002](./GS-HY-002-candidate-registration.md) | 候補者登録 | UC-HY-ADMIN-CANDIDATE-WEB | `e2e/gold/GS-HY-002-candidate-registration.spec.ts` |
| [GS-HY-003](./GS-HY-003-assessment-completion.md) | 検査回答→完了 | UC-HY-CAND-RESPONSE-WEB | `e2e/gold/GS-HY-003-assessment-completion.spec.ts` |
| [GS-HY-004](./GS-HY-004-analysis-result-view.md) | 分析結果閲覧 | UC-HY-ADMIN-VIEW-WEB | `e2e/gold/GS-HY-004-analysis-result-view.spec.ts` |
| [GS-HY-005](./GS-HY-005-report-sharing.md) | レポート共有 | UC-HY-ADMIN-SHARE-WEB | `e2e/gold/GS-HY-005-report-sharing.spec.ts` |
| [GS-HY-006](./GS-HY-006-candidate-report-view.md) | **候補者レポート閲覧** | UC-HY-CAND-REPORT-WEB | `e2e/gold/GS-HY-006-candidate-report-view.spec.ts` |

---

## 価値フロー

```
┌─────────────────────────────────────────────────────────────────┐
│                       双方向価値フロー                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [管理者価値提供]                                                │
│  認証 → 候補者登録 → 検査回答 → 分析閲覧 → レポート共有          │
│  GS-001   GS-002       GS-003      GS-004      GS-005           │
│                                                                 │
│  [候補者価値提供] ★NEW                                          │
│  検査回答 ───────────────────────→ 候補者レポート閲覧            │
│  GS-003                              GS-006                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### なぜGS-HY-006を追加したか

**システムが双方向に価値を提供していることを証明するため**

- GS-001〜GS-005: 管理者（企業）への価値提供を検証
- **GS-006**: 候補者への価値提供を検証

候補者は検査を受けるだけでなく、自己理解を深めるフィードバックレポートを受け取れる。
これにより、システムは「選考ツール」から「双方向価値創造プラットフォーム」へと昇華する。

---

## 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [usecase_universe.yml](../usecase_universe.yml) | ユースケース母集合（15UC） |
| [coverage_matrix.md](../coverage_matrix.md) | カバレッジマトリクス（MECE証明） |
| [value_flow_map.md](../value_flow_map.md) | 価値フローマップ |

---

## CI連携

- **Job名**: `e2e-gold`
- **トリガー**: `dod:gold` ラベル付きPR、mainブランチpush
- **失敗時**: マージ/デプロイブロック

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-30 | 初版作成（5仕様書） |
| 2025-12-30 | GS-HY-006追加（候補者レポート閲覧）- 双方向価値証明 |

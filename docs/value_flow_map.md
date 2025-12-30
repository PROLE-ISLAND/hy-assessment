# HY Assessment - 価値フローマップ

**価値が確定する瞬間（Outcome）を可視化**

---

## 主要価値フロー

```mermaid
flowchart LR
    subgraph 管理者フェーズ
        A[認証成功]:::gold --> B[候補者登録]:::gold
        B --> C[検査リンク発行]:::notgold
    end

    subgraph 候補者フェーズ
        C --> D[検査回答]:::gold
        D --> E[検査完了]:::notgold
    end

    subgraph システムフェーズ
        E --> F[AI分析生成]:::notgold
    end

    subgraph 価値提供フェーズ
        F --> G[分析結果閲覧]:::gold
        G --> H[レポート共有]:::gold
        G --> I[候補者比較]:::notgold
    end

    classDef gold fill:#ffd700,stroke:#b8860b,stroke-width:3px,color:#000
    classDef notgold fill:#e8e8e8,stroke:#999,stroke-width:1px,color:#666
```

---

## Gold E2Eテスト対象フロー

```mermaid
flowchart TB
    subgraph "Gold E2E: 5本"
        G1["GS-HY-001<br/>管理者ログイン"]:::gold
        G2["GS-HY-002<br/>候補者登録→リンク発行"]:::gold
        G3["GS-HY-003<br/>検査回答→完了"]:::gold
        G4["GS-HY-004<br/>分析結果閲覧"]:::gold
        G5["GS-HY-005<br/>レポート共有"]:::gold
    end

    G1 --> G2
    G2 -.-> G3
    G3 -.-> G4
    G4 --> G5

    classDef gold fill:#ffd700,stroke:#b8860b,stroke-width:3px,color:#000
```

---

## 詳細フロー（全Outcome）

```mermaid
flowchart TB
    START((開始)) --> AUTH

    subgraph "1. 認証"
        AUTH[認証成功<br/>UC-HY-ADMIN-AUTH-WEB]:::gold
    end

    AUTH --> REG

    subgraph "2. 候補者管理"
        REG[候補者登録<br/>UC-HY-ADMIN-CANDIDATE-WEB]:::gold
        REG --> LINK[検査リンク発行<br/>統合済み]:::notgold
    end

    LINK --> ASSESS

    subgraph "3. 検査実施"
        ASSESS[回答データ保存<br/>UC-HY-CAND-RESPONSE-WEB]:::gold
        ASSESS --> COMPLETE[検査完了<br/>統合済み]:::notgold
    end

    COMPLETE --> ANALYZE

    subgraph "4. AI分析"
        ANALYZE[AI分析生成<br/>バックグラウンド]:::system
    end

    ANALYZE --> VIEW

    subgraph "5. 価値提供"
        VIEW[分析結果閲覧<br/>UC-HY-ADMIN-VIEW-WEB]:::gold
        VIEW --> SHARE[レポート共有<br/>UC-HY-ADMIN-SHARE-WEB]:::gold
        VIEW --> COMPARE[候補者比較<br/>Silver]:::notgold
    end

    subgraph "設定（独立）"
        TEMPLATE[テンプレート管理<br/>Silver]:::notgold
    end

    SHARE --> END((採用判断))
    COMPARE --> END

    classDef gold fill:#ffd700,stroke:#b8860b,stroke-width:3px,color:#000
    classDef notgold fill:#e8e8e8,stroke:#999,stroke-width:1px,color:#666
    classDef system fill:#87ceeb,stroke:#4682b4,stroke-width:2px,color:#000
```

---

## フロー説明

### 価値チェーン

1. **認証** → システムへのアクセス権確保
2. **候補者登録** → 検査対象者の特定
3. **検査リンク発行** → 検査実施の準備完了
4. **検査回答** → 候補者からのデータ収集
5. **AI分析** → データから洞察生成
6. **分析閲覧** → 採用判断材料の提供
7. **レポート共有** → 意思決定者への価値配信

### Gold対象の選定理由

| Outcome | Gold理由 |
|---------|---------|
| 認証成功 | 全機能の入口。失敗するとサービス利用不可 |
| 候補者登録 | 事業フローの起点。候補者なしでは検査不可 |
| 回答保存 | 検査の本質。データなしでは分析不可 |
| 分析閲覧 | 価値提供の核心。採用判断の材料提供 |
| レポート共有 | 価値の外部配信。採用プロセスの完結 |

### Non-Gold理由

| Outcome | 理由 |
|---------|------|
| 検査リンク発行 | 候補者登録と統合テスト |
| 検査完了 | 回答保存と統合テスト |
| AI分析生成 | バックグラウンド処理。E2E不適 |
| テンプレート管理 | 初期設定のみ。Silver十分 |
| 候補者比較 | 付加価値機能。Silver十分 |

---

## トレーサビリティ

```mermaid
flowchart LR
    subgraph Universe
        UC1[UC-HY-ADMIN-AUTH-WEB]
        UC2[UC-HY-ADMIN-CANDIDATE-WEB]
        UC3[UC-HY-CAND-RESPONSE-WEB]
        UC4[UC-HY-ADMIN-VIEW-WEB]
        UC5[UC-HY-ADMIN-SHARE-WEB]
    end

    subgraph "Gold Spec"
        GS1[GS-HY-001]
        GS2[GS-HY-002]
        GS3[GS-HY-003]
        GS4[GS-HY-004]
        GS5[GS-HY-005]
    end

    subgraph Playwright
        PW1[admin-login.spec.ts]
        PW2[candidate-registration.spec.ts]
        PW3[assessment-completion.spec.ts]
        PW4[analysis-result-view.spec.ts]
        PW5[report-sharing.spec.ts]
    end

    subgraph CI
        CI1[e2e-gold job]
    end

    UC1 --> GS1 --> PW1 --> CI1
    UC2 --> GS2 --> PW2 --> CI1
    UC3 --> GS3 --> PW3 --> CI1
    UC4 --> GS4 --> PW4 --> CI1
    UC5 --> GS5 --> PW5 --> CI1
```

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-30 | 初版作成（価値フロー図、トレーサビリティ図） |

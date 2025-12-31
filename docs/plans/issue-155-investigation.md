# Issue #155 調査レポート

## 調査日時
2025-12-31

## 調査結果サマリー

**性格分析の拡張は既にPhase 2段階で設計・実装完了しており、新規質問項目の追加は限定的。課題は以下の3点：**

1. **質問文言の最適化**: 既存46問のLikert質問とSJT質問は認知バイアス・ダブルバレル質問を削減するため v1.1で改善済み。但し、性格分析専用の質問項目は存在しない。

2. **性格分析データの入力方法**: 性格分析（行動特性・ストレス耐性・EQ・価値観）は現在、既存ドメインスコア（GOV, CONFLICT, REL, COG, WORK）から **AIプロンプトで推論生成** する設計。データベースには専用列が予約済み（20251231 migration）だが、質問項目は未整備。

3. **拡張ポイント**: 性格分析精度向上には、以下の3アプローチが可能:
   - **Option A**: 既存46問+SJTの現データから推論を強化（プロンプト改善）
   - **Option B**: 専用質問項目15-20問を追加（テンプレート拡張）
   - **Option C**: ハイブリッド（既存+AIプロンプト最適化）

---

## 既存実装の分析

### 1. 質問構造と現在の質問体系

#### Likert質問（46問）
- **ドメイン映像（6ドメイン+妥当性）**:
  - GOV（ガバナンス適合）: 15問 → RULE, DUTY, INTEGRITY, CONF, ACCOUNT
  - CONFLICT（対立処理）: 6問 → VOICE, ESCAL
  - REL（対人態度）: 6問 → RESPECT, FEEDBACK
  - COG（認知のクセ）: 6問 → VICTIM, EMO
  - WORK（遂行スタイル）: 8問 → DILIG, DETAIL, LEARN, PLAN（カモフラ兼用）
  - VALID（妥当性）: 5問 → 社会的望ましさ・一貫性チェック

**質問文言の最適化状況**:
- v1.1で改善済み:
  - ダブルバレル質問を「納得できない指示でも、まずは従うことが多い」→ 「不満や疑問は、まず社内の正規ルートで相談する」に細分化
  - 行動ベース表現: 「意見が違っても、相手の話を最後まで聞くようにしている」（態度→具体的行動）
  - 防御性低下: 「スピード優先で確認は最低限でいいと思う」→ 率直な表現に

#### SJT質問（状況判断テスト）
- 現在8問（`gfd-gate-v1.ts`に記載）
- 複数選択肢、キー別スコアリング（各4点満点）
- カモフラ検出用（camouflage detection）

#### 性格分析用の専用質問
**現在は存在しない**。以下で補完:
- AIプロンプト(`personality-prompts.ts`)で6ドメインスコア→4観点(Behavioral/Stress/EQ/Values)に変換
- 根拠: ドメインスコア → personality特性への直接推論

### 2. 性格分析の現在の実装フロー

```
Response（46問+SJT）
  ↓
calculateScores() [scoring-engine.ts]
  → 6ドメインスコア算出
  → SJTスコア + 妥当性検証
  ↓
buildPersonalityPrompt() [personality-prompts.ts]
  → ドメインスコア + ポジション情報をプロンプトに整形
  ↓
OpenAI API (gpt-4o/gpt-5.2)
  → JSON解析 → 4観点の性格分析出力
  ↓
validateBehavioral/Stress/EQ/Values()
  → JSON解析エラー時はデフォルト値使用
  ↓
ai_analyses テーブル
  → personality_behavioral/stress/eq/values 列に保存
```

**制限事項**:
- ドメインスコアからの「推論」による精度限界（直接測定ではない）
- EQの「selfAwareness」など、Likertスケールでは測定不可な項目が存在

### 3. データベーススキーマ

#### 質問・回答テーブル
```sql
-- assessment_templates テーブル
{
  questions: SurveyJSDefinition  -- SurveyJS JSON形式の質問定義
  template_id: string
}

-- responses テーブル
{
  question_id: string      -- L01, L02, ... L46, SJT_1-8
  answer: unknown          -- 1-5 (Likert) または string (SJT選択肢)
  page_number: number
}

-- ai_analyses テーブル（20251231 migration済み）
{
  personality_behavioral: JSONB  -- {dominance, influence, steadiness, conscientiousness, traits[], overallType}
  personality_stress: JSONB      -- {pressureHandling, recoverySpeed, emotionalStability, adaptability, metrics[], overallScore, riskLevel}
  personality_eq: JSONB          -- {selfAwareness, selfManagement, socialAwareness, relationshipManagement, dimensions[], overallScore}
  personality_values: JSONB      -- {achievement, stability, growth, socialContribution, autonomy, dimensions[], primaryValue}
}
```

---

## 拡張ポイント

### A. 新規質問項目追加の場合（Option B）

#### 追加すべき領域（性格分析に直結するが、現在カバーされていない）

| 観点 | 現在の測定方法 | 不足する項目 | 推奨質問数 |
|------|:---|:---|:---:|
| **Behavioral** | GOV/CONFLICT/REL/COGドメインから推論 | DISC直接測定がない | 4-6問 |
| **Stress** | COG（認知のクセ）のみ推論 | プレッシャー対処・回復速度の直接測定がない | 4-5問 |
| **EQ** | REL（対人態度）から推論 | 自己認識・自己制御の直接測定がない | 5-6問 |
| **Values** | 全ドメインから推論 | 価値観の直接測定がない | 5-7問 |

**合計推奨**: 18-24問（新規パッケージ: 「Personality Assessment Module」）

#### 実装箇所

1. **テンプレート拡張**
   - `src/lib/templates/gfd-gate-v1.ts`
   - `PERSONALITY_ITEMS: ItemMetadata[]` 追加（新construct）
   - `PERSONALITY_QUESTIONS: SurveyJSQuestion[]` 追加
   - `GFD_GATE_V2_TEMPLATE` 作成または `gfd-gate-v1` バージョンアップ

2. **スコアリングエンジン**
   - `src/lib/analysis/scoring-engine.ts`
   - 新construct用の `calculatePersonalityDomainScores()` 追加
   - または既存ロジックに `personality` domain追加

3. **質問項目マッピング**
   - 新ItemMetadataの `construct` 種別:
     ```typescript
     type PersonalityConstruct =
       | 'DISC_DOMINANCE'   // 主導性
       | 'DISC_INFLUENCE'   // 影響力
       | 'DISC_STEADINESS'  // 安定性
       | 'RESILIENCE_PRESSURE'  // プレッシャー耐性
       | 'EQ_SELF_AWARE'    // 自己認識
       | 'VALUES_GROWTH'    // 成長志向
       // etc.
     ```

4. **プロンプト更新**
   - `personality-prompts.ts`
   - スコア算出ルールを新construct対応に更新
   - 例: `PERSONALITY_PRESSURE_001 → pressureHandling`

#### 破壊リスク

- **中**: テンプレートID管理（既存アセスメント→新テンプレートへの移行処理が必要）
- **低**: スコアリング（ITEM_METADATA追加は後方互換。既存L01-L46は変更なし）
- **低**: UI（SurveyJS定義追加のため、フォームボリューム増加～フロントエンド調整）

---

### B. プロンプト最適化による精度向上（Option A・推奨）

#### 改善ポイント

1. **DISC推論ルールの精緻化**
   - 現在: 単純マッピング（GOV→conscientiousness）
   - 改善: 複合指標 + 相互作用
   ```
   例）
   高GOV × 高CONFLICT → 高Dominance + 高Conscientiousness（リーダー型）
   低CONFLICT × 高REL → 低Dominance + 高Steadiness（協調型）
   ```

2. **EQ推論の心理学的根拠強化**
   - 現在: REL単体から推論
   - 改善: COG（認知のクセ）との組合せ
   ```
   selfAwareness = COG（感情認識）× REL（他者反応受容性）
   selfManagement = WORK（自制）× COG（感情制御）
   ```

3. **ストレス耐性の多角推論**
   - 現在: COG中心
   - 改善: GOV（責任感→回復力）+ WORK（計画性）も加味

4. **プロンプト内の根拠記述の充実**
   - 「なぜそのスコアか」の説明を追加
   - 例: `"selfAwareness: 65 (COG: 55%, REL: 70%の複合)"`

#### 実装変更箇所

- `src/lib/analysis/personality-prompts.ts`
  - `PERSONALITY_SYSTEM_PROMPT`: 推論ルール詳細化
  - `buildPersonalityPrompt()`: スコア説明の充実

#### 破壊リスク
- **極小**: プロンプト変更のみ。既存データベース・UI・スコアリングエンジンに影響なし

---

## 推奨実装アプローチ

### **フェーズ1: プロンプト最適化（短期・低リスク）** [推奨]

**PR分割案**:

| PR | 内容 | 規模 | 期間 |
|:---|:---|:---:|:---:|
| #155-1 | EQ推論ルール精緻化 + テスト | 150行 | 2-3h |
| #155-2 | ストレス耐性複合推論 | 100行 | 2h |
| #155-3 | Behavioral複合推論 + テスト | 120行 | 2-3h |
| **小計** | プロンプト改善 | **370行** | **6-8h** |

**テスト戦略**: 既存12アセスメント結果に対し、改善前後を比較

---

### **フェーズ2: 質問項目追加（中期・設計検討）**

**前提作業**:
1. **対象組織へのヒアリング**: 「Personality直接測定の必要性は何か？」
   - 既存推論では不足する項目の把握
   - 実際の採用判定との相関確認

2. **質問項目設計**:
   - 心理学ベース（Big Five等）の適用検討
   - 日本文化への適合性確認
   - キャリア開発（成長志向等）への接続

3. **パイロット**: 5-10組織での試験運用

**PR分割案（参考）**:

| PR | 内容 | 規模 |
|:---|:---|:---:|
| #155-P1 | 新construct定義 + ITEM_METADATA拡張 | 200行 |
| #155-P2 | SurveyJS質問定義（4-6問/観点） | 400行 |
| #155-P3 | スコアリングエンジン更新 | 150行 |
| #155-P4 | プロンプト更新 + テスト | 200行 |
| **小計** | 質問項目追加 | **950行** |

---

## 見積もり

### フェーズ1: プロンプト最適化

| 項目 | 工数 | 備考 |
|:---|:---:|:---|
| コード実装 | 6-8h | 3PR分割（各PR 150-200行） |
| テスト + 検証 | 4-6h | 既存データでの精度比較 |
| レビュー + 修正 | 2-3h | |
| **合計** | **12-17h** | **1-2日** |

### フェーズ2: 質問項目追加（見積のみ）

| 項目 | 工数 | 備考 |
|:---|:---:|:---|
| 設計 | 8-10h | 組織ヒアリング + 項目設計 |
| 実装 | 10-14h | 4PR分割 |
| パイロット運用 | 20-40h | 組織対応 + フィードバック吸収 |
| **合計** | **38-64h** | **1週間以上** |

---

## 破壊ポイント

### フェーズ1（プロンプト最適化）
| リスク | 影響度 | 対策 |
|:---|:---:|:---|
| 推論結果の変動 | 低 | 既存データでA/Bテスト |
| API料金増加 | 極小 | プロンプト長変更なし |

### フェーズ2（質問項目追加）
| リスク | 影響度 | 対策 |
|:---|:---:|:---|
| テンプレートID管理 | 中 | migration + 互換性層 |
| 検査時間増加 | 中 | 質問数最適化（+15分目標） |
| 既存データとの整合性 | 中 | 段階的移行 |

---

## 関連ドキュメント

- `src/lib/analysis/personality-prompts.ts` - 性格分析AIプロンプト
- `src/lib/templates/gfd-gate-v1.ts` - 質問項目・メタデータ定義
- `src/lib/analysis/scoring-engine.ts` - スコア計算エンジン
- `supabase/migrations/20251231000001_add_personality_analysis.sql` - DB スキーマ
- `src/types/database.ts` - PersonalityBehavioral等の型定義

---

## 推奨次ステップ

### 判断ポイント（Issue #155コメント確認事項）

1. **「性格分析精度向上の優先度は？」**
   - フェーズ1で十分か、フェーズ2まで必要か

2. **「組織からの具体的要望は？」**
   - 既存推論では何が不足しているか

3. **「テスト方法は？」**
   - 実際の採用判定との相関確認が可能か

### 実装優先度提案

- **即時実施**: フェーズ1（プロンプト最適化）
- **要検討**: フェーズ2（組織要件確認後に判断）

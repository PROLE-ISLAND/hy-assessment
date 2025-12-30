# Issue #148 性格検査拡張 - v0プロンプト集

## 概要

| セクション | コンポーネント | バリアント |
|-----------|---------------|-----------|
| 行動特性分析 | BehaviorStyleSection | radar / quadrant / list |
| ストレス耐性 | StressToleranceSection | gauge / bar / card |
| EQ（感情知性） | EQSection | radar / bar / grid |
| 価値観診断 | ValuesSection | radar / ranking / card |

---

## 1. 行動特性分析（DISC）

### v0プロンプト

```
Create a DISC behavioral style assessment card component for a Japanese HR assessment system.

**Context:**
This component will be added to an existing assessment report page that uses:
- shadcn/ui (Card, Badge, Progress)
- Recharts for charts
- Tailwind CSS with Glassmorphism design (bg-gradient-to-br, shadow-sm, rounded-xl)
- Japanese UI labels
- Color tokens: emerald-600 (≥70%), amber-600 (50-69%), rose-600 (<50%)

**Existing Design Pattern:**
The report already displays 6 work domains with:
- Horizontal bar chart for scores
- Radar chart for overview
- Color-coded badges (高/中/低)
- Glassmorphism card styling

**Requirements:**
1. Card with title "行動特性分析（DISC）" and description "行動スタイルの傾向と強み"
2. Four DISC factors with Japanese labels:
   - D: 主導型 (Dominance) - red color
   - I: 感化型 (Influence) - yellow color
   - S: 安定型 (Steadiness) - green color
   - C: 慎重型 (Conscientiousness) - blue color

3. Two-column layout on desktop:
   - Left: Quadrant chart showing DISC position
   - Right: Score bars with descriptions

4. Each factor shows:
   - Name with colored icon
   - Score percentage (0-100%)
   - Progress bar with color
   - Level badge (低/中/高)
   - Short description

5. Bottom section: "行動傾向サマリー"
   - Primary type badge (e.g., "主導型 × 慎重型")
   - AI-generated insight text

6. Style requirements:
   - Background: bg-gradient-to-br from-slate-50 to-white
   - Cards: shadow-sm, rounded-xl, border
   - Dark mode support

7. data-testid attributes:
   - behavior-style-section
   - behavior-quadrant-chart
   - behavior-score-d, behavior-score-i, behavior-score-s, behavior-score-c
   - behavior-summary

Mock data:
{
  dominance: 72,
  influence: 45,
  steadiness: 58,
  conscientiousness: 85
}
```

---

## 2. ストレス耐性

### v0プロンプト

```
Create a stress tolerance assessment card component for a Japanese HR assessment system.

**Context:**
Same design system as above (shadcn/ui, Recharts, Glassmorphism, Japanese labels).

**Requirements:**
1. Card with title "ストレス耐性" and description "ストレス反応パターンと回復力"

2. Three main metrics:
   - ストレス耐性スコア (0-100%)
   - 回復力 (Resilience) (0-100%)
   - ストレス反応タイプ (Fight/Flight/Freeze/Fawn)

3. Layout:
   - Top: Gauge chart for overall stress tolerance
   - Middle: Two progress bars (耐性/回復力)
   - Bottom: Stress response pattern radar

4. Stress response categories (5 areas):
   - 身体反応 (Physical)
   - 感情反応 (Emotional)
   - 認知反応 (Cognitive)
   - 行動反応 (Behavioral)
   - 対処行動 (Coping)

5. Risk indicators:
   - Green zone: 健全 (≥70%)
   - Yellow zone: 要注意 (50-69%)
   - Red zone: 要サポート (<50%)

6. data-testid attributes:
   - stress-tolerance-section
   - stress-gauge-chart
   - stress-resilience-bar
   - stress-response-radar
   - stress-risk-indicator

Mock data:
{
  tolerance: 68,
  resilience: 75,
  responseType: "Fight",
  physical: 70,
  emotional: 55,
  cognitive: 80,
  behavioral: 65,
  coping: 72
}
```

---

## 3. EQ（感情知性）

### v0プロンプト

```
Create an Emotional Intelligence (EQ) assessment card component for a Japanese HR assessment system.

**Context:**
Same design system (shadcn/ui, Recharts, Glassmorphism, Japanese labels).

**Requirements:**
1. Card with title "EQ（感情知性）" and description "感情の認識・管理・活用能力"

2. Four EQ domains (Goleman model):
   - 自己認識 (Self-Awareness) - purple
   - 自己管理 (Self-Management) - blue
   - 社会認識 (Social Awareness) - green
   - 関係管理 (Relationship Management) - orange

3. Layout options (3 variants):
   Variant A (Radar): Radar chart with 4 domains
   Variant B (Bar): Horizontal bar chart with descriptions
   Variant C (Grid): 2x2 grid cards with individual scores

4. Each domain shows:
   - Icon and name
   - Score (0-100%)
   - Sub-components breakdown
   - Level badge

5. Overall EQ score at top with interpretation

6. data-testid attributes:
   - eq-section
   - eq-overall-score
   - eq-radar-chart (variant A)
   - eq-bar-chart (variant B)
   - eq-grid (variant C)
   - eq-self-awareness, eq-self-management, eq-social-awareness, eq-relationship-management

Mock data:
{
  overall: 72,
  selfAwareness: 78,
  selfManagement: 65,
  socialAwareness: 80,
  relationshipManagement: 68
}
```

---

## 4. 価値観診断

### v0プロンプト

```
Create a work values assessment card component for a Japanese HR assessment system.

**Context:**
Same design system (shadcn/ui, Recharts, Glassmorphism, Japanese labels).

**Requirements:**
1. Card with title "価値観診断" and description "仕事価値観と組織文化適合度"

2. Eight work values (Schwartz-based):
   - 達成 (Achievement) - gold
   - 自律 (Autonomy) - blue
   - 安定 (Security) - green
   - 挑戦 (Stimulation) - orange
   - 協調 (Benevolence) - pink
   - 権力 (Power) - purple
   - 伝統 (Tradition) - brown
   - 普遍 (Universalism) - teal

3. Layout:
   - Top: Radar chart showing value profile
   - Middle: Top 3 values with descriptions
   - Bottom: Organization culture fit section (for future)

4. Value ranking display:
   - Ranked list with scores
   - Visual emphasis on top 3

5. data-testid attributes:
   - values-section
   - values-radar-chart
   - values-ranking
   - values-top-3
   - values-culture-fit

Mock data:
{
  achievement: 85,
  autonomy: 78,
  security: 45,
  stimulation: 72,
  benevolence: 68,
  power: 55,
  tradition: 40,
  universalism: 62
}
```

---

## 配置場所

```tsx
// src/components/analysis/AnalysisResultsClient.tsx

<TabsContent value="results" className="space-y-6">
  {/* 既存: Score Overview */}
  {/* 既存: Domain Detail */}
  {/* 既存: Strengths & Watchouts */}
  {/* 既存: Risk Scenarios */}
  {/* 既存: Interview Checks */}

  {/* ★ 新規: 性格検査拡張セクション */}
  <PersonalityExtensionSection
    behaviorStyle={currentAnalysis.behavior_style}
    stressTolerance={currentAnalysis.stress_tolerance}
    eq={currentAnalysis.eq_scores}
    values={currentAnalysis.work_values}
  />

  {/* 既存: Summary */}
  {/* 既存: Technical Info */}
</TabsContent>
```

---

## 次のステップ

1. [ ] v0.devで各プロンプトを実行
2. [ ] 生成されたコードを確認
3. [ ] Feature Flags定義を追加
4. [ ] バリアント切り替えコンポーネント実装
5. [ ] Preview URLでレビュー

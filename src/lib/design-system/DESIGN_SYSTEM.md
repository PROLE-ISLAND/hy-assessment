# デザインシステム v2.0

**重要**: UI構築時は必ず `@/lib/design-system` からインポートして使用すること。
ハードコードされた色値（`text-green-600`等）は使用禁止。

## クイックリファレンス

```typescript
// デザインシステムのインポート
import {
  // スコア色
  getScoreTextClass,     // スコアに応じたテキスト色クラス
  getScoreColor,         // スコアに応じたhex色
  scoreColors,           // スコア色定義

  // 状態色（success/warning/error/info）
  stateColors,           // 状態別色定義（light/dark対応）
  getStateColorClass,    // 状態に応じたクラス

  // 選択状態
  getSelectionClasses,   // 選択時のスタイルクラス

  // ドメイン色（6ドメイン）
  domainColors,          // GOV/CONFLICT/REL/COG/WORK/VALID
  getDomainColor,        // ドメインhex色取得

  // チャート
  chartColors,           // チャート用5色パレット
  chartTheme,            // Recharts統一テーマ
  ChartGradientDefs,     // SVGグラデーション定義
  getGradientUrl,        // グラデーションURL取得

  // ステータス
  candidateStatusConfig, // 候補者ステータス色
  assessmentStatusConfig,// 検査ステータス色
  judgmentConfig,        // 判定色（推奨/要検討/慎重検討）
} from '@/lib/design-system';
```

---

## 1. カラーパレット

### 1.1 チャート用5色パレット
すべてのチャート・グラフで統一使用。

| Index | 名前 | Hex | Tailwind | 用途 |
|-------|------|-----|----------|------|
| 0 | Indigo | `#818cf8` | `indigo-400` | プライマリ、GOVドメイン |
| 1 | Teal | `#2dd4bf` | `teal-400` | CONFLICTドメイン |
| 2 | Orange | `#fb923c` | `orange-400` | RELドメイン |
| 3 | Pink | `#f472b6` | `pink-400` | COGドメイン |
| 4 | Violet | `#a78bfa` | `violet-400` | WORKドメイン |

```typescript
// 使用例
import { chartColors, getChartColor } from '@/lib/design-system';
const color = chartColors[0].stroke;  // '#818cf8'
const color = getChartColor(2);       // '#fb923c'
```

### 1.2 スコア色（70%閾値ルール）
スコア表示は統一閾値を使用。

| レベル | 条件 | 色 | Tailwind |
|--------|------|-----|----------|
| excellent | ≥ 70% | Emerald | `emerald-600` |
| warning | ≥ 50% | Amber | `amber-600` |
| danger | < 50% | Rose | `rose-600` |

```typescript
// 使用例
import { getScoreTextClass, getScoreColor } from '@/lib/design-system';

<span className={getScoreTextClass(score)}>{score}%</span>
// 70以上: text-emerald-600
// 50-69: text-amber-600
// 50未満: text-rose-600

const hexColor = getScoreColor(85); // '#059669' (emerald-600)
```

### 1.3 状態色（Semantic Colors）
意味に基づいた色選択。必ずこれを使用すること。

| 状態 | 用途 | Tailwind | Hex |
|------|------|----------|-----|
| success | 成功、高評価、完了 | `emerald` | `#059669` |
| warning | 警告、要確認、期限近い | `amber` | `#d97706` |
| error | エラー、危険、低評価 | `rose` | `#e11d48` |
| info | 情報、進行中、分析待ち | `blue` | `#3b82f6` |
| neutral | 中立、未設定 | `gray` | `#6b7280` |

```typescript
// 使用例
import { stateColors } from '@/lib/design-system';

// ライトモード用クラス
<div className={stateColors.warning.light.text}>期限切れ間近</div>
// → text-amber-700

// ライト＋ダークモード対応
<div className={`${stateColors.success.light.text} ${stateColors.success.dark.text}`}>
  完了
</div>
// → text-emerald-700 dark:text-emerald-300

// 組み合わせ済みクラス
<Badge className={stateColors.error.combined}>エラー</Badge>
// → bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300
```

### 1.4 6ドメイン色マッピング
検査の6つのドメインに固有色を割り当て。

| ドメイン | 説明 | 色 | Hex |
|----------|------|-----|-----|
| GOV | ガバナンス適合 | Indigo | `#818cf8` |
| CONFLICT | 対立処理 | Teal | `#2dd4bf` |
| REL | 対人態度 | Orange | `#fb923c` |
| COG | 認知のクセ | Pink | `#f472b6` |
| WORK | 遂行スタイル | Violet | `#a78bfa` |
| VALID | 妥当性 | Slate | `#94a3b8` |

```typescript
import { domainColors, getDomainColor } from '@/lib/design-system';

const color = getDomainColor('GOV');  // '#818cf8'
const info = domainColors.CONFLICT;   // { hex, name, tailwind }
```

---

## 2. ステータス・バッジ色

### 2.1 候補者ステータス
```typescript
import { candidateStatusConfig } from '@/lib/design-system';

// candidateStatusConfig[status].className でクラス取得
<Badge className={candidateStatusConfig[candidate.status].className}>
  {candidateStatusConfig[candidate.status].label}
</Badge>
```

| ステータス | ラベル | 色 |
|------------|--------|-----|
| no_assessment | 検査未発行 | Gray |
| pending | 未開始 | Amber |
| in_progress | 回答中 | Blue |
| completed | 検査完了 | Emerald |
| analyzed | 分析済み | Emerald |

### 2.2 判定バッジ
```typescript
import { judgmentConfig } from '@/lib/design-system';

const config = judgmentConfig[judgment]; // 'recommended' | 'consider' | 'caution'
<Badge className={config.badgeClass}>
  <config.icon className={config.iconClass} />
  {config.label}
</Badge>
```

| 判定 | ラベル | 色 | アイコン |
|------|--------|-----|----------|
| recommended | 推奨 | Emerald | Star |
| consider | 要検討 | Amber | Search |
| caution | 慎重検討 | Rose | AlertTriangle |

---

## 3. チャート・グラフ設計

### 3.1 Glassmorphism スタイル
すべてのチャートにガラス効果を適用。

```tsx
// チャートコンテナ
<div className="glass-chart">
  <ResponsiveContainer>
    <BarChart>...</BarChart>
  </ResponsiveContainer>
</div>
```

### 3.2 SVGグラデーション
チャート内で使用するグラデーション定義。

```tsx
import { ChartGradientDefs, getGradientUrl } from '@/lib/design-system';

<svg>
  <defs>
    <ChartGradientDefs />
  </defs>
  <Bar fill={getGradientUrl('indigo')} />
</svg>
```

### 3.3 グロー効果
データの視認性向上のためのグロー。

```tsx
<defs>
  <filter id="glow">
    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
    <feMerge>
      <feMergeNode in="coloredBlur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
</defs>
<Bar filter="url(#glow)" />
```

### 3.4 Recharts統一設定
```typescript
import { chartTheme, chartConfig } from '@/lib/design-system';

// ツールチップ
<Tooltip
  contentStyle={chartTheme.tooltip.contentStyle}
  labelStyle={chartTheme.tooltip.labelStyle}
/>

// グリッド
<CartesianGrid
  stroke={chartTheme.grid.stroke}
  strokeDasharray={chartTheme.grid.strokeDasharray}
/>

// 軸
<XAxis
  tick={chartTheme.axis.tick}
  axisLine={false}
  tickLine={false}
/>
```

---

## 4. 透明度・グラデーション

### 4.1 グラデーション透明度プリセット
```typescript
import { gradientOpacity } from '@/lib/design-system';

// Soft (Radar/比較チャート): 柔らかいフェード
gradientOpacity.soft   // { start: 0.6, end: 0.15 }

// Strong (Bar/分布): 強めのコントラスト
gradientOpacity.strong // { start: 0.9, end: 0.6 }

// Area (エリアチャート): 3段階フェード
gradientOpacity.area   // { start: 0.5, mid: 0.25, end: 0.05 }
```

### 4.2 グロー強度
```typescript
import { glowIntensity } from '@/lib/design-system';

glowIntensity.soft   // 3 (Radar, 比較)
glowIntensity.normal // 2 (Bar, Area)
glowIntensity.strong // 4 (強調表示)
```

---

## 5. 選択・インタラクション

### 5.1 選択状態
```typescript
import { getSelectionClasses } from '@/lib/design-system';

<Card className={getSelectionClasses(isSelected)}>
  ...
</Card>
// 選択時: ring-2 ring-indigo-500 bg-indigo-50/50 border-indigo-300
//        dark:bg-indigo-900/20 dark:border-indigo-700
```

### 5.2 ホバー状態
```typescript
<div className="hover:bg-muted/50 transition-colors">
  ...
</div>
```

---

## 6. ダークモード対応

すべての色定義にダークモード対応クラスを含める。

```typescript
// 推奨パターン
<div className={`${stateColors.success.light.bg} ${stateColors.success.dark.bg}`}>
  <span className={`${stateColors.success.light.text} ${stateColors.success.dark.text}`}>
    成功
  </span>
</div>

// または combined を使用
<div className={stateColors.success.combined}>成功</div>
```

---

## 7. 禁止事項

### ハードコード色の禁止
以下のようなハードコードは禁止。必ずデザインシステムを使用すること。

```typescript
// ❌ 禁止
<span className="text-green-600">高評価</span>
<div className="bg-red-100 text-red-700">エラー</div>
<Card className="border-blue-200">情報</Card>

// ✅ 推奨
<span className={getScoreTextClass(score)}>高評価</span>
<div className={stateColors.error.combined}>エラー</div>
<Card className={stateColors.info.light.border}>情報</Card>
```

### 直接hex値の禁止（チャート以外）
```typescript
// ❌ 禁止
style={{ color: '#10b981' }}

// ✅ 推奨
style={{ color: scoreColors.excellent.hex }}
```

---

## 8. ファイル構成

```
src/lib/design-system/
├── index.ts              # メインエクスポート
├── DESIGN_SYSTEM.md      # このドキュメント
├── tokens/
│   ├── colors.ts         # チャート色、スコア色、ステータス色
│   ├── semantic-colors.ts # 状態色、ドメイン色、選択色
│   └── opacity.ts        # 透明度定数
└── charts/
    ├── theme.ts          # Recharts統一テーマ
    └── gradients.tsx     # SVGグラデーション定義
```

---

## 9. 新規コンポーネント作成時のチェックリスト

- [ ] 色は `@/lib/design-system` からインポート
- [ ] スコア表示には `getScoreTextClass()` 使用
- [ ] 状態表示には `stateColors` 使用
- [ ] ステータスバッジには `candidateStatusConfig` 使用
- [ ] 判定バッジには `judgmentConfig` 使用
- [ ] チャートには `chartTheme` と `ChartGradientDefs` 使用
- [ ] ダークモード対応クラスを含める
- [ ] ハードコード色が含まれていないか確認

---

## 10. 主要な閾値

| 項目 | 閾値 | 備考 |
|------|------|------|
| スコア優秀 | ≥ 70% | emerald |
| スコア警告 | ≥ 50% | amber |
| スコア危険 | < 50% | rose |
| COGドメイン | 逆転 | 高い＝危険 |
| VALIDドメイン | < 60% 危険 / < 80% 警告 | 閾値が異なる |

---

## 付録: CSS変数（globals.css）

```css
/* チャート色（oklch形式） */
--chart-1: oklch(0.55 0.22 270);  /* Indigo */
--chart-2: oklch(0.65 0.16 175);  /* Teal */
--chart-3: oklch(0.70 0.18 45);   /* Orange */
--chart-4: oklch(0.65 0.22 340);  /* Pink */
--chart-5: oklch(0.58 0.22 290);  /* Violet */

/* ボーダー半径 */
--radius: 0.625rem;  /* 10px */
```

---

*最終更新: 2024-12-23*

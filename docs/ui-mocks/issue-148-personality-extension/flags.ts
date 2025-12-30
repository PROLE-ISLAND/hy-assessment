/**
 * Issue #148 性格検査拡張 - Feature Flags定義
 *
 * 使用方法:
 * 1. npm install @vercel/flags
 * 2. このファイルの内容を lib/flags.ts に追加
 * 3. app/.well-known/vercel/flags/route.ts でエクスポート
 */

import { flag } from "@vercel/flags/next";

// ============================================================
// 行動特性分析（DISC）
// ============================================================

export const behaviorStyleDesignVariant = flag<"radar" | "quadrant" | "list">({
  key: "behavior-style-design-variant",
  defaultValue: "quadrant",
  description: "行動特性分析セクションのデザインバリアント",
  options: [
    { value: "radar", label: "レーダーチャート" },
    { value: "quadrant", label: "4象限チャート" },
    { value: "list", label: "リスト形式" },
  ],
});

export const behaviorStyleTestMode = flag<
  "normal" | "empty" | "error" | "loading"
>({
  key: "behavior-style-test-mode",
  defaultValue: "normal",
  description: "行動特性分析セクションのテストモード",
  options: [
    { value: "normal", label: "通常表示" },
    { value: "empty", label: "データなし" },
    { value: "error", label: "エラー状態" },
    { value: "loading", label: "ローディング" },
  ],
});

// ============================================================
// ストレス耐性
// ============================================================

export const stressToleranceDesignVariant = flag<"gauge" | "bar" | "card">({
  key: "stress-tolerance-design-variant",
  defaultValue: "gauge",
  description: "ストレス耐性セクションのデザインバリアント",
  options: [
    { value: "gauge", label: "ゲージチャート" },
    { value: "bar", label: "バーチャート" },
    { value: "card", label: "カード形式" },
  ],
});

export const stressToleranceTestMode = flag<
  "normal" | "empty" | "error" | "loading"
>({
  key: "stress-tolerance-test-mode",
  defaultValue: "normal",
  description: "ストレス耐性セクションのテストモード",
});

// ============================================================
// EQ（感情知性）
// ============================================================

export const eqDesignVariant = flag<"radar" | "bar" | "grid">({
  key: "eq-design-variant",
  defaultValue: "radar",
  description: "EQセクションのデザインバリアント",
  options: [
    { value: "radar", label: "レーダーチャート" },
    { value: "bar", label: "バーチャート" },
    { value: "grid", label: "グリッド形式" },
  ],
});

export const eqTestMode = flag<"normal" | "empty" | "error" | "loading">({
  key: "eq-test-mode",
  defaultValue: "normal",
  description: "EQセクションのテストモード",
});

// ============================================================
// 価値観診断
// ============================================================

export const valuesDesignVariant = flag<"radar" | "ranking" | "card">({
  key: "values-design-variant",
  defaultValue: "radar",
  description: "価値観診断セクションのデザインバリアント",
  options: [
    { value: "radar", label: "レーダーチャート" },
    { value: "ranking", label: "ランキング形式" },
    { value: "card", label: "カード形式" },
  ],
});

export const valuesTestMode = flag<"normal" | "empty" | "error" | "loading">({
  key: "values-test-mode",
  defaultValue: "normal",
  description: "価値観診断セクションのテストモード",
});

// ============================================================
// 性格検査拡張全体
// ============================================================

export const personalityExtensionEnabled = flag<boolean>({
  key: "personality-extension-enabled",
  defaultValue: false,
  description: "性格検査拡張機能の有効化",
});

export const personalityExtensionRollout = flag<number>({
  key: "personality-extension-rollout",
  defaultValue: 0,
  description: "性格検査拡張機能の公開率（0-100%）",
});

// ============================================================
// Toolbar用APIエンドポイント
// ============================================================

/**
 * app/.well-known/vercel/flags/route.ts に追加:
 *
 * import * as personalityFlags from '@/lib/flags/personality-extension';
 *
 * export async function GET() {
 *   return NextResponse.json({
 *     definitions: [
 *       ...Object.values(personalityFlags).map(f => f.definition),
 *     ],
 *   });
 * }
 */

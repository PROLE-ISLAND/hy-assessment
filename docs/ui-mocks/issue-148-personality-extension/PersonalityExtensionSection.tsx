"use client";

/**
 * Issue #148 性格検査拡張 - バリアント切り替えコンポーネント
 *
 * Feature Flagsで各セクションのデザインバリアントを切り替え可能。
 * Vercel Toolbarでリアルタイムにバリアント比較が可能。
 */

import {
  behaviorStyleDesignVariant,
  behaviorStyleTestMode,
  stressToleranceDesignVariant,
  stressToleranceTestMode,
  eqDesignVariant,
  eqTestMode,
  valuesDesignVariant,
  valuesTestMode,
  personalityExtensionEnabled,
} from "@/lib/flags/personality-extension";

// Types
interface BehaviorStyleData {
  dominance: number;
  influence: number;
  steadiness: number;
  conscientiousness: number;
}

interface StressToleranceData {
  tolerance: number;
  resilience: number;
  responseType: "Fight" | "Flight" | "Freeze" | "Fawn";
  physical: number;
  emotional: number;
  cognitive: number;
  behavioral: number;
  coping: number;
}

interface EQData {
  overall: number;
  selfAwareness: number;
  selfManagement: number;
  socialAwareness: number;
  relationshipManagement: number;
}

interface ValuesData {
  achievement: number;
  autonomy: number;
  security: number;
  stimulation: number;
  benevolence: number;
  power: number;
  tradition: number;
  universalism: number;
}

interface PersonalityExtensionProps {
  behaviorStyle?: BehaviorStyleData;
  stressTolerance?: StressToleranceData;
  eq?: EQData;
  values?: ValuesData;
}

// Placeholder components - replace with actual v0-generated components
function BehaviorStyleSkeleton() {
  return (
    <div
      className="animate-pulse bg-gray-200 rounded-xl h-64"
      data-testid="behavior-style-loading"
    />
  );
}

function BehaviorStyleError() {
  return (
    <div
      className="bg-red-50 border border-red-200 rounded-xl p-4"
      data-testid="behavior-style-error"
    >
      <p className="text-red-600">行動特性データの読み込みに失敗しました</p>
    </div>
  );
}

function BehaviorStyleEmpty() {
  return (
    <div
      className="bg-gray-50 border border-gray-200 rounded-xl p-4"
      data-testid="behavior-style-empty"
    >
      <p className="text-gray-500">行動特性データがありません</p>
    </div>
  );
}

// Variant components - replace with v0-generated
function BehaviorStyleRadar({ data }: { data: BehaviorStyleData }) {
  return (
    <div data-testid="behavior-style-radar">
      {/* v0で生成したレーダーチャートバリアント */}
      <p>Radar variant - D:{data.dominance} I:{data.influence} S:{data.steadiness} C:{data.conscientiousness}</p>
    </div>
  );
}

function BehaviorStyleQuadrant({ data }: { data: BehaviorStyleData }) {
  return (
    <div data-testid="behavior-style-quadrant">
      {/* v0で生成した4象限チャートバリアント */}
      <p>Quadrant variant</p>
    </div>
  );
}

function BehaviorStyleList({ data }: { data: BehaviorStyleData }) {
  return (
    <div data-testid="behavior-style-list">
      {/* v0で生成したリスト形式バリアント */}
      <p>List variant</p>
    </div>
  );
}

// ============================================================
// 行動特性分析セクション
// ============================================================

function BehaviorStyleSection({ data }: { data?: BehaviorStyleData }) {
  const variant = behaviorStyleDesignVariant();
  const testMode = behaviorStyleTestMode();

  // テストモード処理
  if (testMode === "loading") return <BehaviorStyleSkeleton />;
  if (testMode === "error") return <BehaviorStyleError />;
  if (testMode === "empty" || !data) return <BehaviorStyleEmpty />;

  // バリアント切り替え
  switch (variant) {
    case "radar":
      return <BehaviorStyleRadar data={data} />;
    case "quadrant":
      return <BehaviorStyleQuadrant data={data} />;
    case "list":
      return <BehaviorStyleList data={data} />;
    default:
      return <BehaviorStyleQuadrant data={data} />;
  }
}

// ============================================================
// ストレス耐性セクション（同様のパターン）
// ============================================================

function StressToleranceSection({ data }: { data?: StressToleranceData }) {
  const variant = stressToleranceDesignVariant();
  const testMode = stressToleranceTestMode();

  if (testMode === "loading")
    return (
      <div
        className="animate-pulse bg-gray-200 rounded-xl h-64"
        data-testid="stress-tolerance-loading"
      />
    );
  if (testMode === "error")
    return (
      <div data-testid="stress-tolerance-error">
        ストレス耐性データの読み込みに失敗しました
      </div>
    );
  if (testMode === "empty" || !data)
    return <div data-testid="stress-tolerance-empty">データなし</div>;

  return (
    <div data-testid={`stress-tolerance-${variant}`}>
      {/* v0で生成したコンポーネント */}
      <p>
        Stress Tolerance ({variant}): {data.tolerance}%
      </p>
    </div>
  );
}

// ============================================================
// EQセクション（同様のパターン）
// ============================================================

function EQSection({ data }: { data?: EQData }) {
  const variant = eqDesignVariant();
  const testMode = eqTestMode();

  if (testMode === "loading")
    return (
      <div
        className="animate-pulse bg-gray-200 rounded-xl h-64"
        data-testid="eq-loading"
      />
    );
  if (testMode === "error")
    return <div data-testid="eq-error">EQデータの読み込みに失敗しました</div>;
  if (testMode === "empty" || !data)
    return <div data-testid="eq-empty">データなし</div>;

  return (
    <div data-testid={`eq-${variant}`}>
      {/* v0で生成したコンポーネント */}
      <p>
        EQ ({variant}): Overall {data.overall}%
      </p>
    </div>
  );
}

// ============================================================
// 価値観診断セクション（同様のパターン）
// ============================================================

function ValuesSection({ data }: { data?: ValuesData }) {
  const variant = valuesDesignVariant();
  const testMode = valuesTestMode();

  if (testMode === "loading")
    return (
      <div
        className="animate-pulse bg-gray-200 rounded-xl h-64"
        data-testid="values-loading"
      />
    );
  if (testMode === "error")
    return (
      <div data-testid="values-error">
        価値観データの読み込みに失敗しました
      </div>
    );
  if (testMode === "empty" || !data)
    return <div data-testid="values-empty">データなし</div>;

  return (
    <div data-testid={`values-${variant}`}>
      {/* v0で生成したコンポーネント */}
      <p>Values ({variant})</p>
    </div>
  );
}

// ============================================================
// メインコンポーネント
// ============================================================

export function PersonalityExtensionSection({
  behaviorStyle,
  stressTolerance,
  eq,
  values,
}: PersonalityExtensionProps) {
  const isEnabled = personalityExtensionEnabled();

  if (!isEnabled) {
    return null;
  }

  return (
    <section className="space-y-6" data-testid="personality-extension-section">
      {/* 行動特性分析 */}
      <BehaviorStyleSection data={behaviorStyle} />

      {/* ストレス耐性 */}
      <StressToleranceSection data={stressTolerance} />

      {/* EQ */}
      <EQSection data={eq} />

      {/* 価値観診断 */}
      <ValuesSection data={values} />
    </section>
  );
}

export default PersonalityExtensionSection;

// =====================================================
// Personality Assessment Types
// Types for behavioral, stress, EQ, and values analysis
// =====================================================

/**
 * 行動特性分析データ（DISC理論ベース）
 */
export interface BehavioralTrait {
  name: string;
  score: number;
  description: string;
}

export interface BehavioralAnalysisData {
  dominance: number;      // 主導性（D）
  influence: number;      // 影響性（I）
  steadiness: number;     // 安定性（S）
  conscientiousness: number; // 慎重性（C）
  traits: BehavioralTrait[];
  overallType: string;    // 例: "DI型（推進者）"
}

/**
 * ストレス耐性分析データ
 */
export interface StressMetric {
  name: string;
  score: number;
  description: string;
}

export interface StressResilienceData {
  pressureHandling: number;   // プレッシャー対応
  recoverySpeed: number;      // 回復力
  emotionalStability: number; // 感情安定性
  adaptability: number;       // 適応力
  metrics: StressMetric[];
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * EQ（感情知性）分析データ
 */
export interface EQDimension {
  name: string;
  score: number;
  description: string;
}

export interface EQAnalysisData {
  selfAwareness: number;      // 自己認識
  selfManagement: number;     // 自己管理
  socialAwareness: number;    // 社会認識
  relationshipManagement: number; // 関係管理
  dimensions: EQDimension[];
  overallScore: number;
}

/**
 * 価値観分析データ
 */
export interface ValueDimension {
  name: string;
  score: number;
  description: string;
}

export interface ValuesAnalysisData {
  achievement: number;        // 達成志向
  stability: number;          // 安定志向
  growth: number;             // 成長志向
  socialContribution: number; // 社会貢献志向
  autonomy: number;           // 自律志向
  dimensions: ValueDimension[];
  primaryValue: string;       // 最も強い価値観
}

/**
 * 共通のカードProps
 */
export interface PersonalityCardProps<T> {
  data?: T | null;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

/**
 * スコアレベル判定
 */
export function getScoreLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

/**
 * スコアに応じたカラークラス
 */
export function getScoreColorClass(score: number): string {
  const level = getScoreLevel(score);
  switch (level) {
    case 'high':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'medium':
      return 'text-amber-600 dark:text-amber-400';
    case 'low':
      return 'text-rose-600 dark:text-rose-400';
  }
}

/**
 * スコアに応じたバッジカラークラス
 */
export function getScoreBadgeClass(score: number): string {
  const level = getScoreLevel(score);
  switch (level) {
    case 'high':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'medium':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'low':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
  }
}

/**
 * プログレスバーカラークラス
 */
export function getProgressColorClass(score: number): string {
  const level = getScoreLevel(score);
  switch (level) {
    case 'high':
      return 'bg-emerald-500';
    case 'medium':
      return 'bg-amber-500';
    case 'low':
      return 'bg-rose-500';
  }
}

/**
 * Big5 性格特性評価 - 型定義
 * Issue: #148
 *
 * Big Five personality traits model types for HR assessment system.
 */

/**
 * Big5 因子識別子
 */
export type Big5FactorId =
  | "openness"           // 開放性
  | "conscientiousness"  // 誠実性
  | "extraversion"       // 外向性
  | "agreeableness"      // 協調性
  | "neuroticism";       // 情緒安定性（神経症傾向の逆）

/**
 * スコアレベル
 */
export type ScoreLevel = "低" | "中" | "高";

/**
 * Big5 因子データ
 */
export interface Big5Factor {
  /** 因子ID */
  id: Big5FactorId;
  /** 日本語名 */
  name: string;
  /** 英語名 */
  nameEn: string;
  /** スコア (0-100) */
  score: number;
  /** レベル判定 */
  level: ScoreLevel;
  /** 説明文 */
  description: string;
  /** 表示用カラー (Tailwind class) */
  color: string;
}

/**
 * Big5 評価結果
 */
export interface Big5Result {
  /** 評価ID */
  id: string;
  /** 紐づくassessment_id */
  assessmentId: string;
  /** 5因子のスコア */
  factors: Big5Factor[];
  /** AI生成洞察 */
  insight: string;
  /** 職種プロファイルスコア（比較用） */
  jobProfileScores?: number[];
  /** 作成日時 */
  createdAt: Date;
}

/**
 * Big5 質問
 */
export interface Big5Question {
  /** 質問ID */
  id: string;
  /** 質問文 */
  text: string;
  /** 対象因子 */
  factorId: Big5FactorId;
  /** 逆転項目かどうか */
  isReversed: boolean;
  /** 表示順序 */
  order: number;
}

/**
 * Big5 回答
 */
export interface Big5Response {
  /** 回答ID */
  id: string;
  /** 質問ID */
  questionId: string;
  /** 回答値 (1-5 Likert scale) */
  value: 1 | 2 | 3 | 4 | 5;
  /** 回答日時 */
  answeredAt: Date;
}

/**
 * スコアレベル判定関数
 */
export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 75) return "高";
  if (score >= 40) return "中";
  return "低";
}

/**
 * Big5 因子のデフォルトメタデータ
 */
export const BIG5_FACTOR_META: Record<Big5FactorId, { name: string; nameEn: string; color: string }> = {
  openness: {
    name: "開放性",
    nameEn: "Openness",
    color: "bg-blue-500",
  },
  conscientiousness: {
    name: "誠実性",
    nameEn: "Conscientiousness",
    color: "bg-green-500",
  },
  extraversion: {
    name: "外向性",
    nameEn: "Extraversion",
    color: "bg-yellow-500",
  },
  agreeableness: {
    name: "協調性",
    nameEn: "Agreeableness",
    color: "bg-purple-500",
  },
  neuroticism: {
    name: "情緒安定性",
    nameEn: "Emotional Stability",
    color: "bg-orange-500",
  },
};

/**
 * Big5 因子の説明文テンプレート
 */
export const BIG5_DESCRIPTIONS: Record<Big5FactorId, Record<ScoreLevel, string>> = {
  openness: {
    高: "新しい経験や知識への好奇心が高く、創造的なアプローチを好みます",
    中: "新しいことへの適度な関心があり、状況に応じて柔軟に対応します",
    低: "慣れ親しんだ方法を好み、安定性を重視します",
  },
  conscientiousness: {
    高: "計画的で責任感が強く、目標達成に向けて着実に行動します",
    中: "状況に応じて計画性と柔軟性のバランスを取ります",
    低: "柔軟性を重視し、臨機応変な対応を得意とします",
  },
  extraversion: {
    高: "社交的でエネルギッシュ、人との交流から活力を得ます",
    中: "社交的な場面と一人の時間の両方を大切にします",
    低: "内省的で、一人での作業や少人数での交流を好みます",
  },
  agreeableness: {
    高: "チームワークを重視し、他者への配慮ができます",
    中: "協調性と自己主張のバランスを取ります",
    低: "独立性が高く、自分の意見を明確に持ちます",
  },
  neuroticism: {
    高: "感情の安定性が高く、プレッシャー下でも冷静に対応できます",
    中: "ストレス耐性は平均的で、適切なサポートがあれば安定します",
    低: "感情の起伏があり、ストレス管理のサポートが効果的です",
  },
};

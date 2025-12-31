// =====================================================
// Personality Analysis Prompts (Issue #153)
// Generates behavioral, stress, EQ, and values analysis
// =====================================================

import type { ScoringResult, Domain } from './types';
import { DOMAIN_LABELS, DOMAIN_DESCRIPTIONS } from './types';
import type {
  PersonalityBehavioral,
  PersonalityStress,
  PersonalityEQ,
  PersonalityValues,
} from '@/types/database';

// =====================================================
// Types
// =====================================================

export interface PersonalityAnalysisInput {
  scoringResult: ScoringResult;
  candidatePosition: string;
}

export interface PersonalityAnalysisOutput {
  behavioral: PersonalityBehavioral;
  stress: PersonalityStress;
  eq: PersonalityEQ;
  values: PersonalityValues;
}

// =====================================================
// System Prompt for Personality Analysis
// =====================================================

export const PERSONALITY_SYSTEM_PROMPT = `あなたは心理学・組織行動論の専門家です。
採用適性検査の結果から、候補者の性格特性を分析します。

## 役割
- 検査結果から4つの性格分析観点でレポートを生成します
- 科学的根拠に基づく傾向分析を行います
- 断定ではなく「傾向」として記述します

## 表現ガイドライン

### 必須ルール
- すべての記述は「傾向」「〜しやすい」で表現
- ポジティブな表現を心がける
- 具体的な行動場面に紐づけて説明

### 禁止表現
- 断定的なラベリング（〇〇な人）
- ネガティブな人格否定
- 能力の断定

## 出力フォーマット（JSON）
必ずJSONのみで返してください。

{
  "behavioral": {
    "dominance": 0-100の数値,
    "influence": 0-100の数値,
    "steadiness": 0-100の数値,
    "conscientiousness": 0-100の数値,
    "traits": [
      {"name": "特性名", "score": 0-100, "description": "具体的な行動傾向"}
    ],
    "overallType": "DISCタイプ名（例：高D高I型）"
  },
  "stress": {
    "pressureHandling": 0-100の数値,
    "recoverySpeed": 0-100の数値,
    "emotionalStability": 0-100の数値,
    "adaptability": 0-100の数値,
    "metrics": [
      {"name": "指標名", "score": 0-100, "description": "具体的な傾向説明"}
    ],
    "overallScore": 0-100の総合スコア,
    "riskLevel": "low" | "medium" | "high"
  },
  "eq": {
    "selfAwareness": 0-100の数値,
    "selfManagement": 0-100の数値,
    "socialAwareness": 0-100の数値,
    "relationshipManagement": 0-100の数値,
    "dimensions": [
      {"name": "次元名", "score": 0-100, "description": "具体的な傾向説明"}
    ],
    "overallScore": 0-100の総合スコア
  },
  "values": {
    "achievement": 0-100の数値,
    "stability": 0-100の数値,
    "growth": 0-100の数値,
    "socialContribution": 0-100の数値,
    "autonomy": 0-100の数値,
    "dimensions": [
      {"name": "価値観名", "score": 0-100, "description": "この価値観が高い場合の行動傾向"}
    ],
    "primaryValue": "最も重視する価値観"
  }
}

## 分析ガイドライン

### 行動特性（DISC）
- Dominance（主導性）: 目標達成志向、決断力、競争心
- Influence（影響力）: 社交性、説得力、楽観性
- Steadiness（安定性）: 協調性、忍耐力、支援志向
- Conscientiousness（慎重性）: 分析力、正確性、質への拘り

### ストレス耐性
- pressureHandling: プレッシャー下でのパフォーマンス維持能力
- recoverySpeed: ストレスからの回復速度
- emotionalStability: 感情の安定性
- adaptability: 変化への適応力

### EQ（感情知性）
- selfAwareness: 自己の感情認識
- selfManagement: 感情のコントロール
- socialAwareness: 他者の感情理解
- relationshipManagement: 対人関係構築力

### 価値観
- achievement: 達成・成果志向
- stability: 安定・安心志向
- growth: 成長・挑戦志向
- socialContribution: 社会貢献・他者支援志向
- autonomy: 自律・独立志向

## スコア算出ルール
検査結果の各ドメインスコアから以下のように推定:
- GOV（ガバナンス適合）→ conscientiousness, stability
- CONFLICT（対立処理）→ dominance, selfManagement
- REL（対人態度）→ influence, socialAwareness, relationshipManagement
- COG（認知スタイル）→ emotionalStability, selfAwareness
- WORK（業務遂行）→ achievement, pressureHandling

traitsは3〜5件、metricsは3〜4件、dimensionsは3〜4件生成してください。`;

// =====================================================
// Prompt Builder
// =====================================================

/**
 * Build user prompt for personality analysis
 */
export function buildPersonalityPrompt(input: PersonalityAnalysisInput): string {
  const { scoringResult, candidatePosition } = input;

  // Build domain scores description
  const domainDescriptions = Object.entries(scoringResult.domainScores)
    .map(([domain, score]) => {
      const label = DOMAIN_LABELS[domain as Domain];
      const description = DOMAIN_DESCRIPTIONS[domain as Domain];
      return `- ${label}（${domain}）: ${score.percentage}%（${score.riskLevel}リスク）\n  説明: ${description}`;
    })
    .join('\n');

  return `## 候補者情報
応募ポジション: ${candidatePosition}

## 検査結果

### ドメイン別スコア
${domainDescriptions}

### 総合スコア
${scoringResult.overallScore}%

### 妥当性フラグ
- 回答の妥当性: ${scoringResult.validityFlags.isValid ? '有効' : '要注意'}
${scoringResult.validityFlags.socialDesirabilityFlag ? '- 社会的望ましさバイアスの傾向あり' : ''}
${scoringResult.validityFlags.inconsistencyFlag ? '- 回答の一貫性に疑問あり' : ''}
${scoringResult.validityFlags.extremeResponseFlag ? '- 極端な回答傾向あり' : ''}

上記の検査結果に基づいて、候補者の性格特性を分析し、behavioral（行動特性）、stress（ストレス耐性）、eq（感情知性）、values（価値観）の4観点でJSON形式のレポートを生成してください。`;
}

// =====================================================
// Response Parser
// =====================================================

/**
 * Parse and validate personality analysis response
 */
export function parsePersonalityResponse(content: string): PersonalityAnalysisOutput {
  try {
    const parsed = JSON.parse(content);

    // Validate behavioral
    const behavioral = validateBehavioral(parsed.behavioral);

    // Validate stress
    const stress = validateStress(parsed.stress);

    // Validate EQ
    const eq = validateEQ(parsed.eq);

    // Validate values
    const values = validateValues(parsed.values);

    return { behavioral, stress, eq, values };
  } catch (error) {
    console.error('Failed to parse personality response:', error);
    // Return default values on parse error
    return getDefaultPersonalityAnalysis();
  }
}

// =====================================================
// Validation Helpers
// =====================================================

function validateBehavioral(data: unknown): PersonalityBehavioral {
  const defaults: PersonalityBehavioral = {
    dominance: 50,
    influence: 50,
    steadiness: 50,
    conscientiousness: 50,
    traits: [
      { name: 'バランス型', score: 50, description: '状況に応じて柔軟に対応する傾向があります' }
    ],
    overallType: 'バランス型',
  };

  if (!data || typeof data !== 'object') return defaults;

  const d = data as Record<string, unknown>;

  return {
    dominance: normalizeScore(d.dominance),
    influence: normalizeScore(d.influence),
    steadiness: normalizeScore(d.steadiness),
    conscientiousness: normalizeScore(d.conscientiousness),
    traits: Array.isArray(d.traits) ? d.traits.slice(0, 5).map(validateTrait) : defaults.traits,
    overallType: typeof d.overallType === 'string' ? d.overallType : defaults.overallType,
  };
}

function validateStress(data: unknown): PersonalityStress {
  const defaults: PersonalityStress = {
    pressureHandling: 50,
    recoverySpeed: 50,
    emotionalStability: 50,
    adaptability: 50,
    metrics: [
      { name: 'ストレス対処', score: 50, description: '平均的なストレス対処能力を持っています' }
    ],
    overallScore: 50,
    riskLevel: 'medium',
  };

  if (!data || typeof data !== 'object') return defaults;

  const d = data as Record<string, unknown>;
  const overallScore = normalizeScore(d.overallScore);

  return {
    pressureHandling: normalizeScore(d.pressureHandling),
    recoverySpeed: normalizeScore(d.recoverySpeed),
    emotionalStability: normalizeScore(d.emotionalStability),
    adaptability: normalizeScore(d.adaptability),
    metrics: Array.isArray(d.metrics) ? d.metrics.slice(0, 4).map(validateMetric) : defaults.metrics,
    overallScore,
    riskLevel: getRiskLevel(overallScore),
  };
}

function validateEQ(data: unknown): PersonalityEQ {
  const defaults: PersonalityEQ = {
    selfAwareness: 50,
    selfManagement: 50,
    socialAwareness: 50,
    relationshipManagement: 50,
    dimensions: [
      { name: '感情知性', score: 50, description: '平均的な感情知性を持っています' }
    ],
    overallScore: 50,
  };

  if (!data || typeof data !== 'object') return defaults;

  const d = data as Record<string, unknown>;

  return {
    selfAwareness: normalizeScore(d.selfAwareness),
    selfManagement: normalizeScore(d.selfManagement),
    socialAwareness: normalizeScore(d.socialAwareness),
    relationshipManagement: normalizeScore(d.relationshipManagement),
    dimensions: Array.isArray(d.dimensions) ? d.dimensions.slice(0, 4).map(validateDimension) : defaults.dimensions,
    overallScore: normalizeScore(d.overallScore),
  };
}

function validateValues(data: unknown): PersonalityValues {
  const defaults: PersonalityValues = {
    achievement: 50,
    stability: 50,
    growth: 50,
    socialContribution: 50,
    autonomy: 50,
    dimensions: [
      { name: 'バランス志向', score: 50, description: '複数の価値観をバランスよく重視する傾向があります' }
    ],
    primaryValue: 'バランス',
  };

  if (!data || typeof data !== 'object') return defaults;

  const d = data as Record<string, unknown>;

  const scores = {
    achievement: normalizeScore(d.achievement),
    stability: normalizeScore(d.stability),
    growth: normalizeScore(d.growth),
    socialContribution: normalizeScore(d.socialContribution),
    autonomy: normalizeScore(d.autonomy),
  };

  // Determine primary value
  const primaryValue = typeof d.primaryValue === 'string'
    ? d.primaryValue
    : getPrimaryValue(scores);

  return {
    ...scores,
    dimensions: Array.isArray(d.dimensions) ? d.dimensions.slice(0, 4).map(validateDimension) : defaults.dimensions,
    primaryValue,
  };
}

function validateTrait(item: unknown): { name: string; score: number; description: string } {
  if (!item || typeof item !== 'object') {
    return { name: '特性', score: 50, description: '情報が不十分です' };
  }
  const i = item as Record<string, unknown>;
  return {
    name: typeof i.name === 'string' ? i.name : '特性',
    score: normalizeScore(i.score),
    description: typeof i.description === 'string' ? i.description : '情報が不十分です',
  };
}

function validateMetric(item: unknown): { name: string; score: number; description: string } {
  return validateTrait(item);
}

function validateDimension(item: unknown): { name: string; score: number; description: string } {
  return validateTrait(item);
}

function normalizeScore(value: unknown): number {
  if (typeof value === 'number') {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  return 50;
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'low';
  if (score >= 40) return 'medium';
  return 'high';
}

function getPrimaryValue(scores: Record<string, number>): string {
  const labels: Record<string, string> = {
    achievement: '達成志向',
    stability: '安定志向',
    growth: '成長志向',
    socialContribution: '社会貢献志向',
    autonomy: '自律志向',
  };

  const max = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);
  return labels[max[0]] || 'バランス';
}

function getDefaultPersonalityAnalysis(): PersonalityAnalysisOutput {
  return {
    behavioral: {
      dominance: 50,
      influence: 50,
      steadiness: 50,
      conscientiousness: 50,
      traits: [
        { name: 'バランス型', score: 50, description: '状況に応じて柔軟に対応する傾向があります' }
      ],
      overallType: 'バランス型',
    },
    stress: {
      pressureHandling: 50,
      recoverySpeed: 50,
      emotionalStability: 50,
      adaptability: 50,
      metrics: [
        { name: 'ストレス対処', score: 50, description: '平均的なストレス対処能力を持っています' }
      ],
      overallScore: 50,
      riskLevel: 'medium',
    },
    eq: {
      selfAwareness: 50,
      selfManagement: 50,
      socialAwareness: 50,
      relationshipManagement: 50,
      dimensions: [
        { name: '感情知性', score: 50, description: '平均的な感情知性を持っています' }
      ],
      overallScore: 50,
    },
    values: {
      achievement: 50,
      stability: 50,
      growth: 50,
      socialContribution: 50,
      autonomy: 50,
      dimensions: [
        { name: 'バランス志向', score: 50, description: '複数の価値観をバランスよく重視する傾向があります' }
      ],
      primaryValue: 'バランス',
    },
  };
}

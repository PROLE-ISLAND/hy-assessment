// =====================================================
// Personality Assessment Scoring Logic (Issue #192)
// 4カテゴリのスコアリング計算
// =====================================================

import type { StressDetails, EQDetails } from '@/types/database';

// =====================================================
// Types
// =====================================================

export interface DiscScores {
  dominance: number; // 0-100
  influence: number; // 0-100
  steadiness: number; // 0-100
  conscientiousness: number; // 0-100
  primaryFactor: 'D' | 'I' | 'S' | 'C';
  profilePattern: string; // e.g., "DISC", "DISC", etc.
}

export interface StressScores {
  overall: number; // 0-100
  details: StressDetails;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface EQScores {
  overall: number; // 0-100
  details: EQDetails;
}

export interface ValuesScores {
  achievement: number; // 0-100
  stability: number; // 0-100
  growth: number; // 0-100
  socialContribution: number; // 0-100
  autonomy: number; // 0-100
  primary: string;
}

export interface PersonalityScores {
  disc: DiscScores;
  stress: StressScores;
  eq: EQScores;
  values: ValuesScores;
}

// Response types from assessment
export interface DiscResponse {
  questionId: string;
  selected: 'D' | 'I' | 'S' | 'C';
}

export interface LikertResponse {
  questionId: string;
  value: number; // 1-5 (strongly disagree to strongly agree)
}

export interface RankingResponse {
  questionId: string;
  rankings: string[]; // ordered array of options
}

export interface AssessmentResponses {
  disc: DiscResponse[];
  stress: LikertResponse[];
  eq: LikertResponse[];
  values: RankingResponse[];
}

// =====================================================
// DISC Scoring
// =====================================================

/**
 * Calculate DISC scores from forced-choice responses
 * Each question forces selection between D, I, S, C traits
 * @param responses - Array of 24 DISC responses
 * @returns DISC scores (0-100 for each factor)
 */
export function calculateDiscScores(responses: DiscResponse[]): DiscScores {
  // Count selections for each factor
  const counts = { D: 0, I: 0, S: 0, C: 0 };

  for (const response of responses) {
    counts[response.selected]++;
  }

  // Convert to 0-100 scale (24 questions total)
  // Max possible for any factor is 24
  const maxPossible = 24;
  const dominance = Math.round((counts.D / maxPossible) * 100);
  const influence = Math.round((counts.I / maxPossible) * 100);
  const steadiness = Math.round((counts.S / maxPossible) * 100);
  const conscientiousness = Math.round((counts.C / maxPossible) * 100);

  // Determine primary factor (highest score)
  const scores = [
    { factor: 'D' as const, score: dominance },
    { factor: 'I' as const, score: influence },
    { factor: 'S' as const, score: steadiness },
    { factor: 'C' as const, score: conscientiousness },
  ];

  scores.sort((a, b) => b.score - a.score);
  const primaryFactor = scores[0].factor;

  // Generate profile pattern (factors sorted by score)
  const profilePattern = scores.map((s) => s.factor).join('');

  return {
    dominance,
    influence,
    steadiness,
    conscientiousness,
    primaryFactor,
    profilePattern,
  };
}

// =====================================================
// Stress Tolerance Scoring
// =====================================================

// Question to sub-indicator mapping
const STRESS_QUESTION_MAP: Record<string, keyof StressDetails> = {
  stress_1: 'pressureHandling',
  stress_2: 'pressureHandling',
  stress_3: 'pressureHandling',
  stress_4: 'recoverySpeed',
  stress_5: 'recoverySpeed',
  stress_6: 'recoverySpeed',
  stress_7: 'emotionalStability',
  stress_8: 'emotionalStability',
  stress_9: 'emotionalStability',
  stress_10: 'adaptability',
  stress_11: 'adaptability',
  stress_12: 'adaptability',
};

/**
 * Calculate stress tolerance scores from Likert responses
 * @param responses - Array of 12 stress tolerance responses
 * @returns Stress scores with overall, details, and risk level
 */
export function calculateStressScores(responses: LikertResponse[]): StressScores {
  // Group responses by sub-indicator
  const grouped: Record<keyof StressDetails, number[]> = {
    pressureHandling: [],
    recoverySpeed: [],
    emotionalStability: [],
    adaptability: [],
  };

  for (const response of responses) {
    const indicator = STRESS_QUESTION_MAP[response.questionId];
    if (indicator) {
      grouped[indicator].push(response.value);
    }
  }

  // Calculate average for each indicator (1-5 scale -> 0-100)
  const convertToScore = (values: number[]): number => {
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    // Convert 1-5 to 0-100
    return Math.round(((avg - 1) / 4) * 100);
  };

  const details: StressDetails = {
    pressureHandling: convertToScore(grouped.pressureHandling),
    recoverySpeed: convertToScore(grouped.recoverySpeed),
    emotionalStability: convertToScore(grouped.emotionalStability),
    adaptability: convertToScore(grouped.adaptability),
  };

  // Calculate overall score (weighted average)
  const overall = Math.round(
    details.pressureHandling * 0.25 +
      details.recoverySpeed * 0.25 +
      details.emotionalStability * 0.25 +
      details.adaptability * 0.25
  );

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (overall >= 70) {
    riskLevel = 'low';
  } else if (overall >= 40) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return { overall, details, riskLevel };
}

// =====================================================
// EQ Scoring
// =====================================================

// Question to sub-indicator mapping
const EQ_QUESTION_MAP: Record<string, keyof EQDetails> = {
  eq_1: 'selfAwareness',
  eq_2: 'selfAwareness',
  eq_3: 'selfAwareness',
  eq_4: 'selfAwareness',
  eq_5: 'selfManagement',
  eq_6: 'selfManagement',
  eq_7: 'selfManagement',
  eq_8: 'selfManagement',
  eq_9: 'socialAwareness',
  eq_10: 'socialAwareness',
  eq_11: 'socialAwareness',
  eq_12: 'socialAwareness',
  eq_13: 'relationshipManagement',
  eq_14: 'relationshipManagement',
  eq_15: 'relationshipManagement',
  eq_16: 'relationshipManagement',
};

/**
 * Calculate EQ scores from Likert responses
 * @param responses - Array of 16 EQ responses
 * @returns EQ scores with overall and details
 */
export function calculateEqScores(responses: LikertResponse[]): EQScores {
  // Group responses by sub-indicator
  const grouped: Record<keyof EQDetails, number[]> = {
    selfAwareness: [],
    selfManagement: [],
    socialAwareness: [],
    relationshipManagement: [],
  };

  for (const response of responses) {
    const indicator = EQ_QUESTION_MAP[response.questionId];
    if (indicator) {
      grouped[indicator].push(response.value);
    }
  }

  // Calculate average for each indicator (1-5 scale -> 0-100)
  const convertToScore = (values: number[]): number => {
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.round(((avg - 1) / 4) * 100);
  };

  const details: EQDetails = {
    selfAwareness: convertToScore(grouped.selfAwareness),
    selfManagement: convertToScore(grouped.selfManagement),
    socialAwareness: convertToScore(grouped.socialAwareness),
    relationshipManagement: convertToScore(grouped.relationshipManagement),
  };

  // Calculate overall score (equal weight)
  const overall = Math.round(
    details.selfAwareness * 0.25 +
      details.selfManagement * 0.25 +
      details.socialAwareness * 0.25 +
      details.relationshipManagement * 0.25
  );

  return { overall, details };
}

// =====================================================
// Values Scoring
// =====================================================

// Value types for ranking (exported for validation)
export const VALUES_TYPES = ['achievement', 'stability', 'growth', 'socialContribution', 'autonomy'] as const;

/**
 * Calculate values scores from ranking responses
 * Each question asks to rank 5 values; higher rank = higher preference
 * @param responses - Array of 15 values responses (3 per value type)
 * @returns Values scores (0-100) and primary value
 */
export function calculateValuesScores(responses: RankingResponse[]): ValuesScores {
  // Initialize score accumulators
  const scores: Record<string, number> = {
    achievement: 0,
    stability: 0,
    growth: 0,
    socialContribution: 0,
    autonomy: 0,
  };

  // Count total rankings
  let totalQuestions = 0;

  for (const response of responses) {
    if (!response.rankings || response.rankings.length === 0) continue;

    totalQuestions++;

    // Convert rankings to scores
    // Position 0 (first choice) = 5 points, position 4 (last) = 1 point
    const rankingCount = response.rankings.length;
    for (let i = 0; i < response.rankings.length; i++) {
      const value = response.rankings[i];
      if (value in scores) {
        scores[value] += rankingCount - i;
      }
    }
  }

  // Normalize to 0-100 scale
  // Max possible per value = totalQuestions * 5 (always ranked first)
  // Min possible = totalQuestions * 1 (always ranked last)
  const maxPossible = totalQuestions * 5;
  const minPossible = totalQuestions * 1;
  const range = maxPossible - minPossible;

  const normalizeScore = (raw: number): number => {
    if (range === 0) return 50;
    return Math.round(((raw - minPossible) / range) * 100);
  };

  const achievement = normalizeScore(scores.achievement);
  const stability = normalizeScore(scores.stability);
  const growth = normalizeScore(scores.growth);
  const socialContribution = normalizeScore(scores.socialContribution);
  const autonomy = normalizeScore(scores.autonomy);

  // Determine primary value
  const valueScores = [
    { type: 'achievement', score: achievement },
    { type: 'stability', score: stability },
    { type: 'growth', score: growth },
    { type: 'socialContribution', score: socialContribution },
    { type: 'autonomy', score: autonomy },
  ];

  valueScores.sort((a, b) => b.score - a.score);
  const primary = valueScores[0].type;

  return {
    achievement,
    stability,
    growth,
    socialContribution,
    autonomy,
    primary,
  };
}

// =====================================================
// Combined Scoring
// =====================================================

/**
 * Calculate all personality scores from assessment responses
 * @param responses - All responses from the 67-question assessment
 * @returns Complete personality scores for all 4 categories
 */
export function calculatePersonalityScores(responses: AssessmentResponses): PersonalityScores {
  return {
    disc: calculateDiscScores(responses.disc),
    stress: calculateStressScores(responses.stress),
    eq: calculateEqScores(responses.eq),
    values: calculateValuesScores(responses.values),
  };
}

// =====================================================
// Validation Helpers
// =====================================================

/**
 * Validate DISC responses completeness
 * @param responses - DISC responses
 * @returns true if all 24 questions answered
 */
export function validateDiscResponses(responses: DiscResponse[]): boolean {
  if (responses.length !== 24) return false;

  const validFactors = new Set(['D', 'I', 'S', 'C']);
  return responses.every(
    (r) => r.questionId && r.questionId.startsWith('disc_') && validFactors.has(r.selected)
  );
}

/**
 * Validate stress responses completeness
 * @param responses - Stress responses
 * @returns true if all 12 questions answered
 */
export function validateStressResponses(responses: LikertResponse[]): boolean {
  if (responses.length !== 12) return false;

  return responses.every(
    (r) => r.questionId && r.questionId.startsWith('stress_') && r.value >= 1 && r.value <= 5
  );
}

/**
 * Validate EQ responses completeness
 * @param responses - EQ responses
 * @returns true if all 16 questions answered
 */
export function validateEqResponses(responses: LikertResponse[]): boolean {
  if (responses.length !== 16) return false;

  return responses.every(
    (r) => r.questionId && r.questionId.startsWith('eq_') && r.value >= 1 && r.value <= 5
  );
}

/**
 * Validate values responses completeness
 * @param responses - Values responses
 * @returns true if all 15 questions answered
 */
export function validateValuesResponses(responses: RankingResponse[]): boolean {
  if (responses.length !== 15) return false;

  return responses.every(
    (r) =>
      r.questionId &&
      r.questionId.startsWith('values_') &&
      r.rankings &&
      r.rankings.length === 5 &&
      new Set(r.rankings).size === 5
  );
}

/**
 * Validate all assessment responses
 * @param responses - Complete assessment responses
 * @returns true if all categories are valid
 */
export function validateAssessmentResponses(responses: AssessmentResponses): boolean {
  return (
    validateDiscResponses(responses.disc) &&
    validateStressResponses(responses.stress) &&
    validateEqResponses(responses.eq) &&
    validateValuesResponses(responses.values)
  );
}

// =====================================================
// Analysis Types
// =====================================================

// 6 Domain types for GFD-Gate v1
export type Domain = 'GOV' | 'CONFLICT' | 'REL' | 'COG' | 'WORK' | 'VALID';

export const DOMAIN_LABELS: Record<Domain, string> = {
  GOV: 'ガバナンス適合',
  CONFLICT: '対立処理',
  REL: '対人態度',
  COG: '認知スタイル',
  WORK: '業務遂行',
  VALID: '妥当性',
};

export const DOMAIN_DESCRIPTIONS: Record<Domain, string> = {
  GOV: 'ルール遵守、責任感、誠実性への適合度',
  CONFLICT: '意見表明と適切なエスカレーションの傾向',
  REL: '他者への敬意とフィードバック受容性',
  COG: '被害者意識や感情的反応の傾向',
  WORK: '勤勉さ、計画性、学習意欲',
  VALID: '回答の一貫性と信頼性',
};

// Score result for a single domain
export interface DomainScore {
  domain: Domain;
  label: string;
  rawScore: number;      // Sum of scores
  maxScore: number;      // Maximum possible score
  percentage: number;    // 0-100
  itemCount: number;     // Number of items in this domain
  riskLevel: 'low' | 'medium' | 'high';
}

// Complete scoring result
export interface ScoringResult {
  domainScores: Record<Domain, DomainScore>;
  overallScore: number;  // 0-100
  validityFlags: ValidityFlags;
  sjtScores: SJTScores;
  timestamp: string;
}

// Validity check flags
export interface ValidityFlags {
  isValid: boolean;
  socialDesirabilityFlag: boolean;  // Too many "perfect" answers
  inconsistencyFlag: boolean;        // Contradictory answers
  extremeResponseFlag: boolean;      // All 1s or all 5s
  details: string[];
}

// SJT (Situational Judgment Test) scores
export interface SJTScores {
  totalScore: number;
  maxScore: number;
  percentage: number;
  itemScores: Record<string, number>;
}

// Response data format from database
export interface ResponseData {
  question_id: string;
  answer: unknown;
}

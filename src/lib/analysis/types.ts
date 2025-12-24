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

// =====================================================
// Enhanced AI Analysis Types (v2 - Gate強化版)
// =====================================================

// 強み（evidence付き）- 社内版
export interface EnhancedStrength {
  title: string;         // 短い見出し
  behavior: string;      // 具体的行動傾向 (50-100文字)
  evidence: string;      // 根拠（どのドメイン傾向に基づくか）
}

// 注意点（開示耐性のある表現）- 社内版
export interface EnhancedWatchout {
  title: string;         // 短い見出し
  risk: string;          // 業務上のリスク（断定しない、50-100文字）
  evidence: string;      // 根拠（どのドメイン傾向に基づくか）
}

// リスクシナリオ（事故防止が目的）
export interface RiskScenario {
  condition: string;     // トリガー条件（どんな状況で）
  symptom: string;       // 現れる症状（何が起きるか）
  impact: string;        // 業務への影響（どう困るか）
  prevention: string;    // 予防策・対処法
  risk_environment: string[]; // 摩擦が出やすい環境
}

// 面接確認項目
export interface InterviewCheck {
  question: string;      // 質問文
  intent: string;        // 確認意図
  look_for: string;      // 回答で見るべきポイント
}

// 社内版AI分析出力（v2 - Enhanced）
export interface EnhancedAIAnalysisOutput {
  // 強み（evidence付き）3-5件
  strengths: EnhancedStrength[];

  // 注意点（開示耐性のある表現）3-5件
  watchouts: EnhancedWatchout[];

  // リスクシナリオ（事故防止が目的）2-4件
  risk_scenarios: RiskScenario[];

  // 面接確認項目 3-6問
  interview_checks: InterviewCheck[];

  // 総合所見 200-300文字
  summary: string;

  // 採用判断への推奨（面接での検証必須点を明確に）100-200文字
  recommendation: string;
}

// =====================================================
// Candidate Report Types (候補者版)
// =====================================================

// 候補者版 強み
export interface CandidateStrength {
  title: string;
  description: string;   // 具体的な行動傾向（ポジティブに表現）
}

// 候補者版レポート出力
export interface CandidateReportOutput {
  // 強み（行動ベース）3-5件
  strengths: CandidateStrength[];

  // 活かし方のヒント 3件
  leverage_tips: string[];

  // ストレス時の工夫 2件
  stress_tips: string[];

  // 大事にしやすい価値観タグ 3件
  values_tags: string[];

  // 注意書き（この結果の使い方に関する注意）80-140文字
  note: string;
}

// =====================================================
// Legacy AI Analysis Types (v1 - 後方互換用)
// =====================================================

// v1 出力形式（既存データとの互換性維持）
export interface LegacyAIAnalysisOutput {
  strengths: string[];
  weaknesses: string[];
  summary: string;
  recommendation: string;
}

// =====================================================
// Analysis Module Exports
// =====================================================

// Types
export type {
  Domain,
  DomainScore,
  ScoringResult,
  ValidityFlags,
  SJTScores,
  ResponseData,
} from './types';

export { DOMAIN_LABELS, DOMAIN_DESCRIPTIONS } from './types';

// Scoring Engine
export { calculateScores, getRiskSummary, getScoreDescription } from './scoring-engine';

// Prompts (types only - for client compatibility)
export {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  parseAnalysisResponse,
  type AnalysisInput,
  type AIAnalysisOutput,
} from './prompts';

// Note: AI Analyzer exports are NOT included here to avoid server code
// being traced to client components. Import directly from './ai-analyzer'
// in server-side code (API routes, Inngest functions, etc.)

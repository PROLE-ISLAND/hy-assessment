// =====================================================
// AI Analyzer - OpenAI API Integration (v2 Enhanced)
// Supports dynamic prompt loading from database
// Generates both internal (enhanced) and candidate reports
// =====================================================

import OpenAI from 'openai';
import { calculateScores } from './scoring-engine';
import {
  ANALYSIS_SYSTEM_PROMPT,
  LEGACY_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  parseAnalysisResponse,
  parseEnhancedAnalysisResponse,
  type AnalysisInput,
} from './prompts';
import {
  CANDIDATE_SYSTEM_PROMPT,
  buildCandidatePrompt,
  parseCandidateResponse,
  type CandidateAnalysisInput,
} from './candidate-prompts';
import type {
  ScoringResult,
  ResponseData,
  LegacyAIAnalysisOutput,
  EnhancedAIAnalysisOutput,
  CandidateReportOutput,
} from './types';
import type { PromptTemplate } from '@/types/database';

// Re-export legacy type for backward compatibility
export type AIAnalysisOutput = LegacyAIAnalysisOutput;

// =====================================================
// Default Configuration (fallback when no DB prompt)
// =====================================================

const DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL || 'gpt-5.2';
const DEFAULT_PROMPT_VERSION = 'v2.0.0';
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TEMPERATURE = 0.3;

// =====================================================
// Types
// =====================================================

export interface AnalyzeAssessmentInput {
  responses: ResponseData[];
  candidatePosition: string;
  organizationId?: string; // Optional: for org-specific prompts
  // Optional: for re-analysis with specific settings
  promptTemplateId?: string; // Use specific prompt template
  modelOverride?: string; // Override model
}

export interface AnalyzeAssessmentResult {
  scoringResult: ScoringResult;
  aiAnalysis: LegacyAIAnalysisOutput;
  modelVersion: string;
  promptVersion: string;
  tokensUsed: number;
}

// Enhanced result type (v2)
export interface AnalyzeAssessmentEnhancedResult {
  scoringResult: ScoringResult;
  aiAnalysis: EnhancedAIAnalysisOutput;
  modelVersion: string;
  promptVersion: string;
  tokensUsed: number;
}

// Full result type (both internal and candidate reports)
export interface AnalyzeAssessmentFullResult {
  scoringResult: ScoringResult;
  // Internal report (enhanced)
  internalReport: EnhancedAIAnalysisOutput;
  // Candidate report (disclosure-ready)
  candidateReport: CandidateReportOutput;
  modelVersion: string;
  promptVersion: string;
  totalTokensUsed: number;
}

interface PromptConfig {
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  version: string;
}

// =====================================================
// Prompt Loading
// =====================================================

interface LoadPromptOptions {
  organizationId?: string;
  promptTemplateId?: string; // Load specific template by ID
  modelOverride?: string; // Override the model
  promptKey?: 'system' | 'candidate'; // Which prompt to load
}

/**
 * Load active system prompt from database
 * Falls back to hardcoded prompt if not found
 */
async function loadActivePrompt(options: LoadPromptOptions = {}): Promise<PromptConfig> {
  const { organizationId, promptTemplateId, modelOverride, promptKey = 'system' } = options;

  // Determine default prompt based on key
  const defaultSystemPrompt = promptKey === 'candidate'
    ? CANDIDATE_SYSTEM_PROMPT
    : ANALYSIS_SYSTEM_PROMPT;

  try {
    // Dynamic import to avoid circular dependencies
    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminSupabase = createAdminClient();

    // If specific template ID is provided, load that one
    if (promptTemplateId) {
      const { data: specificPrompt } = await adminSupabase
        .from('prompt_templates')
        .select('*')
        .eq('id', promptTemplateId)
        .is('deleted_at', null)
        .single<PromptTemplate>();

      if (specificPrompt) {
        return {
          systemPrompt: specificPrompt.content,
          model: modelOverride || specificPrompt.model,
          temperature: specificPrompt.temperature,
          maxTokens: specificPrompt.max_tokens,
          version: specificPrompt.version,
        };
      }
    }

    // Try to find org-specific active prompt first, then system-wide
    let query = adminSupabase
      .from('prompt_templates')
      .select('*')
      .eq('key', promptKey)
      .eq('is_active', true)
      .is('deleted_at', null);

    if (organizationId) {
      // First try org-specific
      const { data: orgPrompt } = await query
        .eq('organization_id', organizationId)
        .single<PromptTemplate>();

      if (orgPrompt) {
        return {
          systemPrompt: orgPrompt.content,
          model: modelOverride || orgPrompt.model,
          temperature: orgPrompt.temperature,
          maxTokens: orgPrompt.max_tokens,
          version: orgPrompt.version,
        };
      }
    }

    // Fall back to system-wide prompt
    const { data: systemPrompt } = await adminSupabase
      .from('prompt_templates')
      .select('*')
      .eq('key', promptKey)
      .eq('is_active', true)
      .is('organization_id', null)
      .is('deleted_at', null)
      .single<PromptTemplate>();

    if (systemPrompt) {
      return {
        systemPrompt: systemPrompt.content,
        model: modelOverride || systemPrompt.model,
        temperature: systemPrompt.temperature,
        maxTokens: systemPrompt.max_tokens,
        version: systemPrompt.version,
      };
    }
  } catch (error) {
    console.warn('Failed to load prompt from database, using fallback:', error);
  }

  // Fallback to hardcoded prompt
  return {
    systemPrompt: defaultSystemPrompt,
    model: modelOverride || DEFAULT_MODEL,
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS,
    version: DEFAULT_PROMPT_VERSION,
  };
}

// =====================================================
// Main Analysis Functions
// =====================================================

/**
 * Analyze assessment (Legacy v1 - backward compatible)
 * Uses legacy prompt format for existing data compatibility
 */
export async function analyzeAssessment(
  input: AnalyzeAssessmentInput
): Promise<AnalyzeAssessmentResult> {
  const { responses, candidatePosition, organizationId, promptTemplateId, modelOverride } = input;

  // 1. Calculate scores using scoring engine
  const scoringResult = calculateScores(responses);

  // 2. Extract SJT answers
  const sjtAnswers: Record<string, string> = {};
  for (const r of responses) {
    if (r.question_id.startsWith('SJT') && typeof r.answer === 'string') {
      sjtAnswers[r.question_id] = r.answer;
    }
  }

  // 3. Extract free text answer
  const freeTextResponse = responses.find((r) => r.question_id === 'T01');
  const freeTextAnswer =
    typeof freeTextResponse?.answer === 'string' ? freeTextResponse.answer : null;

  // 4. Build analysis input
  const analysisInput: AnalysisInput = {
    scoringResult,
    sjtAnswers,
    freeTextAnswer,
    candidatePosition,
  };

  // 5. Load active prompt from database (use legacy system prompt)
  const promptConfig = await loadActivePrompt({
    organizationId,
    promptTemplateId,
    modelOverride,
    promptKey: 'system',
  });

  // Use legacy prompt if no custom prompt loaded from DB
  if (promptConfig.systemPrompt === ANALYSIS_SYSTEM_PROMPT) {
    promptConfig.systemPrompt = LEGACY_SYSTEM_PROMPT;
  }

  // 6. Call OpenAI API with legacy prompt
  const { aiAnalysis, tokensUsed } = await callOpenAILegacy(analysisInput, promptConfig);

  return {
    scoringResult,
    aiAnalysis,
    modelVersion: promptConfig.model,
    promptVersion: promptConfig.version,
    tokensUsed,
  };
}

/**
 * Analyze assessment (Enhanced v2)
 * Uses new enhanced prompt format with structured output
 */
export async function analyzeAssessmentEnhanced(
  input: AnalyzeAssessmentInput
): Promise<AnalyzeAssessmentEnhancedResult> {
  const { responses, candidatePosition, organizationId, promptTemplateId, modelOverride } = input;

  // 1. Calculate scores using scoring engine
  const scoringResult = calculateScores(responses);

  // 2. Extract SJT answers
  const sjtAnswers: Record<string, string> = {};
  for (const r of responses) {
    if (r.question_id.startsWith('SJT') && typeof r.answer === 'string') {
      sjtAnswers[r.question_id] = r.answer;
    }
  }

  // 3. Extract free text answer
  const freeTextResponse = responses.find((r) => r.question_id === 'T01');
  const freeTextAnswer =
    typeof freeTextResponse?.answer === 'string' ? freeTextResponse.answer : null;

  // 4. Build analysis input
  const analysisInput: AnalysisInput = {
    scoringResult,
    sjtAnswers,
    freeTextAnswer,
    candidatePosition,
  };

  // 5. Load active prompt from database
  const promptConfig = await loadActivePrompt({
    organizationId,
    promptTemplateId,
    modelOverride,
    promptKey: 'system',
  });

  // 6. Call OpenAI API with enhanced prompt
  const { aiAnalysis, tokensUsed } = await callOpenAIEnhanced(analysisInput, promptConfig);

  return {
    scoringResult,
    aiAnalysis,
    modelVersion: promptConfig.model,
    promptVersion: promptConfig.version,
    tokensUsed,
  };
}

/**
 * Generate candidate report only
 * Uses disclosure-ready prompt for candidate feedback
 */
export async function generateCandidateReport(
  input: AnalyzeAssessmentInput
): Promise<{ candidateReport: CandidateReportOutput; tokensUsed: number }> {
  const { responses, candidatePosition, organizationId, modelOverride } = input;

  // 1. Calculate scores using scoring engine
  const scoringResult = calculateScores(responses);

  // 2. Build candidate analysis input
  const candidateInput: CandidateAnalysisInput = {
    scoringResult,
    candidatePosition,
  };

  // 3. Load candidate prompt from database
  const promptConfig = await loadActivePrompt({
    organizationId,
    modelOverride,
    promptKey: 'candidate',
  });

  // 4. Call OpenAI API with candidate prompt
  const { candidateReport, tokensUsed } = await callOpenAICandidate(candidateInput, promptConfig);

  return { candidateReport, tokensUsed };
}

/**
 * Analyze assessment and generate both reports (Full v2)
 * Generates both internal enhanced report and candidate report
 */
export async function analyzeAssessmentFull(
  input: AnalyzeAssessmentInput
): Promise<AnalyzeAssessmentFullResult> {
  const { responses, candidatePosition, organizationId, promptTemplateId, modelOverride } = input;

  // 1. Calculate scores using scoring engine
  const scoringResult = calculateScores(responses);

  // 2. Extract SJT answers
  const sjtAnswers: Record<string, string> = {};
  for (const r of responses) {
    if (r.question_id.startsWith('SJT') && typeof r.answer === 'string') {
      sjtAnswers[r.question_id] = r.answer;
    }
  }

  // 3. Extract free text answer
  const freeTextResponse = responses.find((r) => r.question_id === 'T01');
  const freeTextAnswer =
    typeof freeTextResponse?.answer === 'string' ? freeTextResponse.answer : null;

  // 4. Build inputs
  const analysisInput: AnalysisInput = {
    scoringResult,
    sjtAnswers,
    freeTextAnswer,
    candidatePosition,
  };

  const candidateInput: CandidateAnalysisInput = {
    scoringResult,
    candidatePosition,
  };

  // 5. Load prompts from database
  const [internalConfig, candidateConfig] = await Promise.all([
    loadActivePrompt({
      organizationId,
      promptTemplateId,
      modelOverride,
      promptKey: 'system',
    }),
    loadActivePrompt({
      organizationId,
      modelOverride,
      promptKey: 'candidate',
    }),
  ]);

  // 6. Call OpenAI API for both reports (parallel)
  const [internalResult, candidateResult] = await Promise.all([
    callOpenAIEnhanced(analysisInput, internalConfig),
    callOpenAICandidate(candidateInput, candidateConfig),
  ]);

  return {
    scoringResult,
    internalReport: internalResult.aiAnalysis,
    candidateReport: candidateResult.candidateReport,
    modelVersion: internalConfig.model,
    promptVersion: internalConfig.version,
    totalTokensUsed: internalResult.tokensUsed + candidateResult.tokensUsed,
  };
}

// =====================================================
// OpenAI API Calls
// =====================================================

/**
 * Call OpenAI with legacy prompt (v1)
 */
async function callOpenAILegacy(
  input: AnalysisInput,
  config: PromptConfig
): Promise<{ aiAnalysis: LegacyAIAnalysisOutput; tokensUsed: number }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const openai = new OpenAI({ apiKey });
  const userPrompt = buildAnalysisPrompt(input);

  try {
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: config.maxTokens,
      temperature: config.temperature,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const aiAnalysis = parseAnalysisResponse(content);
    const tokensUsed = response.usage?.total_tokens ?? 0;

    return { aiAnalysis, tokensUsed };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Call OpenAI with enhanced prompt (v2)
 */
async function callOpenAIEnhanced(
  input: AnalysisInput,
  config: PromptConfig
): Promise<{ aiAnalysis: EnhancedAIAnalysisOutput; tokensUsed: number }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const openai = new OpenAI({ apiKey });
  const userPrompt = buildAnalysisPrompt(input);

  try {
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: config.maxTokens,
      temperature: config.temperature,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const aiAnalysis = parseEnhancedAnalysisResponse(content);
    const tokensUsed = response.usage?.total_tokens ?? 0;

    return { aiAnalysis, tokensUsed };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Call OpenAI with candidate prompt
 */
async function callOpenAICandidate(
  input: CandidateAnalysisInput,
  config: PromptConfig
): Promise<{ candidateReport: CandidateReportOutput; tokensUsed: number }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const openai = new OpenAI({ apiKey });
  const userPrompt = buildCandidatePrompt(input);

  try {
    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: config.maxTokens,
      temperature: config.temperature,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const candidateReport = parseCandidateResponse(content);
    const tokensUsed = response.usage?.total_tokens ?? 0;

    return { candidateReport, tokensUsed };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}

// =====================================================
// Mock function for testing (no API call)
// =====================================================

export async function analyzeAssessmentMock(
  input: AnalyzeAssessmentInput
): Promise<AnalyzeAssessmentResult> {
  const { responses, candidatePosition } = input;

  // Calculate real scores
  const scoringResult = calculateScores(responses);

  // Generate mock AI analysis (legacy format)
  const aiAnalysis: LegacyAIAnalysisOutput = {
    strengths: [
      'ルールや手順を重視し、組織のガバナンスに適合しやすい傾向がある',
      '問題発生時に適切な報告・相談を行う姿勢が見られる',
      '自己の責任を認識し、言い訳をせずに対処する傾向がある',
    ],
    weaknesses: [
      '柔軟性に欠ける場面があり、例外的状況での判断に注意が必要',
      'フィードバックに対して防衛的になる可能性がある',
      'ストレス下での感情コントロールに課題が見られる場合がある',
    ],
    summary: `${candidatePosition}への適性を検査した結果、全体的にガバナンス意識が高く、組織のルールに従って業務を遂行できる傾向が見られます。一方で、状況に応じた柔軟な判断や、批判的フィードバックへの対応には改善の余地があります。総合スコアは${scoringResult.overallScore}%で、基準を満たしています。`,
    recommendation:
      '面接では、過去に例外的な判断を求められた経験や、批判を受けた際の対応について具体的に確認することをお勧めします。また、ストレス耐性について深掘りすることで、より正確な適性判断が可能になります。',
  };

  return {
    scoringResult,
    aiAnalysis,
    modelVersion: 'mock',
    promptVersion: 'v1.0.0',
    tokensUsed: 0,
  };
}

/**
 * Mock for enhanced analysis (v2)
 */
export async function analyzeAssessmentEnhancedMock(
  input: AnalyzeAssessmentInput
): Promise<AnalyzeAssessmentEnhancedResult> {
  const { responses, candidatePosition } = input;

  // Calculate real scores
  const scoringResult = calculateScores(responses);

  // Generate mock AI analysis (enhanced format)
  const aiAnalysis: EnhancedAIAnalysisOutput = {
    strengths: [
      {
        title: 'ガバナンス意識',
        behavior: 'ルールや手順を重視し、組織のガバナンスに適合しやすい傾向がある',
        evidence: 'ガバナンス適合スコアが高め',
      },
      {
        title: '報連相の姿勢',
        behavior: '問題発生時に適切な報告・相談を行う姿勢が見られる',
        evidence: '対立処理スコアが良好',
      },
      {
        title: '責任感',
        behavior: '自己の責任を認識し、言い訳をせずに対処する傾向がある',
        evidence: '業務遂行スコアが高め',
      },
    ],
    watchouts: [
      {
        title: '柔軟性',
        risk: '例外的状況での判断において硬直的になりやすい傾向がある',
        evidence: 'ガバナンス適合が高い一方で対人態度が相対的に低め',
      },
      {
        title: 'フィードバック受容',
        risk: '批判的なフィードバックに対して防衛的になりやすい傾向がある',
        evidence: '対人態度スコアが注意レベル',
      },
      {
        title: 'ストレス耐性',
        risk: '高負荷状況下で感情コントロールが難しくなりやすい傾向がある',
        evidence: '認知スタイルスコアが中程度',
      },
    ],
    risk_scenarios: [
      {
        condition: '厳しい納期や複数タスクの同時進行が求められる状況',
        symptom: '周囲への報告が遅れがちになる、ミスが増加しやすい',
        impact: 'プロジェクト遅延、チーム内コミュニケーション低下',
        prevention: '定期的な進捗確認の仕組みを設け、早期に負荷を検知する',
        risk_environment: ['繁忙期', '複数プロジェクト並行時'],
      },
      {
        condition: '上司や同僚から強い指摘を受けた場面',
        symptom: '防衛的な態度が出やすく、改善よりも説明に注力しがち',
        impact: '信頼関係の低下、同じ問題の再発',
        prevention: 'フィードバック時は具体的な改善点を明示し、フォローアップを設定する',
        risk_environment: ['評価面談', 'プロジェクト振り返り'],
      },
    ],
    interview_checks: [
      {
        question: '過去に上司から厳しい指摘を受けた経験について教えてください。その時どのように対応しましたか？',
        intent: 'フィードバック受容性の確認',
        look_for: '具体的な改善行動があったか、防衛的な説明に終始していないか',
      },
      {
        question: '複数のタスクを同時に抱えて困った経験はありますか？どのように対処しましたか？',
        intent: 'ストレス耐性と優先順位付けの確認',
        look_for: '具体的な対処法、周囲への相談があったか',
      },
      {
        question: 'ルール通りに進めると問題が起きそうな場面で、どう判断しましたか？',
        intent: '柔軟性と判断力の確認',
        look_for: '例外対応の経験、エスカレーションの判断があったか',
      },
    ],
    summary: `${candidatePosition}への適性を検査した結果、全体的にガバナンス意識が高く、組織のルールに従って業務を遂行できる傾向が見られます。報告・相談の姿勢も良好です。一方で、プレッシャー下での柔軟な対応や、批判的フィードバックへの受容性については面接で確認が必要です。`,
    recommendation: '面接では特にフィードバック受容性とストレス耐性について、具体的なエピソードを確認することをお勧めします。防衛的な回答傾向が見られた場合は、入社後のフォロー体制を検討してください。',
  };

  return {
    scoringResult,
    aiAnalysis,
    modelVersion: 'mock',
    promptVersion: 'v2.0.0',
    tokensUsed: 0,
  };
}

/**
 * Mock for full analysis (both internal and candidate reports)
 */
export async function analyzeAssessmentFullMock(
  input: AnalyzeAssessmentInput
): Promise<AnalyzeAssessmentFullResult> {
  const { responses, candidatePosition } = input;

  // Calculate real scores
  const scoringResult = calculateScores(responses);

  // Generate mock internal report (enhanced format)
  const internalReport: EnhancedAIAnalysisOutput = {
    strengths: [
      {
        title: 'ガバナンス意識',
        behavior: 'ルールや手順を重視し、組織のガバナンスに適合しやすい傾向がある',
        evidence: 'ガバナンス適合スコアが高め',
      },
      {
        title: '報連相の姿勢',
        behavior: '問題発生時に適切な報告・相談を行う姿勢が見られる',
        evidence: '対立処理スコアが良好',
      },
      {
        title: '責任感',
        behavior: '自己の責任を認識し、言い訳をせずに対処する傾向がある',
        evidence: '業務遂行スコアが高め',
      },
    ],
    watchouts: [
      {
        title: '柔軟性',
        risk: '例外的状況での判断において硬直的になりやすい傾向がある',
        evidence: 'ガバナンス適合が高い一方で対人態度が相対的に低め',
      },
      {
        title: 'フィードバック受容',
        risk: '批判的なフィードバックに対して防衛的になりやすい傾向がある',
        evidence: '対人態度スコアが注意レベル',
      },
      {
        title: 'ストレス耐性',
        risk: '高負荷状況下で感情コントロールが難しくなりやすい傾向がある',
        evidence: '認知スタイルスコアが中程度',
      },
    ],
    risk_scenarios: [
      {
        condition: '厳しい納期や複数タスクの同時進行が求められる状況',
        symptom: '周囲への報告が遅れがちになる、ミスが増加しやすい',
        impact: 'プロジェクト遅延、チーム内コミュニケーション低下',
        prevention: '定期的な進捗確認の仕組みを設け、早期に負荷を検知する',
        risk_environment: ['繁忙期', '複数プロジェクト並行時'],
      },
      {
        condition: '上司や同僚から強い指摘を受けた場面',
        symptom: '防衛的な態度が出やすく、改善よりも説明に注力しがち',
        impact: '信頼関係の低下、同じ問題の再発',
        prevention: 'フィードバック時は具体的な改善点を明示し、フォローアップを設定する',
        risk_environment: ['評価面談', 'プロジェクト振り返り'],
      },
    ],
    interview_checks: [
      {
        question: '過去に上司から厳しい指摘を受けた経験について教えてください。その時どのように対応しましたか？',
        intent: 'フィードバック受容性の確認',
        look_for: '具体的な改善行動があったか、防衛的な説明に終始していないか',
      },
      {
        question: '複数のタスクを同時に抱えて困った経験はありますか？どのように対処しましたか？',
        intent: 'ストレス耐性と優先順位付けの確認',
        look_for: '具体的な対処法、周囲への相談があったか',
      },
      {
        question: 'ルール通りに進めると問題が起きそうな場面で、どう判断しましたか？',
        intent: '柔軟性と判断力の確認',
        look_for: '例外対応の経験、エスカレーションの判断があったか',
      },
    ],
    summary: `${candidatePosition}への適性を検査した結果、全体的にガバナンス意識が高く、組織のルールに従って業務を遂行できる傾向が見られます。報告・相談の姿勢も良好です。一方で、プレッシャー下での柔軟な対応や、批判的フィードバックへの受容性については面接で確認が必要です。`,
    recommendation: '面接では特にフィードバック受容性とストレス耐性について、具体的なエピソードを確認することをお勧めします。防衛的な回答傾向が見られた場合は、入社後のフォロー体制を検討してください。',
  };

  // Generate mock candidate report
  const candidateReport: CandidateReportOutput = {
    strengths: [
      {
        title: 'ルールを大切にする姿勢',
        description: '組織のルールや手順を尊重し、着実に業務を進めることができます。',
      },
      {
        title: 'コミュニケーション力',
        description: '問題が発生した際に、適切なタイミングで報告・相談を行うことができます。',
      },
      {
        title: '責任感',
        description: '自分の担当業務に責任を持ち、最後までやり遂げようとする姿勢があります。',
      },
    ],
    leverage_tips: [
      '明確なルールや手順がある環境で力を発揮しやすいです',
      'チームで協力する場面で、報連相を活かして貢献できます',
      '長期的なプロジェクトで着実に成果を出すことが得意です',
    ],
    stress_tips: [
      '複数のタスクが重なった時は、優先順位を上司と相談することで負荷を分散できます',
      'フィードバックを受けた時は、改善点にフォーカスして次のアクションを考えましょう',
    ],
    values_tags: ['誠実さ', 'チームワーク', '安定志向'],
    note: 'この結果は特定の検査時点での傾向を示すものであり、能力や適性を断定するものではありません。自己理解の参考としてご活用ください。',
  };

  return {
    scoringResult,
    internalReport,
    candidateReport,
    modelVersion: 'mock',
    promptVersion: 'v2.0.0',
    totalTokensUsed: 0,
  };
}

// =====================================================
// AI Analyzer - OpenAI API Integration
// Supports dynamic prompt loading from database
// =====================================================

import OpenAI from 'openai';
import { calculateScores } from './scoring-engine';
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  parseAnalysisResponse,
  type AnalysisInput,
  type AIAnalysisOutput,
} from './prompts';
import type { ScoringResult, ResponseData } from './types';
import type { PromptTemplate } from '@/types/database';

// =====================================================
// Default Configuration (fallback when no DB prompt)
// =====================================================

const DEFAULT_MODEL = 'gpt-5.2';
const DEFAULT_PROMPT_VERSION = 'v1.0.0';
const DEFAULT_MAX_TOKENS = 1500;
const DEFAULT_TEMPERATURE = 0.3;

// =====================================================
// Types
// =====================================================

export interface AnalyzeAssessmentInput {
  responses: ResponseData[];
  candidatePosition: string;
  organizationId?: string; // Optional: for org-specific prompts
}

export interface AnalyzeAssessmentResult {
  scoringResult: ScoringResult;
  aiAnalysis: AIAnalysisOutput;
  modelVersion: string;
  promptVersion: string;
  tokensUsed: number;
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

/**
 * Load active system prompt from database
 * Falls back to hardcoded prompt if not found
 */
async function loadActivePrompt(organizationId?: string): Promise<PromptConfig> {
  try {
    // Dynamic import to avoid circular dependencies
    const { createAdminClient } = await import('@/lib/supabase/server');
    const adminSupabase = createAdminClient();

    // Try to find org-specific active prompt first, then system-wide
    let query = adminSupabase
      .from('prompt_templates')
      .select('*')
      .eq('key', 'system')
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
          model: orgPrompt.model,
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
      .eq('key', 'system')
      .eq('is_active', true)
      .is('organization_id', null)
      .is('deleted_at', null)
      .single<PromptTemplate>();

    if (systemPrompt) {
      return {
        systemPrompt: systemPrompt.content,
        model: systemPrompt.model,
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
    systemPrompt: ANALYSIS_SYSTEM_PROMPT,
    model: DEFAULT_MODEL,
    temperature: DEFAULT_TEMPERATURE,
    maxTokens: DEFAULT_MAX_TOKENS,
    version: DEFAULT_PROMPT_VERSION,
  };
}

// =====================================================
// Main Analysis Function
// =====================================================

/**
 * Analyze assessment responses using scoring engine and OpenAI
 * Dynamically loads prompts from database
 */
export async function analyzeAssessment(
  input: AnalyzeAssessmentInput
): Promise<AnalyzeAssessmentResult> {
  const { responses, candidatePosition, organizationId } = input;

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
  const promptConfig = await loadActivePrompt(organizationId);

  // 6. Call OpenAI API with dynamic prompt
  const { aiAnalysis, tokensUsed } = await callOpenAI(analysisInput, promptConfig);

  return {
    scoringResult,
    aiAnalysis,
    modelVersion: promptConfig.model,
    promptVersion: promptConfig.version,
    tokensUsed,
  };
}

// =====================================================
// OpenAI API Call
// =====================================================

async function callOpenAI(
  input: AnalysisInput,
  config: PromptConfig
): Promise<{ aiAnalysis: AIAnalysisOutput; tokensUsed: number }> {
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

// =====================================================
// Mock function for testing (no API call)
// =====================================================

export async function analyzeAssessmentMock(
  input: AnalyzeAssessmentInput
): Promise<AnalyzeAssessmentResult> {
  const { responses, candidatePosition } = input;

  // Calculate real scores
  const scoringResult = calculateScores(responses);

  // Generate mock AI analysis
  const aiAnalysis: AIAnalysisOutput = {
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
    promptVersion: DEFAULT_PROMPT_VERSION,
    tokensUsed: 0,
  };
}

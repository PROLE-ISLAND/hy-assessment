// =====================================================
// AI Analysis Prompts for GFD-Gate v2 (Enhanced)
// =====================================================

import type { ScoringResult, Domain } from './types';
import type {
  EnhancedAIAnalysisOutput,
  EnhancedStrength,
  EnhancedWatchout,
  RiskScenario,
  InterviewCheck,
  LegacyAIAnalysisOutput,
} from './types';
import { DOMAIN_LABELS, DOMAIN_DESCRIPTIONS } from './types';

// =====================================================
// System Prompt (v2 - Enhanced Internal Version)
// =====================================================

export const ANALYSIS_SYSTEM_PROMPT = `あなたは採用適性検査の分析専門家です。
候補者の検査結果から、採用担当者向けの分析レポートを生成します。

## 役割
- あなたは「判定」を行いません。判定は固定ロジックで決定済みです
- あなたの役割は「判定の根拠となる行動傾向を文章化する」ことです
- 事故防止のためのリスク記述を詳細に行ってください

## 表現ガイドライン

### 必須ルール
- すべての記述は「傾向」「〜しやすい」「〜になりやすい」で表現
- "良い/悪い"ではなく"条件付きの予測"にする
- 断定的なラベリング（〇〇な人、〇〇タイプ）は禁止

### 禁止表現
以下は絶対に使用しないでください：
- 被害者意識、情緒不安定、メンタルが弱い、性格が悪い
- 不誠実、信用できない、攻撃的、問題人物、危険人物
- 〇〇な人、〇〇タイプ（断定的なラベリング）

### 代替表現（推奨）
- 「プレッシャー下では〜になりやすい」
- 「指摘が強い場面では〜が起きやすい」
- 「共有タイミングが遅れやすい」
- 「周囲との認識にズレが生じやすい」
- 「〜の傾向がある」「〜しがちである」

## 出力フォーマット（JSON）
必ずJSONのみで返してください（説明文・前置き禁止）。

{
  "strengths": [
    {
      "title": "強みの短い見出し",
      "behavior": "具体的行動傾向（50-100文字）",
      "evidence": "根拠（どのドメイン傾向に基づくか）"
    }
  ],
  "watchouts": [
    {
      "title": "注意点の短い見出し",
      "risk": "業務上のリスク（断定しない、50-100文字）",
      "evidence": "根拠（どのドメイン傾向に基づくか）"
    }
  ],
  "risk_scenarios": [
    {
      "condition": "トリガー条件（どんな状況で）",
      "symptom": "現れる症状（何が起きるか）",
      "impact": "業務への影響（どう困るか）",
      "prevention": "予防策・対処法",
      "risk_environment": ["摩擦が出やすい環境1", "環境2"]
    }
  ],
  "interview_checks": [
    {
      "question": "面接質問文",
      "intent": "確認意図",
      "look_for": "回答で見るべきポイント"
    }
  ],
  "summary": "総合所見（200-300文字）",
  "recommendation": "採用判断への推奨（100-200文字：面接での検証必須点を明確に）"
}

## 生成ルール
- strengths: 3〜5件
- watchouts: 3〜5件
- risk_scenarios: 2〜4件（事故防止が目的なので必須）
- interview_checks: 3〜6問（Gate理由に直結するものを優先）

## 根拠の書き方
- evidenceには「（例）対立処理が相対的に低め」「妥当性が低く自己申告の信頼度が限定的」など、
  "どの傾向に基づくか"を短く書く（数値のコピペは不要、レンジ表現でOK）`;

// =====================================================
// Legacy System Prompt (v1 - Backward Compatibility)
// =====================================================

export const LEGACY_SYSTEM_PROMPT = `あなたは採用適性検査の分析専門家です。
候補者の検査結果から、採用担当者向けの分析レポートを生成します。

## 分析ガイドライン
1. 強み・注意点は具体的な行動傾向で記述する
2. 批判的すぎず、建設的なトーンを維持する
3. 妥当性フラグがある場合は慎重に評価する
4. 採用判断の根拠を明確にする
5. 日本語で回答する

## 出力フォーマット（JSON）
必ず以下の形式でJSONを返してください：
{
  "strengths": ["強み1", "強み2", "強み3"],
  "weaknesses": ["注意点1", "注意点2", "注意点3"],
  "summary": "総合評価（200-300文字）",
  "recommendation": "採用判断への推奨事項（100-200文字）"
}

注意：
- strengthsは3-5項目
- weaknessesは3-5項目
- 各項目は具体的な行動傾向を記述（例：「ルールを重視し、手順を省略しない傾向がある」）
- summaryは候補者の全体像を簡潔に説明
- recommendationは面接での確認ポイントや採用判断のアドバイス`;

// =====================================================
// User Prompt Builder
// =====================================================

export interface AnalysisInput {
  scoringResult: ScoringResult;
  sjtAnswers: Record<string, string>;
  freeTextAnswer: string | null;
  candidatePosition: string;
}

export function buildAnalysisPrompt(input: AnalysisInput): string {
  const { scoringResult, sjtAnswers, freeTextAnswer, candidatePosition } = input;

  // Build domain scores section
  const domainScoresText = Object.entries(scoringResult.domainScores)
    .map(([domain, score]) => {
      const d = domain as Domain;
      return `- ${DOMAIN_LABELS[d]}（${d}）: ${score.percentage}%（${score.riskLevel === 'low' ? '良好' : score.riskLevel === 'medium' ? '注意' : '要注意'}）
  説明: ${DOMAIN_DESCRIPTIONS[d]}`;
    })
    .join('\n');

  // Build SJT answers section
  const sjtAnswersText = Object.entries(sjtAnswers)
    .map(([id, answer]) => `- ${id}: 選択肢${answer}`)
    .join('\n');

  // Build validity section
  const validityText = scoringResult.validityFlags.isValid
    ? '妥当性: 問題なし'
    : `妥当性: 注意が必要\n${scoringResult.validityFlags.details.map(d => `  - ${d}`).join('\n')}`;

  return `## 候補者情報
応募職種: ${candidatePosition}

## ドメイン別スコア（6ドメイン）
${domainScoresText}

## 総合スコア
${scoringResult.overallScore}%

## SJT（状況判断テスト）回答
${sjtAnswersText}
SJT総合スコア: ${scoringResult.sjtScores.percentage}%

## 自由記述回答
${freeTextAnswer || '（回答なし）'}

## ${validityText}

上記の検査結果を分析し、この候補者の強み、注意点、リスクシナリオ、面接確認項目、総合評価、採用推奨事項をJSON形式で出力してください。`;
}

// =====================================================
// Response Parser (v2 - Enhanced)
// =====================================================

// Re-export legacy type for backward compatibility
export type AIAnalysisOutput = LegacyAIAnalysisOutput;

/**
 * Parse enhanced AI analysis response (v2)
 */
export function parseEnhancedAnalysisResponse(response: string): EnhancedAIAnalysisOutput {
  try {
    const parsed = JSON.parse(extractJSON(response));
    return validateEnhancedOutput(parsed);
  } catch (error) {
    throw new Error(`Failed to parse enhanced AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse legacy AI analysis response (v1)
 */
export function parseAnalysisResponse(response: string): LegacyAIAnalysisOutput {
  try {
    const parsed = JSON.parse(extractJSON(response));
    return validateLegacyOutput(parsed);
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Extract JSON from response (handles markdown code blocks)
 */
function extractJSON(response: string): string {
  // Try to extract from markdown code block first
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  return response.trim();
}

/**
 * Validate enhanced output structure
 */
function validateEnhancedOutput(parsed: unknown): EnhancedAIAnalysisOutput {
  const obj = parsed as Record<string, unknown>;

  // Validate strengths
  if (!Array.isArray(obj.strengths) || obj.strengths.length === 0) {
    throw new Error('strengths must be a non-empty array');
  }
  const strengths = (obj.strengths as unknown[]).slice(0, 5).map(validateEnhancedStrength);

  // Validate watchouts
  if (!Array.isArray(obj.watchouts) || obj.watchouts.length === 0) {
    throw new Error('watchouts must be a non-empty array');
  }
  const watchouts = (obj.watchouts as unknown[]).slice(0, 5).map(validateEnhancedWatchout);

  // Validate risk_scenarios
  if (!Array.isArray(obj.risk_scenarios) || obj.risk_scenarios.length === 0) {
    throw new Error('risk_scenarios must be a non-empty array');
  }
  const risk_scenarios = (obj.risk_scenarios as unknown[]).slice(0, 4).map(validateRiskScenario);

  // Validate interview_checks
  if (!Array.isArray(obj.interview_checks) || obj.interview_checks.length === 0) {
    throw new Error('interview_checks must be a non-empty array');
  }
  const interview_checks = (obj.interview_checks as unknown[]).slice(0, 6).map(validateInterviewCheck);

  // Validate strings
  if (typeof obj.summary !== 'string' || obj.summary.length === 0) {
    throw new Error('summary must be a non-empty string');
  }
  if (typeof obj.recommendation !== 'string' || obj.recommendation.length === 0) {
    throw new Error('recommendation must be a non-empty string');
  }

  return {
    strengths,
    watchouts,
    risk_scenarios,
    interview_checks,
    summary: obj.summary as string,
    recommendation: obj.recommendation as string,
  };
}

/**
 * Validate legacy output structure
 */
function validateLegacyOutput(parsed: unknown): LegacyAIAnalysisOutput {
  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.strengths) || obj.strengths.length === 0) {
    throw new Error('strengths must be a non-empty array');
  }
  if (!Array.isArray(obj.weaknesses) || obj.weaknesses.length === 0) {
    throw new Error('weaknesses must be a non-empty array');
  }
  if (typeof obj.summary !== 'string' || obj.summary.length === 0) {
    throw new Error('summary must be a non-empty string');
  }
  if (typeof obj.recommendation !== 'string' || obj.recommendation.length === 0) {
    throw new Error('recommendation must be a non-empty string');
  }

  return {
    strengths: (obj.strengths as string[]).slice(0, 5),
    weaknesses: (obj.weaknesses as string[]).slice(0, 5),
    summary: obj.summary as string,
    recommendation: obj.recommendation as string,
  };
}

/**
 * Validate EnhancedStrength structure
 */
function validateEnhancedStrength(item: unknown): EnhancedStrength {
  const obj = item as Record<string, unknown>;
  if (typeof obj.title !== 'string' || typeof obj.behavior !== 'string' || typeof obj.evidence !== 'string') {
    throw new Error('strength must have title, behavior, and evidence strings');
  }
  return {
    title: obj.title,
    behavior: obj.behavior,
    evidence: obj.evidence,
  };
}

/**
 * Validate EnhancedWatchout structure
 */
function validateEnhancedWatchout(item: unknown): EnhancedWatchout {
  const obj = item as Record<string, unknown>;
  if (typeof obj.title !== 'string' || typeof obj.risk !== 'string' || typeof obj.evidence !== 'string') {
    throw new Error('watchout must have title, risk, and evidence strings');
  }
  return {
    title: obj.title,
    risk: obj.risk,
    evidence: obj.evidence,
  };
}

/**
 * Validate RiskScenario structure
 */
function validateRiskScenario(item: unknown): RiskScenario {
  const obj = item as Record<string, unknown>;
  if (
    typeof obj.condition !== 'string' ||
    typeof obj.symptom !== 'string' ||
    typeof obj.impact !== 'string' ||
    typeof obj.prevention !== 'string' ||
    !Array.isArray(obj.risk_environment)
  ) {
    throw new Error('risk_scenario must have condition, symptom, impact, prevention strings and risk_environment array');
  }
  return {
    condition: obj.condition,
    symptom: obj.symptom,
    impact: obj.impact,
    prevention: obj.prevention,
    risk_environment: obj.risk_environment as string[],
  };
}

/**
 * Validate InterviewCheck structure
 */
function validateInterviewCheck(item: unknown): InterviewCheck {
  const obj = item as Record<string, unknown>;
  if (typeof obj.question !== 'string' || typeof obj.intent !== 'string' || typeof obj.look_for !== 'string') {
    throw new Error('interview_check must have question, intent, and look_for strings');
  }
  return {
    question: obj.question,
    intent: obj.intent,
    look_for: obj.look_for,
  };
}

// =====================================================
// AI Analysis Prompts for GFD-Gate v2 (Enhanced)
// =====================================================

import type { ScoringResult, Domain } from './types';
import type {
  EnhancedAIAnalysisOutput,
  LegacyAIAnalysisOutput,
} from './types';
import { DOMAIN_LABELS, DOMAIN_DESCRIPTIONS } from './types';
import {
  enhancedAIAnalysisOutputSchema,
  legacyAIAnalysisOutputSchema,
  formatValidationErrors,
} from '@/lib/validations/ai-output';

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
 * Uses Zod schema for type-safe validation
 * Falls back to v1 (legacy) format and converts to v2 if needed
 */
export function parseEnhancedAnalysisResponse(response: string): EnhancedAIAnalysisOutput {
  try {
    const jsonStr = extractJSON(response);
    const parsed: unknown = JSON.parse(jsonStr);

    // Try v2 (enhanced) format first
    const v2Result = enhancedAIAnalysisOutputSchema.safeParse(parsed);
    if (v2Result.success) {
      // Enforce max counts as per original logic
      return {
        strengths: v2Result.data.strengths.slice(0, 5),
        watchouts: v2Result.data.watchouts.slice(0, 5),
        risk_scenarios: v2Result.data.risk_scenarios.slice(0, 4),
        interview_checks: v2Result.data.interview_checks.slice(0, 6),
        summary: v2Result.data.summary,
        recommendation: v2Result.data.recommendation,
      };
    }

    // If v2 failed, try v1 (legacy) format and convert
    const v1Result = legacyAIAnalysisOutputSchema.safeParse(parsed);
    if (v1Result.success) {
      console.log('[AI Parser] Fallback: Converting v1 format to v2');
      return convertLegacyToEnhanced(v1Result.data);
    }

    // Try flexible fallback for partial v1/v2 responses
    const flexibleResult = tryFlexibleParse(parsed);
    if (flexibleResult) {
      console.log('[AI Parser] Flexible fallback: Converting partial format to v2');
      return flexibleResult;
    }

    // All parsing attempts failed
    console.error('[AI Parser] All parsing attempts failed. Raw parsed:', JSON.stringify(parsed).slice(0, 500));
    throw new Error(`Schema validation failed: ${formatValidationErrors(v2Result.error)}`);
  } catch (error) {
    throw new Error(`Failed to parse enhanced AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Flexible parser that handles partial/mixed format responses
 * Extracts whatever fields are available and fills in defaults
 */
function tryFlexibleParse(parsed: unknown): EnhancedAIAnalysisOutput | null {
  if (!parsed || typeof parsed !== 'object') return null;

  const obj = parsed as Record<string, unknown>;

  // Must have at least summary and recommendation
  if (typeof obj.summary !== 'string' || typeof obj.recommendation !== 'string') {
    return null;
  }

  // Extract strengths (can be string[] or object[])
  const rawStrengths = Array.isArray(obj.strengths) ? obj.strengths : [];
  const strengths = rawStrengths.slice(0, 5).map((s, i) => {
    if (typeof s === 'string') {
      return { title: `強み${i + 1}`, behavior: s, evidence: '検査結果に基づく' };
    }
    if (s && typeof s === 'object') {
      const sObj = s as Record<string, unknown>;
      return {
        title: String(sObj.title || `強み${i + 1}`),
        behavior: String(sObj.behavior || sObj.description || ''),
        evidence: String(sObj.evidence || '検査結果に基づく'),
      };
    }
    return { title: `強み${i + 1}`, behavior: '（データなし）', evidence: '検査結果に基づく' };
  });

  // Extract watchouts/weaknesses (can be string[] or object[])
  const rawWatchouts = Array.isArray(obj.watchouts)
    ? obj.watchouts
    : Array.isArray(obj.weaknesses)
      ? obj.weaknesses
      : [];
  const watchouts = rawWatchouts.slice(0, 5).map((w, i) => {
    if (typeof w === 'string') {
      return { title: `注意点${i + 1}`, risk: w, evidence: '検査結果に基づく' };
    }
    if (w && typeof w === 'object') {
      const wObj = w as Record<string, unknown>;
      return {
        title: String(wObj.title || `注意点${i + 1}`),
        risk: String(wObj.risk || wObj.description || ''),
        evidence: String(wObj.evidence || '検査結果に基づく'),
      };
    }
    return { title: `注意点${i + 1}`, risk: '（データなし）', evidence: '検査結果に基づく' };
  });

  // Generate risk_scenarios if not present
  const rawScenarios = Array.isArray(obj.risk_scenarios) ? obj.risk_scenarios : [];
  const risk_scenarios =
    rawScenarios.length > 0
      ? rawScenarios.slice(0, 4).map((r) => {
          const rObj = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>;
          return {
            condition: String(rObj.condition || '業務負荷が高い状況'),
            symptom: String(rObj.symptom || '注意が必要な行動が現れやすい'),
            impact: String(rObj.impact || '業務への影響の可能性'),
            prevention: String(rObj.prevention || '適切なサポート体制の構築'),
            risk_environment: Array.isArray(rObj.risk_environment)
              ? rObj.risk_environment.map(String)
              : ['高ストレス環境'],
          };
        })
      : watchouts.slice(0, 2).map((w) => ({
          condition: '業務負荷が高い状況',
          symptom: w.risk,
          impact: '業務効率や対人関係への影響の可能性',
          prevention: '定期的なフォローアップと適切なサポート体制の構築',
          risk_environment: ['高ストレス環境', '締切が厳しい状況'],
        }));

  // Generate interview_checks if not present
  const rawChecks = Array.isArray(obj.interview_checks) ? obj.interview_checks : [];
  const interview_checks =
    rawChecks.length > 0
      ? rawChecks.slice(0, 6).map((c) => {
          const cObj = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>;
          return {
            question: String(cObj.question || '過去の経験について教えてください'),
            intent: String(cObj.intent || '行動傾向の確認'),
            look_for: String(cObj.look_for || '具体的なエピソードと対応'),
          };
        })
      : watchouts.slice(0, 3).map((w) => ({
          question: `${w.title}に関連する過去の経験について教えてください`,
          intent: `${w.risk}に関する自己認識の確認`,
          look_for: '具体的なエピソードと改善への取り組み姿勢',
        }));

  // Ensure minimum required items
  if (strengths.length === 0) {
    strengths.push({ title: '強み', behavior: '検査結果を総合的に分析中', evidence: '検査結果に基づく' });
  }
  if (watchouts.length === 0) {
    watchouts.push({ title: '注意点', risk: '検査結果を総合的に分析中', evidence: '検査結果に基づく' });
  }
  if (risk_scenarios.length === 0) {
    risk_scenarios.push({
      condition: '業務負荷が高い状況',
      symptom: '注意が必要な行動が現れやすい',
      impact: '業務への影響の可能性',
      prevention: '適切なサポート体制の構築',
      risk_environment: ['高ストレス環境'],
    });
  }
  if (interview_checks.length === 0) {
    interview_checks.push({
      question: 'これまでの業務で困難だった状況とその対処法を教えてください',
      intent: 'ストレス対処能力の確認',
      look_for: '具体的なエピソードと問題解決アプローチ',
    });
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
 * Convert legacy (v1) AI analysis output to enhanced (v2) format
 * This enables backward compatibility with older prompts
 */
function convertLegacyToEnhanced(legacy: LegacyAIAnalysisOutput): EnhancedAIAnalysisOutput {
  return {
    // Convert string[] to EnhancedStrength[]
    strengths: legacy.strengths.map((s, i) => ({
      title: `強み${i + 1}`,
      behavior: s,
      evidence: '検査結果に基づく行動傾向',
    })),
    // Convert string[] (weaknesses) to EnhancedWatchout[]
    watchouts: legacy.weaknesses.map((w, i) => ({
      title: `注意点${i + 1}`,
      risk: w,
      evidence: '検査結果に基づく行動傾向',
    })),
    // Generate placeholder risk scenarios from weaknesses
    risk_scenarios: legacy.weaknesses.slice(0, 2).map((w) => ({
      condition: '業務負荷が高い状況',
      symptom: w,
      impact: '業務効率や対人関係への影響の可能性',
      prevention: '定期的なフォローアップと適切なサポート体制の構築',
      risk_environment: ['高ストレス環境', '締切が厳しい状況'],
    })),
    // Generate placeholder interview checks from weaknesses
    interview_checks: legacy.weaknesses.slice(0, 3).map((w) => ({
      question: `過去に${w.includes('傾向') ? w.replace(/傾向.*$/, '') : w}が課題となった経験はありますか？どう対処しましたか？`,
      intent: `${w}に関する自己認識と対処能力の確認`,
      look_for: '具体的なエピソードと改善への取り組み姿勢',
    })),
    summary: legacy.summary,
    recommendation: legacy.recommendation,
  };
}

/**
 * Parse legacy AI analysis response (v1)
 * Uses Zod schema for type-safe validation
 */
export function parseAnalysisResponse(response: string): LegacyAIAnalysisOutput {
  try {
    const jsonStr = extractJSON(response);
    const parsed: unknown = JSON.parse(jsonStr);

    const result = legacyAIAnalysisOutputSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Schema validation failed: ${formatValidationErrors(result.error)}`);
    }

    // Enforce max counts as per original logic
    return {
      strengths: result.data.strengths.slice(0, 5),
      weaknesses: result.data.weaknesses.slice(0, 5),
      summary: result.data.summary,
      recommendation: result.data.recommendation,
    };
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


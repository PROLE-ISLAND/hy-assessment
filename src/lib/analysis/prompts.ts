// =====================================================
// AI Analysis Prompts for GFD-Gate v1
// =====================================================

import type { ScoringResult, Domain } from './types';
import { DOMAIN_LABELS, DOMAIN_DESCRIPTIONS } from './types';

// =====================================================
// System Prompt
// =====================================================

export const ANALYSIS_SYSTEM_PROMPT = `あなたは採用適性検査の分析専門家です。
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

上記の検査結果を分析し、この候補者の強み、注意点、総合評価、採用推奨事項をJSON形式で出力してください。`;
}

// =====================================================
// Response Parser
// =====================================================

export interface AIAnalysisOutput {
  strengths: string[];
  weaknesses: string[];
  summary: string;
  recommendation: string;
}

export function parseAnalysisResponse(response: string): AIAnalysisOutput {
  try {
    // Try to parse JSON directly
    const parsed = JSON.parse(response);

    // Validate required fields
    if (!Array.isArray(parsed.strengths) || parsed.strengths.length === 0) {
      throw new Error('strengths must be a non-empty array');
    }
    if (!Array.isArray(parsed.weaknesses) || parsed.weaknesses.length === 0) {
      throw new Error('weaknesses must be a non-empty array');
    }
    if (typeof parsed.summary !== 'string' || parsed.summary.length === 0) {
      throw new Error('summary must be a non-empty string');
    }
    if (typeof parsed.recommendation !== 'string' || parsed.recommendation.length === 0) {
      throw new Error('recommendation must be a non-empty string');
    }

    return {
      strengths: parsed.strengths.slice(0, 5),
      weaknesses: parsed.weaknesses.slice(0, 5),
      summary: parsed.summary,
      recommendation: parsed.recommendation,
    };
  } catch (error) {
    // If JSON parsing fails, try to extract from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return parseAnalysisResponse(jsonMatch[1].trim());
    }

    throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =====================================================
// AI Analysis Prompts for Candidate Report (開示用)
// =====================================================

import type { ScoringResult, Domain } from './types';
import type {
  CandidateReportOutput,
  CandidateStrength,
} from './types';
import { DOMAIN_LABELS } from './types';

// =====================================================
// System Prompt (Candidate Version - 開示耐性)
// =====================================================

export const CANDIDATE_SYSTEM_PROMPT = `あなたは適性検査のフィードバック専門家です。
候補者本人が見るための、建設的なフィードバックレポートを生成します。

## 重要な制約
- 合否・妥当性・判定に関する情報は一切書かないでください
- 否定的な表現は避け、「活かし方」「工夫」の観点で書いてください
- スコアや順位の言及はしないでください
- 弱みや注意点を直接指摘しないでください

## 表現ガイドライン

### 必須ルール
- すべての記述はポジティブかつ建設的に
- 「強み」は具体的な行動として表現
- 「工夫」「活かし方」の観点で自己理解を促す
- 候補者が自分の特性を前向きに捉えられるように

### 禁止表現
以下は絶対に使用しないでください：
- 「弱み」「欠点」「問題」「課題」「不足」
- 「低い」「高い」などのスコア関連表現
- 「合格」「不合格」「採用」「不採用」
- 否定的なラベリング

### 推奨表現
- 「〜を大切にする傾向があります」
- 「〜の場面で力を発揮しやすいです」
- 「〜のような環境で活躍しやすいでしょう」

## 出力フォーマット（JSON）
必ずJSONのみで返してください（説明文・前置き禁止）。

{
  "strengths": [
    {
      "title": "強みの見出し",
      "description": "具体的な行動傾向（ポジティブに表現）"
    }
  ],
  "leverage_tips": ["活かし方/工夫1", "工夫2", "工夫3"],
  "stress_tips": ["負荷が高い時の工夫1", "工夫2"],
  "values_tags": ["大事にしやすい価値観タグ1", "タグ2", "タグ3"],
  "note": "この結果の使い方に関する注意（80-140文字）"
}

## 生成ルール
- strengthsは3〜5件
- leverage_tipsは3件
- stress_tipsは2件
- values_tagsは3件（例：「チームワーク」「正確さ」「成長志向」など）
- 強みは"行動"で表現（例：「関係者の認識合わせを先に取る」）
- 注意点は直接は書かず、tips/stress_tipsで"対処"として表現
- noteには「この結果は傾向を示すものであり、実際の業務パフォーマンスを予測するものではありません」等の注意書きを含める`;

// =====================================================
// User Prompt Builder (Candidate Version)
// =====================================================

export interface CandidateAnalysisInput {
  scoringResult: ScoringResult;
  candidatePosition: string;
}

export function buildCandidatePrompt(input: CandidateAnalysisInput): string {
  const { scoringResult, candidatePosition } = input;

  // Build domain tendency section (without actual scores)
  const domainTendencyText = Object.entries(scoringResult.domainScores)
    .filter(([domain]) => domain !== 'VALID') // Exclude validity from candidate report
    .map(([domain, score]) => {
      const d = domain as Domain;
      const tendency = getTendencyDescription(d, score.percentage);
      return `- ${DOMAIN_LABELS[d]}: ${tendency}`;
    })
    .join('\n');

  return `## 検査結果の傾向
応募職種: ${candidatePosition}

${domainTendencyText}

上記の傾向から、この候補者の強み、活かし方のヒント、ストレス時の工夫、大事にしやすい価値観をJSON形式で出力してください。
候補者本人が見るレポートなので、建設的でポジティブな表現を心がけてください。`;
}

// =====================================================
// Response Parser (Candidate Version)
// =====================================================

export function parseCandidateResponse(response: string): CandidateReportOutput {
  try {
    const parsed = JSON.parse(extractJSON(response));
    return validateCandidateOutput(parsed);
  } catch (error) {
    throw new Error(`Failed to parse candidate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Extract JSON from response (handles markdown code blocks)
 */
function extractJSON(response: string): string {
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  return response.trim();
}

/**
 * Get tendency description for domain (without revealing score)
 */
function getTendencyDescription(domain: Domain, percentage: number): string {
  // Convert score to qualitative description
  const level = percentage >= 70 ? 'high' : percentage >= 40 ? 'medium' : 'low';

  const descriptions: Record<Domain, Record<'high' | 'medium' | 'low', string>> = {
    GOV: {
      high: 'ルールや手順を重視する傾向',
      medium: 'バランスを見ながら判断する傾向',
      low: '柔軟に状況に応じる傾向',
    },
    CONFLICT: {
      high: '自分の意見をしっかり伝える傾向',
      medium: '状況に応じて対話する傾向',
      low: '周囲との調和を大切にする傾向',
    },
    REL: {
      high: '他者との関係を大切にする傾向',
      medium: '適度な距離感を保つ傾向',
      low: '自立的に行動する傾向',
    },
    COG: {
      high: '慎重に物事を考える傾向',
      medium: 'バランスよく判断する傾向',
      low: '前向きに物事を捉える傾向',
    },
    WORK: {
      high: '計画的に業務を進める傾向',
      medium: '状況に応じて進める傾向',
      low: '臨機応変に対応する傾向',
    },
    VALID: {
      high: '',
      medium: '',
      low: '',
    },
  };

  return descriptions[domain][level];
}

/**
 * Validate candidate output structure
 */
function validateCandidateOutput(parsed: unknown): CandidateReportOutput {
  const obj = parsed as Record<string, unknown>;

  // Validate strengths
  if (!Array.isArray(obj.strengths) || obj.strengths.length === 0) {
    throw new Error('strengths must be a non-empty array');
  }
  const strengths = (obj.strengths as unknown[]).slice(0, 5).map(validateCandidateStrength);

  // Validate leverage_tips
  if (!Array.isArray(obj.leverage_tips) || obj.leverage_tips.length === 0) {
    throw new Error('leverage_tips must be a non-empty array');
  }
  const leverage_tips = (obj.leverage_tips as string[]).slice(0, 3);

  // Validate stress_tips
  if (!Array.isArray(obj.stress_tips) || obj.stress_tips.length === 0) {
    throw new Error('stress_tips must be a non-empty array');
  }
  const stress_tips = (obj.stress_tips as string[]).slice(0, 2);

  // Validate values_tags
  if (!Array.isArray(obj.values_tags) || obj.values_tags.length === 0) {
    throw new Error('values_tags must be a non-empty array');
  }
  const values_tags = (obj.values_tags as string[]).slice(0, 3);

  // Validate note
  if (typeof obj.note !== 'string' || obj.note.length === 0) {
    throw new Error('note must be a non-empty string');
  }

  return {
    strengths,
    leverage_tips,
    stress_tips,
    values_tags,
    note: obj.note as string,
  };
}

/**
 * Validate CandidateStrength structure
 */
function validateCandidateStrength(item: unknown): CandidateStrength {
  const obj = item as Record<string, unknown>;
  if (typeof obj.title !== 'string' || typeof obj.description !== 'string') {
    throw new Error('strength must have title and description strings');
  }
  return {
    title: obj.title,
    description: obj.description,
  };
}

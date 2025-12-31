// =====================================================
// Personality Analysis Prompts
// Generates behavioral, stress, EQ, and values analysis
// =====================================================

import type { ScoringResult } from './types';
import type {
  BehavioralAnalysisData,
  StressResilienceData,
  EQAnalysisData,
  ValuesAnalysisData,
} from '@/types/database';

// =====================================================
// Types
// =====================================================

export interface PersonalityAnalysisInput {
  scoringResult: ScoringResult;
  sjtAnswers: Record<string, string>;
  freeTextAnswer: string | null;
}

export interface PersonalityAnalysisOutput {
  behavioral: BehavioralAnalysisData;
  stress: StressResilienceData;
  eq: EQAnalysisData;
  values: ValuesAnalysisData;
}

// =====================================================
// System Prompt
// =====================================================

export const PERSONALITY_SYSTEM_PROMPT = `あなたは組織心理学と行動分析の専門家です。
適性検査の回答データから、候補者の性格特性を4つの観点で分析してください。

## 分析観点

### 1. 行動特性分析（DISC理論ベース）
- dominance（主導性）: 0-100 - 決断力、競争心、直接性
- influence（影響性）: 0-100 - 社交性、楽観性、協調性
- steadiness（安定性）: 0-100 - 忍耐力、一貫性、サポート志向
- conscientiousness（慎重性）: 0-100 - 正確性、分析力、品質志向
- overallType: 最も高い2つの要素の組み合わせ（例: "DI型（推進者）"）
- traits: 特徴的な行動傾向を3つ

### 2. ストレス耐性分析
- pressureHandling（プレッシャー対応）: 0-100
- recoverySpeed（回復力）: 0-100
- emotionalStability（感情安定性）: 0-100
- adaptability（適応力）: 0-100
- overallScore: 上記4つの加重平均
- riskLevel: "low" | "medium" | "high"
- metrics: 詳細な指標を3つ

### 3. EQ（感情知性）分析
- selfAwareness（自己認識）: 0-100
- selfManagement（自己管理）: 0-100
- socialAwareness（社会認識）: 0-100
- relationshipManagement（関係管理）: 0-100
- overallScore: 上記4つの加重平均
- dimensions: 詳細な次元を4つ

### 4. 価値観分析
- achievement（達成志向）: 0-100
- stability（安定志向）: 0-100
- growth（成長志向）: 0-100
- socialContribution（社会貢献志向）: 0-100
- autonomy（自律志向）: 0-100
- primaryValue: 最も強い価値観
- dimensions: 詳細な次元を5つ

## 回答形式
以下のJSON形式で回答してください。

{
  "behavioral": {
    "dominance": number,
    "influence": number,
    "steadiness": number,
    "conscientiousness": number,
    "traits": [
      {"name": "特性名", "score": number, "description": "説明"}
    ],
    "overallType": "XX型（タイプ名）"
  },
  "stress": {
    "pressureHandling": number,
    "recoverySpeed": number,
    "emotionalStability": number,
    "adaptability": number,
    "metrics": [
      {"name": "指標名", "score": number, "description": "説明"}
    ],
    "overallScore": number,
    "riskLevel": "low" | "medium" | "high"
  },
  "eq": {
    "selfAwareness": number,
    "selfManagement": number,
    "socialAwareness": number,
    "relationshipManagement": number,
    "dimensions": [
      {"name": "次元名", "score": number, "description": "説明"}
    ],
    "overallScore": number
  },
  "values": {
    "achievement": number,
    "stability": number,
    "growth": number,
    "socialContribution": number,
    "autonomy": number,
    "dimensions": [
      {"name": "価値観名", "score": number, "description": "説明"}
    ],
    "primaryValue": "最も強い価値観"
  }
}`;

// =====================================================
// Prompt Builder
// =====================================================

const DOMAIN_LABELS: Record<string, string> = {
  GOV: 'ガバナンス適合',
  CONFLICT: '対立処理',
  REL: '対人態度',
  COG: '認知スタイル',
  WORK: '業務遂行',
  VALID: '妥当性',
};

export function buildPersonalityPrompt(input: PersonalityAnalysisInput): string {
  const { scoringResult, sjtAnswers, freeTextAnswer } = input;

  const sjtSection = Object.entries(sjtAnswers)
    .map(([id, answer]) => `${id}: ${answer}`)
    .join('\n');

  const domainScoresSection = Object.entries(scoringResult.domainScores)
    .filter(([key]) => key !== 'VALID')
    .map(([key, value]) => `- ${DOMAIN_LABELS[key] || key}: ${value.percentage}%`)
    .join('\n');

  return `## 候補者データ

### カテゴリ別スコア
${domainScoresSection}

### 総合スコア
${scoringResult.overallScore}%

### 状況判断テスト回答
${sjtSection || '（回答なし）'}

### 自由記述回答
${freeTextAnswer || '（回答なし）'}

上記のデータを基に、4つの性格分析を実施してください。`;
}

// =====================================================
// Response Parser
// =====================================================

export function parsePersonalityResponse(content: string): PersonalityAnalysisOutput {
  try {
    const parsed = JSON.parse(content);

    // Validate and provide defaults
    const behavioral: BehavioralAnalysisData = {
      dominance: parsed.behavioral?.dominance ?? 50,
      influence: parsed.behavioral?.influence ?? 50,
      steadiness: parsed.behavioral?.steadiness ?? 50,
      conscientiousness: parsed.behavioral?.conscientiousness ?? 50,
      traits: parsed.behavioral?.traits ?? [],
      overallType: parsed.behavioral?.overallType ?? '未分類',
    };

    const stress: StressResilienceData = {
      pressureHandling: parsed.stress?.pressureHandling ?? 50,
      recoverySpeed: parsed.stress?.recoverySpeed ?? 50,
      emotionalStability: parsed.stress?.emotionalStability ?? 50,
      adaptability: parsed.stress?.adaptability ?? 50,
      metrics: parsed.stress?.metrics ?? [],
      overallScore: parsed.stress?.overallScore ?? 50,
      riskLevel: parsed.stress?.riskLevel ?? 'medium',
    };

    const eq: EQAnalysisData = {
      selfAwareness: parsed.eq?.selfAwareness ?? 50,
      selfManagement: parsed.eq?.selfManagement ?? 50,
      socialAwareness: parsed.eq?.socialAwareness ?? 50,
      relationshipManagement: parsed.eq?.relationshipManagement ?? 50,
      dimensions: parsed.eq?.dimensions ?? [],
      overallScore: parsed.eq?.overallScore ?? 50,
    };

    const values: ValuesAnalysisData = {
      achievement: parsed.values?.achievement ?? 50,
      stability: parsed.values?.stability ?? 50,
      growth: parsed.values?.growth ?? 50,
      socialContribution: parsed.values?.socialContribution ?? 50,
      autonomy: parsed.values?.autonomy ?? 50,
      dimensions: parsed.values?.dimensions ?? [],
      primaryValue: parsed.values?.primaryValue ?? '未分類',
    };

    return { behavioral, stress, eq, values };
  } catch (error) {
    console.error('Failed to parse personality response:', error);
    // Return default values on parse error
    return getDefaultPersonalityAnalysis();
  }
}

// =====================================================
// Default/Mock Data
// =====================================================

export function getDefaultPersonalityAnalysis(): PersonalityAnalysisOutput {
  return {
    behavioral: {
      dominance: 50,
      influence: 50,
      steadiness: 50,
      conscientiousness: 50,
      traits: [
        { name: 'バランス型', score: 50, description: '各特性がバランスよく発揮される傾向' },
      ],
      overallType: 'バランス型',
    },
    stress: {
      pressureHandling: 50,
      recoverySpeed: 50,
      emotionalStability: 50,
      adaptability: 50,
      metrics: [
        { name: '総合耐性', score: 50, description: '標準的なストレス耐性レベル' },
      ],
      overallScore: 50,
      riskLevel: 'medium',
    },
    eq: {
      selfAwareness: 50,
      selfManagement: 50,
      socialAwareness: 50,
      relationshipManagement: 50,
      dimensions: [
        { name: '総合EQ', score: 50, description: '標準的な感情知性レベル' },
      ],
      overallScore: 50,
    },
    values: {
      achievement: 50,
      stability: 50,
      growth: 50,
      socialContribution: 50,
      autonomy: 50,
      dimensions: [
        { name: '総合価値観', score: 50, description: 'バランスの取れた価値観構成' },
      ],
      primaryValue: 'バランス型',
    },
  };
}

/**
 * Generate mock personality analysis based on scoring result
 */
export function generateMockPersonalityAnalysis(
  scoringResult: ScoringResult
): PersonalityAnalysisOutput {
  const overall = scoringResult.overallScore;
  const domains = scoringResult.domainScores;

  // Derive personality scores from assessment domains
  const governanceScore = domains.GOV?.percentage ?? 50;
  const interpersonalScore = domains.REL?.percentage ?? 50;
  const workScore = domains.WORK?.percentage ?? 50;
  const cognitiveScore = domains.COG?.percentage ?? 50;
  const conflictScore = domains.CONFLICT?.percentage ?? 50;

  return {
    behavioral: {
      dominance: Math.min(100, Math.max(0, workScore + (cognitiveScore - 50) * 0.3)),
      influence: Math.min(100, Math.max(0, interpersonalScore + (conflictScore - 50) * 0.2)),
      steadiness: Math.min(100, Math.max(0, governanceScore + (workScore - 50) * 0.2)),
      conscientiousness: Math.min(100, Math.max(0, governanceScore + (cognitiveScore - 50) * 0.3)),
      traits: [
        {
          name: governanceScore >= 70 ? '規律性' : '柔軟性',
          score: governanceScore,
          description: governanceScore >= 70
            ? 'ルールや手順を重視し、組織の規範に沿った行動を取る傾向'
            : '状況に応じた柔軟な判断を好む傾向',
        },
        {
          name: interpersonalScore >= 70 ? '協調性' : '独立性',
          score: interpersonalScore,
          description: interpersonalScore >= 70
            ? 'チームでの協力を重視し、円滑な人間関係を構築する傾向'
            : '自分のペースで業務を進めることを好む傾向',
        },
        {
          name: workScore >= 70 ? '達成志向' : '安定志向',
          score: workScore,
          description: workScore >= 70
            ? '目標達成に向けて積極的に行動する傾向'
            : '着実な業務遂行を重視する傾向',
        },
      ],
      overallType: getDISCType(governanceScore, interpersonalScore, workScore, cognitiveScore),
    },
    stress: {
      pressureHandling: Math.min(100, Math.max(0, overall * 0.8 + conflictScore * 0.2)),
      recoverySpeed: Math.min(100, Math.max(0, cognitiveScore * 0.6 + interpersonalScore * 0.4)),
      emotionalStability: Math.min(100, Math.max(0, conflictScore * 0.7 + governanceScore * 0.3)),
      adaptability: Math.min(100, Math.max(0, cognitiveScore * 0.5 + workScore * 0.5)),
      metrics: [
        {
          name: 'プレッシャー下での判断力',
          score: Math.round(overall * 0.8 + conflictScore * 0.2),
          description: '高負荷状況での意思決定能力',
        },
        {
          name: 'ストレスからの回復',
          score: Math.round(cognitiveScore * 0.6 + interpersonalScore * 0.4),
          description: 'ネガティブな状況からの立ち直り速度',
        },
        {
          name: '変化への適応',
          score: Math.round(cognitiveScore * 0.5 + workScore * 0.5),
          description: '新しい状況や環境への順応能力',
        },
      ],
      overallScore: Math.round((overall + conflictScore + cognitiveScore) / 3),
      riskLevel: overall >= 70 ? 'low' : overall >= 50 ? 'medium' : 'high',
    },
    eq: {
      selfAwareness: Math.min(100, Math.max(0, cognitiveScore * 0.7 + overall * 0.3)),
      selfManagement: Math.min(100, Math.max(0, governanceScore * 0.5 + conflictScore * 0.5)),
      socialAwareness: Math.min(100, Math.max(0, interpersonalScore * 0.8 + conflictScore * 0.2)),
      relationshipManagement: Math.min(100, Math.max(0, interpersonalScore * 0.6 + conflictScore * 0.4)),
      dimensions: [
        {
          name: '自己認識',
          score: Math.round(cognitiveScore * 0.7 + overall * 0.3),
          description: '自分の感情や強み・弱みを理解する能力',
        },
        {
          name: '自己管理',
          score: Math.round(governanceScore * 0.5 + conflictScore * 0.5),
          description: '感情をコントロールし、目標に向かって行動する能力',
        },
        {
          name: '社会認識',
          score: Math.round(interpersonalScore * 0.8 + conflictScore * 0.2),
          description: '他者の感情や状況を理解する能力',
        },
        {
          name: '関係管理',
          score: Math.round(interpersonalScore * 0.6 + conflictScore * 0.4),
          description: '良好な人間関係を構築・維持する能力',
        },
      ],
      overallScore: Math.round((cognitiveScore + governanceScore + interpersonalScore + conflictScore) / 4),
    },
    values: {
      achievement: Math.min(100, Math.max(0, workScore * 0.8 + cognitiveScore * 0.2)),
      stability: Math.min(100, Math.max(0, governanceScore * 0.8 + interpersonalScore * 0.2)),
      growth: Math.min(100, Math.max(0, cognitiveScore * 0.7 + workScore * 0.3)),
      socialContribution: Math.min(100, Math.max(0, interpersonalScore * 0.6 + conflictScore * 0.4)),
      autonomy: Math.min(100, Math.max(0, cognitiveScore * 0.5 + workScore * 0.5)),
      dimensions: [
        {
          name: '達成志向',
          score: Math.round(workScore * 0.8 + cognitiveScore * 0.2),
          description: '目標達成や成果を重視する傾向',
        },
        {
          name: '安定志向',
          score: Math.round(governanceScore * 0.8 + interpersonalScore * 0.2),
          description: '安定した環境や予測可能性を重視する傾向',
        },
        {
          name: '成長志向',
          score: Math.round(cognitiveScore * 0.7 + workScore * 0.3),
          description: '学習や自己成長を重視する傾向',
        },
        {
          name: '社会貢献志向',
          score: Math.round(interpersonalScore * 0.6 + conflictScore * 0.4),
          description: '他者や社会への貢献を重視する傾向',
        },
        {
          name: '自律志向',
          score: Math.round(cognitiveScore * 0.5 + workScore * 0.5),
          description: '自分で判断し行動することを重視する傾向',
        },
      ],
      primaryValue: getPrimaryValue(workScore, governanceScore, cognitiveScore, interpersonalScore),
    },
  };
}

function getDISCType(governance: number, interpersonal: number, work: number, cognitive: number): string {
  const scores = [
    { type: 'D', score: work + (cognitive - 50) * 0.3, name: '主導' },
    { type: 'I', score: interpersonal, name: '影響' },
    { type: 'S', score: governance + (work - 50) * 0.2, name: '安定' },
    { type: 'C', score: governance + (cognitive - 50) * 0.3, name: '慎重' },
  ];

  scores.sort((a, b) => b.score - a.score);
  const top = scores[0];
  const second = scores[1];

  const typeNames: Record<string, string> = {
    'DI': '推進者',
    'ID': '促進者',
    'DS': '結果志向',
    'SD': '実行者',
    'DC': '分析者',
    'CD': '完璧主義者',
    'IS': '支援者',
    'SI': '調整者',
    'IC': '専門家',
    'CI': '評価者',
    'SC': '安定志向',
    'CS': '慎重派',
  };

  const typeKey = top.type + second.type;
  return `${typeKey}型（${typeNames[typeKey] || 'バランス型'}）`;
}

function getPrimaryValue(work: number, governance: number, cognitive: number, interpersonal: number): string {
  const values = [
    { name: '達成志向', score: work * 0.8 + cognitive * 0.2 },
    { name: '安定志向', score: governance * 0.8 + interpersonal * 0.2 },
    { name: '成長志向', score: cognitive * 0.7 + work * 0.3 },
    { name: '社会貢献志向', score: interpersonal * 0.6 + governance * 0.4 },
    { name: '自律志向', score: cognitive * 0.5 + work * 0.5 },
  ];

  values.sort((a, b) => b.score - a.score);
  return values[0].name;
}

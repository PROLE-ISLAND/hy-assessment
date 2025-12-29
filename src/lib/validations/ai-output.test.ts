// =====================================================
// AI Output Validation Schema Tests
// =====================================================

import { describe, it, expect } from 'vitest';
import {
  enhancedStrengthSchema,
  enhancedWatchoutSchema,
  riskScenarioSchema,
  interviewCheckSchema,
  enhancedAIAnalysisOutputSchema,
  legacyAIAnalysisOutputSchema,
  validateEnhancedAnalysisOutput,
  validateLegacyAnalysisOutput,
  formatValidationErrors,
} from './ai-output';

describe('enhancedStrengthSchema', () => {
  it('should accept valid strength', () => {
    const result = enhancedStrengthSchema.safeParse({
      title: '論理的思考力',
      behavior: '複雑な問題を分解して整理する傾向がある',
      evidence: 'GOV高傾向（72%）に基づく',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing title', () => {
    const result = enhancedStrengthSchema.safeParse({
      behavior: 'some behavior',
      evidence: 'some evidence',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty strings', () => {
    const result = enhancedStrengthSchema.safeParse({
      title: '',
      behavior: 'some behavior',
      evidence: 'some evidence',
    });
    expect(result.success).toBe(false);
  });
});

describe('enhancedWatchoutSchema', () => {
  it('should accept valid watchout', () => {
    const result = enhancedWatchoutSchema.safeParse({
      title: '柔軟性の課題',
      risk: '急な方針変更時に戸惑いやすい傾向',
      evidence: 'GOV高傾向に基づく',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing risk field', () => {
    const result = enhancedWatchoutSchema.safeParse({
      title: 'some title',
      evidence: 'some evidence',
    });
    expect(result.success).toBe(false);
  });
});

describe('riskScenarioSchema', () => {
  it('should accept valid risk scenario', () => {
    const result = riskScenarioSchema.safeParse({
      condition: '急な方針変更が求められる場面',
      symptom: '判断に時間がかかりやすい',
      impact: '業務の遅延につながる可能性',
      prevention: '事前に想定外のケースについて共有する',
      risk_environment: ['変化の激しい部署', 'スタートアップ'],
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty risk_environment', () => {
    const result = riskScenarioSchema.safeParse({
      condition: 'some condition',
      symptom: 'some symptom',
      impact: 'some impact',
      prevention: 'some prevention',
      risk_environment: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('interviewCheckSchema', () => {
  it('should accept valid interview check', () => {
    const result = interviewCheckSchema.safeParse({
      question: '予期せぬ変更があった際、どのように対応しましたか？',
      intent: '柔軟性の確認',
      look_for: '具体的なエピソードと対処法',
    });
    expect(result.success).toBe(true);
  });
});

describe('enhancedAIAnalysisOutputSchema', () => {
  const validOutput = {
    strengths: [
      { title: '強み1', behavior: '行動1', evidence: '根拠1' },
    ],
    watchouts: [
      { title: '注意点1', risk: 'リスク1', evidence: '根拠1' },
    ],
    risk_scenarios: [
      {
        condition: '条件1',
        symptom: '症状1',
        impact: '影響1',
        prevention: '予防1',
        risk_environment: ['環境1'],
      },
    ],
    interview_checks: [
      { question: '質問1', intent: '意図1', look_for: 'ポイント1' },
    ],
    summary: '総括テキスト',
    recommendation: '推奨事項',
  };

  it('should accept valid enhanced output', () => {
    const result = enhancedAIAnalysisOutputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  it('should reject empty strengths array', () => {
    const result = enhancedAIAnalysisOutputSchema.safeParse({
      ...validOutput,
      strengths: [],
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing summary', () => {
    const result = enhancedAIAnalysisOutputSchema.safeParse({
      ...validOutput,
      summary: undefined,
    });
    expect(result.success).toBe(false);
  });

  it('should reject extra items beyond max', () => {
    const result = enhancedAIAnalysisOutputSchema.safeParse({
      ...validOutput,
      strengths: Array(10).fill(validOutput.strengths[0]),
    });
    // Schema allows max 5, so this should fail
    expect(result.success).toBe(false);
  });
});

describe('legacyAIAnalysisOutputSchema', () => {
  const validOutput = {
    strengths: ['強み1', '強み2'],
    weaknesses: ['弱み1', '弱み2'],
    summary: '総括テキスト',
    recommendation: '推奨事項',
  };

  it('should accept valid legacy output', () => {
    const result = legacyAIAnalysisOutputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  it('should reject empty weaknesses array', () => {
    const result = legacyAIAnalysisOutputSchema.safeParse({
      ...validOutput,
      weaknesses: [],
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty string in strengths', () => {
    const result = legacyAIAnalysisOutputSchema.safeParse({
      ...validOutput,
      strengths: ['', '強み2'],
    });
    expect(result.success).toBe(false);
  });
});

describe('validateEnhancedAnalysisOutput', () => {
  it('should return success for valid data', () => {
    const result = validateEnhancedAnalysisOutput({
      strengths: [{ title: 't', behavior: 'b', evidence: 'e' }],
      watchouts: [{ title: 't', risk: 'r', evidence: 'e' }],
      risk_scenarios: [{
        condition: 'c', symptom: 's', impact: 'i', prevention: 'p', risk_environment: ['e'],
      }],
      interview_checks: [{ question: 'q', intent: 'i', look_for: 'l' }],
      summary: 'summary',
      recommendation: 'recommendation',
    });
    expect(result.success).toBe(true);
  });
});

describe('validateLegacyAnalysisOutput', () => {
  it('should return success for valid data', () => {
    const result = validateLegacyAnalysisOutput({
      strengths: ['strength 1'],
      weaknesses: ['weakness 1'],
      summary: 'summary',
      recommendation: 'recommendation',
    });
    expect(result.success).toBe(true);
  });
});

describe('formatValidationErrors', () => {
  it('should format errors with path', () => {
    const result = enhancedAIAnalysisOutputSchema.safeParse({});
    if (!result.success) {
      const formatted = formatValidationErrors(result.error);
      expect(formatted).toContain('strengths');
    }
  });
});

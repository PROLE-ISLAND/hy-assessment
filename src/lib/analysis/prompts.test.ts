// =====================================================
// AI Analysis Prompts Tests
// =====================================================

import { describe, it, expect } from 'vitest';
import { parseEnhancedAnalysisResponse, parseAnalysisResponse } from './prompts';

describe('parseEnhancedAnalysisResponse', () => {
  const validResponse = JSON.stringify({
    strengths: [
      { title: '論理的思考力', behavior: '複雑な問題を分解して整理する', evidence: 'GOV高傾向' },
    ],
    watchouts: [
      { title: '柔軟性', risk: '急な変更に戸惑いやすい', evidence: 'GOV高傾向' },
    ],
    risk_scenarios: [
      {
        condition: '急な方針変更時',
        symptom: '判断に時間がかかる',
        impact: '業務遅延',
        prevention: '事前共有',
        risk_environment: ['変化の激しい部署'],
      },
    ],
    interview_checks: [
      { question: '変更対応の経験は？', intent: '柔軟性確認', look_for: '具体例' },
    ],
    summary: '総括テキスト',
    recommendation: '推奨事項',
  });

  it('should parse valid JSON response', () => {
    const result = parseEnhancedAnalysisResponse(validResponse);
    expect(result.strengths).toHaveLength(1);
    expect(result.watchouts).toHaveLength(1);
    expect(result.risk_scenarios).toHaveLength(1);
    expect(result.interview_checks).toHaveLength(1);
    expect(result.summary).toBe('総括テキスト');
    expect(result.recommendation).toBe('推奨事項');
  });

  it('should extract JSON from markdown code block', () => {
    const markdownResponse = `Here is the analysis:\n\`\`\`json\n${validResponse}\n\`\`\``;
    const result = parseEnhancedAnalysisResponse(markdownResponse);
    expect(result.strengths).toHaveLength(1);
  });

  it('should throw on invalid JSON', () => {
    expect(() => parseEnhancedAnalysisResponse('not json')).toThrow('Failed to parse enhanced AI response');
  });

  it('should throw on missing required fields', () => {
    const invalidResponse = JSON.stringify({ summary: 'only summary' });
    expect(() => parseEnhancedAnalysisResponse(invalidResponse)).toThrow('Schema validation failed');
  });

  it('should limit arrays to max counts', () => {
    const manyItems = {
      strengths: Array(10).fill({ title: 't', behavior: 'b', evidence: 'e' }),
      watchouts: Array(10).fill({ title: 't', risk: 'r', evidence: 'e' }),
      risk_scenarios: Array(10).fill({
        condition: 'c', symptom: 's', impact: 'i', prevention: 'p', risk_environment: ['e'],
      }),
      interview_checks: Array(10).fill({ question: 'q', intent: 'i', look_for: 'l' }),
      summary: 'summary',
      recommendation: 'recommendation',
    };
    // Schema rejects more than max items
    expect(() => parseEnhancedAnalysisResponse(JSON.stringify(manyItems))).toThrow();
  });
});

describe('parseAnalysisResponse (legacy)', () => {
  const validResponse = JSON.stringify({
    strengths: ['強み1', '強み2'],
    weaknesses: ['弱み1', '弱み2'],
    summary: '総括テキスト',
    recommendation: '推奨事項',
  });

  it('should parse valid JSON response', () => {
    const result = parseAnalysisResponse(validResponse);
    expect(result.strengths).toEqual(['強み1', '強み2']);
    expect(result.weaknesses).toEqual(['弱み1', '弱み2']);
    expect(result.summary).toBe('総括テキスト');
    expect(result.recommendation).toBe('推奨事項');
  });

  it('should extract JSON from markdown code block', () => {
    const markdownResponse = `\`\`\`\n${validResponse}\n\`\`\``;
    const result = parseAnalysisResponse(markdownResponse);
    expect(result.strengths).toHaveLength(2);
  });

  it('should throw on invalid JSON', () => {
    expect(() => parseAnalysisResponse('{')).toThrow('Failed to parse AI response');
  });

  it('should throw on empty arrays', () => {
    const invalidResponse = JSON.stringify({
      strengths: [],
      weaknesses: ['弱み'],
      summary: '総括',
      recommendation: '推奨',
    });
    expect(() => parseAnalysisResponse(invalidResponse)).toThrow('Schema validation failed');
  });
});

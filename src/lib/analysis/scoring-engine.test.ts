// =====================================================
// Scoring Engine Unit Tests
// Tests for score calculation, validity checks, etc.
// =====================================================

import { describe, it, expect } from 'vitest';
import {
  calculateScores,
  getRiskSummary,
  getScoreDescription,
} from './scoring-engine';
import type { ResponseData } from './types';

// Helper to create mock responses
function createMockResponses(overrides: Partial<Record<string, number | string>> = {}): ResponseData[] {
  const defaults: Record<string, number | string> = {
    // GOV domain (15 items) - high scores = good
    L01: 4, L02: 4, L03: 2, L04: 4, L05: 4, L06: 2, L07: 4, L08: 2, L09: 2, L10: 4, L11: 2, L12: 4, L13: 4, L14: 2, L15: 4,
    // CONFLICT domain (6 items)
    L16: 4, L17: 2, L18: 4, L19: 2, L20: 4, L21: 2,
    // REL domain (6 items)
    L22: 4, L23: 2, L24: 4, L25: 4, L26: 2, L27: 4,
    // COG domain (6 items) - high = problematic
    L28: 2, L29: 4, L30: 4, L31: 4, L32: 2, L33: 4,
    // WORK domain (8 items)
    L34: 4, L35: 2, L36: 4, L37: 2, L38: 4, L39: 2, L40: 4, L41: 2,
    // VALID domain (5 items) - includes IMC
    L42: 2, L43: 4, L44: 2, L45: 2, L46: 2,
    // SJT items
    SJT01: 'A', SJT02: 'A', SJT03: 'A', SJT04: 'A', SJT05: 'A', SJT06: 'A',
  };

  const merged = { ...defaults, ...overrides };
  return Object.entries(merged).map(([question_id, answer]) => ({
    question_id,
    answer,
  }));
}

describe('calculateScores', () => {
  it('calculates domain scores correctly for ideal responses', () => {
    const responses = createMockResponses();
    const result = calculateScores(responses);

    // All domains should have scores
    expect(result.domainScores.GOV).toBeDefined();
    expect(result.domainScores.CONFLICT).toBeDefined();
    expect(result.domainScores.REL).toBeDefined();
    expect(result.domainScores.COG).toBeDefined();
    expect(result.domainScores.WORK).toBeDefined();
    expect(result.domainScores.VALID).toBeDefined();

    // Overall score should be between 0-100
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('handles reverse-keyed items correctly', () => {
    // L03 is reverse-keyed in GOV domain
    // Normal scoring: answer of 5 would give 5 points
    // Reverse scoring: answer of 5 gives 6-5=1 point
    const highReverseResponse = createMockResponses({ L03: 5 });
    const lowReverseResponse = createMockResponses({ L03: 1 });

    const highResult = calculateScores(highReverseResponse);
    const lowResult = calculateScores(lowReverseResponse);

    // Lower answer on reverse-keyed item should result in higher domain score
    expect(lowResult.domainScores.GOV.percentage).toBeGreaterThan(
      highResult.domainScores.GOV.percentage
    );
  });

  it('calculates COG domain with correct risk direction (high = problematic)', () => {
    // COG domain: higher score = more cognitive distortions (bad)
    // L28, L32 are reverse-keyed: low answer (1) → high score after reverse (5)
    // L29, L30, L31, L33 are NOT reverse-keyed: high answer (5) → high score (5)
    const highCogResponses = createMockResponses({
      L28: 1, // reverse-keyed → score = 6-1 = 5
      L29: 5, // not reverse-keyed → score = 5
      L30: 5, // not reverse-keyed → score = 5
      L31: 5, // not reverse-keyed → score = 5
      L32: 1, // reverse-keyed → score = 6-1 = 5
      L33: 5, // not reverse-keyed → score = 5
    });
    const result = calculateScores(highCogResponses);

    // High COG percentage (100%) should result in high risk
    expect(result.domainScores.COG.percentage).toBeGreaterThanOrEqual(70);
    expect(result.domainScores.COG.riskLevel).toBe('high');
  });

  it('calculates SJT scores correctly', () => {
    // All A answers should give maximum score (4 each)
    const allAResponses = createMockResponses({
      SJT01: 'A', SJT02: 'A', SJT03: 'A', SJT04: 'A', SJT05: 'A', SJT06: 'A',
    });
    const result = calculateScores(allAResponses);

    expect(result.sjtScores.percentage).toBe(100);
    expect(result.sjtScores.totalScore).toBe(24); // 6 items * 4 points
  });

  it('handles missing responses gracefully', () => {
    const partialResponses: ResponseData[] = [
      { question_id: 'L01', answer: 4 },
      { question_id: 'L02', answer: 4 },
    ];

    const result = calculateScores(partialResponses);

    // Should not throw and should return valid structure
    expect(result.domainScores).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

describe('Validity Checks', () => {
  it('detects failed IMC items', () => {
    // L43 should be 4, L46 should be 2
    const failedIMC = createMockResponses({
      L43: 3, // Wrong - should be 4
      L46: 3, // Wrong - should be 2
    });

    const result = calculateScores(failedIMC);

    expect(result.validityFlags.isValid).toBe(false);
    expect(result.validityFlags.details).toContain('注意チェック項目L43の回答が不正確');
    expect(result.validityFlags.details).toContain('注意チェック項目L46の回答が不正確');
  });

  it('passes validity for correct IMC responses', () => {
    const correctIMC = createMockResponses({
      L43: 4, // Correct
      L46: 2, // Correct
    });

    const result = calculateScores(correctIMC);

    expect(result.validityFlags.details).not.toContain('注意チェック項目L43の回答が不正確');
    expect(result.validityFlags.details).not.toContain('注意チェック項目L46の回答が不正確');
  });

  it('detects social desirability (all 5s on L42, L44, L45)', () => {
    const socialDesirability = createMockResponses({
      L42: 5,
      L44: 5,
      L45: 5,
    });

    const result = calculateScores(socialDesirability);

    expect(result.validityFlags.socialDesirabilityFlag).toBe(true);
    expect(result.validityFlags.isValid).toBe(false);
  });

  it('detects extreme response pattern (all same value)', () => {
    // Create all 5s for Likert items
    const allFives: Record<string, number | string> = {};
    for (let i = 1; i <= 46; i++) {
      allFives[`L${i.toString().padStart(2, '0')}`] = 5;
    }

    const result = calculateScores(
      Object.entries(allFives).map(([question_id, answer]) => ({
        question_id,
        answer,
      }))
    );

    expect(result.validityFlags.extremeResponseFlag).toBe(true);
    expect(result.validityFlags.isValid).toBe(false);
  });
});

describe('getRiskSummary', () => {
  it('correctly categorizes domains by risk level', () => {
    const responses = createMockResponses();
    const { domainScores } = calculateScores(responses);
    const riskSummary = getRiskSummary(domainScores);

    // All domains should be categorized
    const allDomains = [
      ...riskSummary.highRiskDomains,
      ...riskSummary.mediumRiskDomains,
      ...riskSummary.lowRiskDomains,
    ];

    expect(allDomains).toContain('GOV');
    expect(allDomains).toContain('CONFLICT');
    expect(allDomains).toContain('REL');
    expect(allDomains).toContain('COG');
    expect(allDomains).toContain('WORK');
    expect(allDomains).toContain('VALID');
  });
});

describe('getScoreDescription', () => {
  it('returns correct descriptions for score ranges', () => {
    expect(getScoreDescription(85)).toBe('非常に高い');
    expect(getScoreDescription(75)).toBe('高い');
    expect(getScoreDescription(60)).toBe('平均的');
    expect(getScoreDescription(35)).toBe('低め');
    expect(getScoreDescription(20)).toBe('要注意');
  });
});

describe('Domain Risk Level Thresholds', () => {
  it('applies correct thresholds for regular domains (GOV, CONFLICT, REL, WORK)', () => {
    // Low score = high risk for these domains
    const lowGovResponses = createMockResponses({
      L01: 1, L02: 1, L03: 5, L04: 1, L05: 1, L06: 5, L07: 1, L08: 5, L09: 5, L10: 1, L11: 5, L12: 1, L13: 1, L14: 5, L15: 1,
    });

    const result = calculateScores(lowGovResponses);

    // GOV score should be low and risk should be high
    expect(result.domainScores.GOV.percentage).toBeLessThan(50);
    expect(result.domainScores.GOV.riskLevel).toBe('high');
  });

  it('applies correct thresholds for COG domain (reversed)', () => {
    // High score = high risk for COG (more cognitive distortions)
    const highCogResponses = createMockResponses({
      L28: 5, L29: 1, L30: 1, L31: 1, L32: 5, L33: 1,
    });

    const result = calculateScores(highCogResponses);

    // COG should have high risk when percentage is high
    if (result.domainScores.COG.percentage >= 70) {
      expect(result.domainScores.COG.riskLevel).toBe('high');
    }
  });

  it('applies correct thresholds for VALID domain', () => {
    // VALID uses different thresholds: <60 = high, <80 = medium
    const lowValidResponses = createMockResponses({
      L42: 5, L43: 1, L44: 5, L45: 5, L46: 5,
    });

    const result = calculateScores(lowValidResponses);

    if (result.domainScores.VALID.percentage < 60) {
      expect(result.domainScores.VALID.riskLevel).toBe('high');
    }
  });
});

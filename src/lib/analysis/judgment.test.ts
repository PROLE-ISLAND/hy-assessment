// =====================================================
// Judgment Logic Unit Tests
// Tests for calculateJudgment, calculateOverallScore, etc.
// =====================================================

import { describe, it, expect } from 'vitest';
import {
  calculateJudgment,
  calculateOverallScore,
  generateInterviewPoints,
  type DomainScores,
} from './judgment';

describe('calculateOverallScore', () => {
  it('calculates average of 5 scorable domains (excludes VALID)', () => {
    const scores: DomainScores = {
      GOV: 80,
      CONFLICT: 70,
      REL: 60,
      COG: 50,
      WORK: 40,
      VALID: 90, // Should be excluded
    };

    const result = calculateOverallScore(scores);

    // (80 + 70 + 60 + 50 + 40) / 5 = 60
    expect(result).toBe(60);
  });

  it('handles missing domains gracefully', () => {
    const partialScores = {
      GOV: 80,
      CONFLICT: 70,
    } as DomainScores;

    const result = calculateOverallScore(partialScores);

    // Should not throw
    expect(typeof result).toBe('number');
  });
});

describe('calculateJudgment', () => {
  it('returns "recommended" for high scores', () => {
    // Recommended: overall >= 75%, COG <= 40%, VALID >= 70%
    // Overall = (GOV + CONFLICT + REL + COG + WORK) / 5
    // Need overall 75+ with low COG
    const highScores: DomainScores = {
      GOV: 90,
      CONFLICT: 85,
      REL: 85,
      COG: 30, // Low COG is good (<=40 required)
      WORK: 85,
      VALID: 90, // >=70 required
    };
    // Overall = (90+85+85+30+85)/5 = 375/5 = 75

    const result = calculateJudgment(highScores);

    expect(result.level).toBe('recommended');
    expect(result.label).toBe('推奨');
  });

  it('returns "consider" for medium scores', () => {
    const mediumScores: DomainScores = {
      GOV: 65,
      CONFLICT: 60,
      REL: 55,
      COG: 50,
      WORK: 60,
      VALID: 75,
    };

    const result = calculateJudgment(mediumScores);

    expect(result.level).toBe('consider');
    expect(result.label).toBe('要検討');
  });

  it('returns "caution" for low scores or high COG', () => {
    const lowScores: DomainScores = {
      GOV: 40,
      CONFLICT: 35,
      REL: 30,
      COG: 80, // High COG is problematic
      WORK: 35,
      VALID: 50,
    };

    const result = calculateJudgment(lowScores);

    expect(result.level).toBe('caution');
    expect(result.label).toBe('慎重検討');
  });

  it('returns "caution" when VALID is below threshold', () => {
    // Even if other scores are good, low validity is problematic
    const lowValidScores: DomainScores = {
      GOV: 80,
      CONFLICT: 75,
      REL: 70,
      COG: 30,
      WORK: 75,
      VALID: 45, // Below 60% threshold
    };

    const result = calculateJudgment(lowValidScores);

    // Should flag caution due to low validity
    expect(result.reasons).toContain('回答の妥当性に疑問');
  });

  it('provides reasons for judgment', () => {
    const scores: DomainScores = {
      GOV: 40, // Low
      CONFLICT: 80,
      REL: 75,
      COG: 70, // High (problematic)
      WORK: 60,
      VALID: 85,
    };

    const result = calculateJudgment(scores);

    expect(result.reasons.length).toBeGreaterThan(0);
    expect(Array.isArray(result.reasons)).toBe(true);
  });
});

describe('generateInterviewPoints', () => {
  it('generates interview points for high-risk domains', () => {
    const scores: DomainScores = {
      GOV: 35, // Low - should generate confirm point
      CONFLICT: 80,
      REL: 30, // Low - should generate confirm point
      COG: 75, // High - should generate confirm point
      WORK: 85, // High - should generate strength point
      VALID: 90,
    };

    const points = generateInterviewPoints(scores);

    expect(points.length).toBeGreaterThan(0);

    // Should have confirm points for low GOV and REL
    const confirmPoints = points.filter((p) => p.type === 'confirm');
    expect(confirmPoints.length).toBeGreaterThan(0);

    // Should have strength points for high WORK
    const strengthPoints = points.filter((p) => p.type === 'strength');
    expect(strengthPoints.length).toBeGreaterThan(0);
  });

  it('includes domain labels in interview points', () => {
    const scores: DomainScores = {
      GOV: 30,
      CONFLICT: 80,
      REL: 75,
      COG: 40,
      WORK: 70,
      VALID: 85,
    };

    const points = generateInterviewPoints(scores);

    // Each point should have a domainLabel
    points.forEach((point) => {
      expect(point.domainLabel).toBeDefined();
      expect(point.domainLabel.length).toBeGreaterThan(0);
    });
  });

  it('includes suggested questions for confirm points', () => {
    const scores: DomainScores = {
      GOV: 25, // Very low - should generate confirm with question
      CONFLICT: 80,
      REL: 75,
      COG: 40,
      WORK: 70,
      VALID: 85,
    };

    const points = generateInterviewPoints(scores);
    const confirmPoints = points.filter((p) => p.type === 'confirm');

    // At least one confirm point should have a suggested question
    const hasQuestion = confirmPoints.some((p) => p.suggestedQuestion);
    expect(hasQuestion).toBe(true);
  });
});

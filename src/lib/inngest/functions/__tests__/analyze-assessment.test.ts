// =====================================================
// Analyze Assessment Integration Tests
// Verifies that all analysis functions are properly integrated
// Issue #160: Prevent integration gaps like missing function calls
// =====================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          returns: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })),
}));

// Mock email functions
vi.mock('@/lib/email', () => ({
  sendAssessmentCompletion: vi.fn(),
  sendReportLink: vi.fn(),
}));

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-report-token-12345678901234567890'),
}));

// Import the actual analyzer functions to verify they exist and are exported
import * as aiAnalyzer from '@/lib/analysis/ai-analyzer';

describe('analyze-assessment integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AI Analyzer exports', () => {
    it('should export analyzeAssessmentFull function', () => {
      expect(aiAnalyzer.analyzeAssessmentFull).toBeDefined();
      expect(typeof aiAnalyzer.analyzeAssessmentFull).toBe('function');
    });

    it('should export analyzeAssessmentFullMock function', () => {
      expect(aiAnalyzer.analyzeAssessmentFullMock).toBeDefined();
      expect(typeof aiAnalyzer.analyzeAssessmentFullMock).toBe('function');
    });

    it('should export generatePersonalityAnalysis function', () => {
      expect(aiAnalyzer.generatePersonalityAnalysis).toBeDefined();
      expect(typeof aiAnalyzer.generatePersonalityAnalysis).toBe('function');
    });

    it('should export generatePersonalityAnalysisMock function', () => {
      expect(aiAnalyzer.generatePersonalityAnalysisMock).toBeDefined();
      expect(typeof aiAnalyzer.generatePersonalityAnalysisMock).toBe('function');
    });
  });

  describe('Mock analysis result structure', () => {
    it('analyzeAssessmentFullMock should return complete result structure', async () => {
      const mockInput = {
        responses: [{ question_id: 'q1', answer: 'test' }],
        candidatePosition: 'engineer',
        organizationId: 'org-123',
      };

      const result = await aiAnalyzer.analyzeAssessmentFullMock(mockInput);

      // Verify scoring result exists
      expect(result.scoringResult).toBeDefined();
      expect(result.scoringResult.domainScores).toBeDefined();

      // Verify internal report exists
      expect(result.internalReport).toBeDefined();
      expect(result.internalReport.strengths).toBeDefined();
      expect(result.internalReport.watchouts).toBeDefined();
      expect(result.internalReport.summary).toBeDefined();
      expect(result.internalReport.recommendation).toBeDefined();

      // Verify candidate report exists
      expect(result.candidateReport).toBeDefined();

      // Verify metadata
      expect(result.modelVersion).toBeDefined();
      expect(result.promptVersion).toBeDefined();
    });

    it('generatePersonalityAnalysisMock should return all 4 personality dimensions', async () => {
      const mockInput = {
        responses: [{ question_id: 'q1', answer: 'test' }],
        candidatePosition: 'engineer',
        scoringResult: {
          domainScores: {
            GOV: { percentage: 70 },
            CONFLICT: { percentage: 65 },
            REL: { percentage: 80 },
            COG: { percentage: 75 },
            WORK: { percentage: 60 },
            VALID: { percentage: 85 },
          },
        },
      };

      const result = await aiAnalyzer.generatePersonalityAnalysisMock(mockInput);

      // Verify all 4 personality dimensions are present
      expect(result.behavioral).toBeDefined();
      expect(result.stress).toBeDefined();
      expect(result.eq).toBeDefined();
      expect(result.values).toBeDefined();

      // Verify behavioral (DISC) structure
      expect(result.behavioral.dominance).toBeDefined();
      expect(result.behavioral.influence).toBeDefined();
      expect(result.behavioral.steadiness).toBeDefined();
      expect(result.behavioral.conscientiousness).toBeDefined();
      expect(result.behavioral.overallType).toBeDefined();

      // Verify stress structure
      expect(result.stress.pressureHandling).toBeDefined();
      expect(result.stress.recoverySpeed).toBeDefined();
      expect(result.stress.emotionalStability).toBeDefined();
      expect(result.stress.adaptability).toBeDefined();
      expect(result.stress.metrics).toBeDefined();
      expect(Array.isArray(result.stress.metrics)).toBe(true);

      // Verify EQ structure
      expect(result.eq.selfAwareness).toBeDefined();
      expect(result.eq.selfManagement).toBeDefined();
      expect(result.eq.socialAwareness).toBeDefined();
      expect(result.eq.relationshipManagement).toBeDefined();
      expect(result.eq.dimensions).toBeDefined();
      expect(Array.isArray(result.eq.dimensions)).toBe(true);
      expect(result.eq.overallScore).toBeDefined();

      // Verify values structure
      expect(result.values.achievement).toBeDefined();
      expect(result.values.stability).toBeDefined();
      expect(result.values.growth).toBeDefined();
      expect(result.values.socialContribution).toBeDefined();
      expect(result.values.autonomy).toBeDefined();
      expect(result.values.dimensions).toBeDefined();
      expect(Array.isArray(result.values.dimensions)).toBe(true);
      expect(result.values.primaryValue).toBeDefined();
    });
  });

  describe('Integration verification', () => {
    it('analyze-assessment.ts should import personality analysis functions', async () => {
      // Read the actual source file to verify imports
      // This is a static check that ensures the integration exists
      const fs = await import('fs/promises');
      const path = await import('path');

      const sourceCode = await fs.readFile(
        path.join(process.cwd(), 'src/lib/inngest/functions/analyze-assessment.ts'),
        'utf-8'
      );

      // Verify generatePersonalityAnalysis import
      expect(sourceCode).toContain('generatePersonalityAnalysis');
      expect(sourceCode).toContain('generatePersonalityAnalysisMock');

      // Verify personality analysis step exists
      expect(sourceCode).toContain('run-personality-analysis');

      // Verify personality fields are saved to DB
      expect(sourceCode).toContain('personality_behavioral');
      expect(sourceCode).toContain('personality_stress');
      expect(sourceCode).toContain('personality_eq');
      expect(sourceCode).toContain('personality_values');
    });
  });
});

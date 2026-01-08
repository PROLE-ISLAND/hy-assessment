// =====================================================
// Candidate Validation Tests
// Issue #215: UC-ASSESS-CANDIDATE-DIRECT-WEB
// Includes anonymousCandidateRegisterSchema tests for direct assessment flow
// =====================================================

import { describe, it, expect } from 'vitest';
import {
  candidateCreateSchema,
  candidateUpdateSchema,
  candidateSearchSchema,
  validateCandidateCreate,
  anonymousCandidateRegisterSchema,
  validateAnonymousCandidateRegister,
} from './candidate';

describe('candidateCreateSchema', () => {
  it('validates correct input', () => {
    const validInput = {
      name: '山田太郎',
      email: 'yamada@example.com',
      desiredPositions: ['engineering'],
    };

    const result = candidateCreateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('validates with optional notes', () => {
    const validInput = {
      name: '山田太郎',
      email: 'yamada@example.com',
      desiredPositions: ['engineering', 'manager'],
      notes: 'テスト備考',
    };

    const result = candidateCreateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const invalidInput = {
      name: '',
      email: 'test@example.com',
      desiredPositions: ['engineering'],
    };

    const result = candidateCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('氏名');
    }
  });

  it('rejects invalid email', () => {
    const invalidInput = {
      name: '山田太郎',
      email: 'not-an-email',
      desiredPositions: ['engineering'],
    };

    const result = candidateCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('メールアドレス');
    }
  });

  it('rejects empty positions array', () => {
    const invalidInput = {
      name: '山田太郎',
      email: 'test@example.com',
      desiredPositions: [],
    };

    const result = candidateCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('希望職種');
    }
  });

  it('rejects invalid position value', () => {
    const invalidInput = {
      name: '山田太郎',
      email: 'test@example.com',
      desiredPositions: ['invalid-position'],
    };

    const result = candidateCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it('rejects more than 5 positions', () => {
    const invalidInput = {
      name: '山田太郎',
      email: 'test@example.com',
      desiredPositions: [
        'executive',
        'manager',
        'specialist',
        'sales',
        'engineering',
        'support',
      ],
    };

    const result = candidateCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('5つまで');
    }
  });

  it('rejects notes over 1000 characters', () => {
    const invalidInput = {
      name: '山田太郎',
      email: 'test@example.com',
      desiredPositions: ['engineering'],
      notes: 'a'.repeat(1001),
    };

    const result = candidateCreateSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('1000文字');
    }
  });
});

describe('candidateUpdateSchema', () => {
  it('allows partial updates', () => {
    const partialUpdate = {
      name: '新しい名前',
    };

    const result = candidateUpdateSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });

  it('validates email if provided', () => {
    const invalidUpdate = {
      email: 'not-valid',
    };

    const result = candidateUpdateSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });
});

describe('candidateSearchSchema', () => {
  it('provides defaults for pagination', () => {
    const result = candidateSearchSchema.parse({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sortBy).toBe('created_at');
    expect(result.sortOrder).toBe('desc');
  });

  it('coerces string page to number', () => {
    const result = candidateSearchSchema.parse({ page: '2' });
    expect(result.page).toBe(2);
  });

  it('filters by status', () => {
    const result = candidateSearchSchema.safeParse({
      status: 'completed',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('completed');
    }
  });
});

describe('validateCandidateCreate', () => {
  it('returns success for valid data', () => {
    const result = validateCandidateCreate({
      name: 'テスト太郎',
      email: 'test@example.com',
      desiredPositions: ['engineering'],
    });

    expect(result.success).toBe(true);
  });

  it('returns error for invalid data', () => {
    const result = validateCandidateCreate({
      name: '',
      email: 'invalid',
      desiredPositions: [],
    });

    expect(result.success).toBe(false);
  });
});

// =====================================================
// Anonymous Candidate Register Schema Tests (Issue #215)
// For direct assessment flow from landing page
// =====================================================

describe('anonymousCandidateRegisterSchema', () => {
  describe('Normal Cases', () => {
    it('validates correct input with name and email only', () => {
      const validInput = {
        name: 'テスト太郎',
        email: 'test@example.com',
      };

      const result = anonymousCandidateRegisterSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('validates with optional desiredJobType', () => {
      const validInput = {
        name: 'テスト太郎',
        email: 'test@example.com',
        desiredJobType: 'エンジニア',
      };

      const result = anonymousCandidateRegisterSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.desiredJobType).toBe('エンジニア');
      }
    });

    it('accepts null desiredJobType', () => {
      const validInput = {
        name: 'テスト太郎',
        email: 'test@example.com',
        desiredJobType: null,
      };

      const result = anonymousCandidateRegisterSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Cases - Empty Name', () => {
    it('rejects empty name', () => {
      const invalidInput = {
        name: '',
        email: 'test@example.com',
      };

      const result = anonymousCandidateRegisterSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('氏名');
      }
    });
  });

  describe('Error Cases - Invalid Email', () => {
    it('rejects invalid email format', () => {
      const invalidInput = {
        name: 'テスト太郎',
        email: 'not-an-email',
      };

      const result = anonymousCandidateRegisterSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('メールアドレス');
      }
    });

    it('rejects empty email', () => {
      const invalidInput = {
        name: 'テスト太郎',
        email: '',
      };

      const result = anonymousCandidateRegisterSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('Boundary Cases - Name Length', () => {
    it('accepts name with exactly 100 characters', () => {
      const validInput = {
        name: 'あ'.repeat(100),
        email: 'test@example.com',
      };

      const result = anonymousCandidateRegisterSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('rejects name with 101 characters', () => {
      const invalidInput = {
        name: 'あ'.repeat(101),
        email: 'test@example.com',
      };

      const result = anonymousCandidateRegisterSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100文字');
      }
    });
  });

  describe('Boundary Cases - desiredJobType Length', () => {
    it('accepts desiredJobType with exactly 100 characters', () => {
      const validInput = {
        name: 'テスト太郎',
        email: 'test@example.com',
        desiredJobType: 'a'.repeat(100),
      };

      const result = anonymousCandidateRegisterSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('rejects desiredJobType over 100 characters', () => {
      const invalidInput = {
        name: 'テスト太郎',
        email: 'test@example.com',
        desiredJobType: 'a'.repeat(101),
      };

      const result = anonymousCandidateRegisterSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('100文字');
      }
    });
  });
});

describe('validateAnonymousCandidateRegister', () => {
  it('returns success for valid data', () => {
    const result = validateAnonymousCandidateRegister({
      name: 'テスト太郎',
      email: 'test@example.com',
    });

    expect(result.success).toBe(true);
  });

  it('returns error for missing name', () => {
    const result = validateAnonymousCandidateRegister({
      name: '',
      email: 'test@example.com',
    });

    expect(result.success).toBe(false);
  });

  it('returns error for invalid email', () => {
    const result = validateAnonymousCandidateRegister({
      name: 'テスト太郎',
      email: 'invalid-email',
    });

    expect(result.success).toBe(false);
  });
});

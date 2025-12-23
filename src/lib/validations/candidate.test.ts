// =====================================================
// Candidate Validation Tests
// =====================================================

import { describe, it, expect } from 'vitest';
import {
  candidateCreateSchema,
  candidateUpdateSchema,
  candidateSearchSchema,
  validateCandidateCreate,
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

// =====================================================
// Assessment Validation Schema Tests
// =====================================================

import { describe, it, expect } from 'vitest';
import { updateProgressSchema, saveResponseSchema } from './assessment';

describe('updateProgressSchema', () => {
  it('should accept valid progress data', () => {
    const result = updateProgressSchema.safeParse({
      currentPage: 0,
      totalPages: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentPage).toBe(0);
      expect(result.data.totalPages).toBe(5);
    }
  });

  it('should accept currentPage at max valid value', () => {
    const result = updateProgressSchema.safeParse({
      currentPage: 4,
      totalPages: 5,
    });
    expect(result.success).toBe(true);
  });

  it('should reject currentPage >= totalPages', () => {
    const result = updateProgressSchema.safeParse({
      currentPage: 5,
      totalPages: 5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative currentPage', () => {
    const result = updateProgressSchema.safeParse({
      currentPage: -1,
      totalPages: 5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject totalPages less than 1', () => {
    const result = updateProgressSchema.safeParse({
      currentPage: 0,
      totalPages: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer currentPage', () => {
    const result = updateProgressSchema.safeParse({
      currentPage: 1.5,
      totalPages: 5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-number currentPage', () => {
    const result = updateProgressSchema.safeParse({
      currentPage: 'two',
      totalPages: 5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing currentPage', () => {
    const result = updateProgressSchema.safeParse({
      totalPages: 5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing totalPages', () => {
    const result = updateProgressSchema.safeParse({
      currentPage: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('saveResponseSchema', () => {
  it('should accept valid response data', () => {
    const result = saveResponseSchema.safeParse({
      questionId: 'L01',
      answer: 3,
      pageNumber: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.questionId).toBe('L01');
      expect(result.data.answer).toBe(3);
      expect(result.data.pageNumber).toBe(0);
    }
  });

  it('should accept any answer type', () => {
    const stringAnswer = saveResponseSchema.safeParse({
      questionId: 'SJT01',
      answer: 'A',
      pageNumber: 1,
    });
    expect(stringAnswer.success).toBe(true);

    const objectAnswer = saveResponseSchema.safeParse({
      questionId: 'multi01',
      answer: { choice1: true, choice2: false },
      pageNumber: 2,
    });
    expect(objectAnswer.success).toBe(true);

    const nullAnswer = saveResponseSchema.safeParse({
      questionId: 'opt01',
      answer: null,
      pageNumber: 0,
    });
    expect(nullAnswer.success).toBe(true);
  });

  it('should reject empty questionId', () => {
    const result = saveResponseSchema.safeParse({
      questionId: '',
      answer: 3,
      pageNumber: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing questionId', () => {
    const result = saveResponseSchema.safeParse({
      answer: 3,
      pageNumber: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative pageNumber', () => {
    const result = saveResponseSchema.safeParse({
      questionId: 'L01',
      answer: 3,
      pageNumber: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-integer pageNumber', () => {
    const result = saveResponseSchema.safeParse({
      questionId: 'L01',
      answer: 3,
      pageNumber: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('should reject non-number pageNumber', () => {
    const result = saveResponseSchema.safeParse({
      questionId: 'L01',
      answer: 3,
      pageNumber: 'zero',
    });
    expect(result.success).toBe(false);
  });
});

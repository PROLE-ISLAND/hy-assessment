// =====================================================
// Common Validation Schema Tests
// =====================================================

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { safeParseJson, parseRequestBody } from './common';

describe('safeParseJson', () => {
  it('should parse valid JSON', () => {
    const result = safeParseJson('{"name": "test", "value": 123}');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'test', value: 123 });
    }
  });

  it('should parse JSON array', () => {
    const result = safeParseJson('[1, 2, 3]');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([1, 2, 3]);
    }
  });

  it('should parse JSON primitives', () => {
    expect(safeParseJson('"hello"')).toEqual({ success: true, data: 'hello' });
    expect(safeParseJson('42')).toEqual({ success: true, data: 42 });
    expect(safeParseJson('true')).toEqual({ success: true, data: true });
    expect(safeParseJson('null')).toEqual({ success: true, data: null });
  });

  it('should return error for invalid JSON', () => {
    const result = safeParseJson('not valid json');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('JSON構文エラー');
    }
  });

  it('should return error for truncated JSON', () => {
    const result = safeParseJson('{"name": "test"');
    expect(result.success).toBe(false);
  });

  it('should return fallback for invalid JSON when provided', () => {
    const fallback = { default: true };
    const result = safeParseJson('invalid', fallback);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(fallback);
    }
  });

  it('should not use fallback for valid JSON', () => {
    const fallback = { default: true };
    const result = safeParseJson('{"actual": "data"}', fallback);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ actual: 'data' });
    }
  });
});

describe('parseRequestBody', () => {
  function createMockRequest(body: unknown, shouldThrow = false): Request {
    return {
      json: async () => {
        if (shouldThrow) {
          throw new SyntaxError('Unexpected token');
        }
        return body;
      },
    } as unknown as Request;
  }

  it('should parse valid request body without schema', async () => {
    const mockRequest = createMockRequest({ name: 'test' });
    const result = await parseRequestBody(mockRequest);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'test' });
    }
  });

  it('should parse and validate request body with schema', async () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().int().min(0),
    });

    const mockRequest = createMockRequest({ name: 'John', age: 30 });
    const result = await parseRequestBody(mockRequest, schema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: 'John', age: 30 });
    }
  });

  it('should return error for invalid schema validation', async () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().int().min(0),
    });

    const mockRequest = createMockRequest({ name: '', age: -5 });
    const result = await parseRequestBody(mockRequest, schema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(400);
      expect(result.error).toBeTruthy();
    }
  });

  it('should return error for invalid JSON', async () => {
    const mockRequest = createMockRequest(null, true);
    const result = await parseRequestBody(mockRequest);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(400);
      expect(result.error).toBe('リクエストボディのJSON形式が不正です');
    }
  });

  it('should handle missing required fields', async () => {
    const schema = z.object({
      requiredField: z.string(),
    });

    const mockRequest = createMockRequest({});
    const result = await parseRequestBody(mockRequest, schema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(400);
    }
  });
});

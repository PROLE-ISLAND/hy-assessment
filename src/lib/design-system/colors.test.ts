// =====================================================
// Design System Color Tests
// Tests for score colors, state colors, etc.
// =====================================================

import { describe, it, expect } from 'vitest';
import {
  getScoreTextClass,
  getScoreColor,
  getScoreLevel,
  scoreThresholds,
  scoreColors,
  getProgressColor,
} from './tokens/colors';

describe('Score Colors', () => {
  describe('getScoreLevel', () => {
    it('returns "excellent" for scores >= 70', () => {
      expect(getScoreLevel(70)).toBe('excellent');
      expect(getScoreLevel(85)).toBe('excellent');
      expect(getScoreLevel(100)).toBe('excellent');
    });

    it('returns "warning" for scores >= 50 and < 70', () => {
      expect(getScoreLevel(50)).toBe('warning');
      expect(getScoreLevel(65)).toBe('warning');
      expect(getScoreLevel(69)).toBe('warning');
    });

    it('returns "danger" for scores < 50', () => {
      expect(getScoreLevel(0)).toBe('danger');
      expect(getScoreLevel(25)).toBe('danger');
      expect(getScoreLevel(49)).toBe('danger');
    });
  });

  describe('getScoreTextClass', () => {
    it('returns emerald class for excellent scores', () => {
      expect(getScoreTextClass(75)).toBe('text-emerald-600');
    });

    it('returns amber class for warning scores', () => {
      expect(getScoreTextClass(55)).toBe('text-amber-600');
    });

    it('returns rose class for danger scores', () => {
      expect(getScoreTextClass(35)).toBe('text-rose-600');
    });
  });

  describe('getScoreColor', () => {
    it('returns correct hex colors', () => {
      expect(getScoreColor(75)).toBe('#059669'); // emerald-600
      expect(getScoreColor(55)).toBe('#d97706'); // amber-600
      expect(getScoreColor(35)).toBe('#e11d48'); // rose-600
    });
  });

  describe('scoreThresholds', () => {
    it('has correct threshold values', () => {
      expect(scoreThresholds.excellent).toBe(70);
      expect(scoreThresholds.warning).toBe(50);
      expect(scoreThresholds.danger).toBe(0);
    });
  });

  describe('scoreColors', () => {
    it('has all required color definitions', () => {
      const levels = ['excellent', 'warning', 'danger'] as const;

      levels.forEach((level) => {
        expect(scoreColors[level]).toBeDefined();
        expect(scoreColors[level].text).toBeDefined();
        expect(scoreColors[level].textDark).toBeDefined();
        expect(scoreColors[level].bg).toBeDefined();
        expect(scoreColors[level].hex).toBeDefined();
      });
    });
  });
});

describe('Progress Colors', () => {
  describe('getProgressColor', () => {
    it('returns correct colors for normal scoring', () => {
      expect(getProgressColor(75)).toBe('#6ee7b7'); // good
      expect(getProgressColor(55)).toBe('#fcd34d'); // warning
      expect(getProgressColor(35)).toBe('#fda4af'); // danger
    });

    it('reverses colors when isReversed is true', () => {
      // For reversed scoring (like COG), low score is good
      expect(getProgressColor(25, true)).toBe('#6ee7b7'); // 100-25=75 -> good
      expect(getProgressColor(75, true)).toBe('#fda4af'); // 100-75=25 -> danger
    });
  });
});

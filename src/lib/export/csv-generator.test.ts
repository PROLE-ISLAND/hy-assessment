// =====================================================
// CSV Generator Tests
// Tests for CSV generation utilities
// =====================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateCSV,
  generateCandidateCSV,
  generateDomainCSV,
  generatePositionCSV,
  getExportFilename,
  type CandidateExportData,
  type DomainExportData,
  type PositionExportData,
} from './csv-generator';

// UTF-8 BOM character
const UTF8_BOM = '\uFEFF';

describe('generateCSV', () => {
  it('generates CSV with UTF-8 BOM', () => {
    const data = [{ name: 'Test', value: 123 }];
    const columns = [
      { key: 'name' as const, label: 'Name' },
      { key: 'value' as const, label: 'Value' },
    ];

    const csv = generateCSV(data, columns);

    expect(csv.startsWith(UTF8_BOM)).toBe(true);
  });

  it('generates correct header row', () => {
    const data = [{ a: 1, b: 2 }];
    const columns = [
      { key: 'a' as const, label: 'Column A' },
      { key: 'b' as const, label: 'Column B' },
    ];

    const csv = generateCSV(data, columns);
    const lines = csv.replace(UTF8_BOM, '').split('\n');

    expect(lines[0]).toBe('Column A,Column B');
  });

  it('generates correct data rows', () => {
    const data = [
      { name: 'Alice', score: 85 },
      { name: 'Bob', score: 92 },
    ];
    const columns = [
      { key: 'name' as const, label: 'Name' },
      { key: 'score' as const, label: 'Score' },
    ];

    const csv = generateCSV(data, columns);
    const lines = csv.replace(UTF8_BOM, '').split('\n');

    expect(lines[1]).toBe('Alice,85');
    expect(lines[2]).toBe('Bob,92');
  });

  it('handles Japanese characters correctly', () => {
    const data = [{ name: '山田太郎', position: 'エンジニア' }];
    const columns = [
      { key: 'name' as const, label: '氏名' },
      { key: 'position' as const, label: '職種' },
    ];

    const csv = generateCSV(data, columns);
    const lines = csv.replace(UTF8_BOM, '').split('\n');

    expect(lines[0]).toBe('氏名,職種');
    expect(lines[1]).toBe('山田太郎,エンジニア');
  });

  it('escapes values with commas', () => {
    const data = [{ text: 'Hello, World' }];
    const columns = [{ key: 'text' as const, label: 'Text' }];

    const csv = generateCSV(data, columns);
    const lines = csv.replace(UTF8_BOM, '').split('\n');

    expect(lines[1]).toBe('"Hello, World"');
  });

  it('escapes values with quotes', () => {
    const data = [{ text: 'Say "Hello"' }];
    const columns = [{ key: 'text' as const, label: 'Text' }];

    const csv = generateCSV(data, columns);
    const lines = csv.replace(UTF8_BOM, '').split('\n');

    expect(lines[1]).toBe('"Say ""Hello"""');
  });

  it('escapes values with newlines', () => {
    const data = [{ text: 'Line 1\nLine 2' }];
    const columns = [{ key: 'text' as const, label: 'Text' }];

    const csv = generateCSV(data, columns);

    // The value should be quoted - check the raw CSV content
    // Header + newline + quoted value with embedded newline
    expect(csv).toBe(`${UTF8_BOM}Text\n"Line 1\nLine 2"`);
  });

  it('handles null and undefined values', () => {
    const data = [{ a: null, b: undefined, c: 'valid' }];
    const columns = [
      { key: 'a' as const, label: 'A' },
      { key: 'b' as const, label: 'B' },
      { key: 'c' as const, label: 'C' },
    ];

    const csv = generateCSV(data, columns);
    const lines = csv.replace(UTF8_BOM, '').split('\n');

    expect(lines[1]).toBe(',,valid');
  });

  it('handles empty data array', () => {
    const data: { name: string }[] = [];
    const columns = [{ key: 'name' as const, label: 'Name' }];

    const csv = generateCSV(data, columns);
    const lines = csv.replace(UTF8_BOM, '').split('\n');

    expect(lines.length).toBe(1); // Only header
    expect(lines[0]).toBe('Name');
  });
});

describe('generateCandidateCSV', () => {
  it('generates CSV with correct columns', () => {
    const data: CandidateExportData[] = [
      {
        name: '田中花子',
        email: 'hanako@example.com',
        position: 'エンジニア',
        overallScore: 75,
        judgment: '良好',
        completedAt: '2025/01/15 10:30',
      },
    ];

    const csv = generateCandidateCSV(data);
    const lines = csv.replace(UTF8_BOM, '').split('\n');

    expect(lines[0]).toBe('氏名,メールアドレス,希望職種,総合スコア(%),判定,検査完了日時');
    expect(lines[1]).toBe('田中花子,hanako@example.com,エンジニア,75,良好,2025/01/15 10:30');
  });
});

describe('generateDomainCSV', () => {
  it('generates CSV with correct columns', () => {
    const data: DomainExportData[] = [
      {
        domain: 'GOV',
        domainLabel: 'ガバナンス',
        averageScore: 72,
        sampleCount: 10,
      },
    ];

    const csv = generateDomainCSV(data);
    const lines = csv.replace(UTF8_BOM, '').split('\n');

    expect(lines[0]).toBe('ドメインコード,ドメイン名,平均スコア(%),サンプル数');
    expect(lines[1]).toBe('GOV,ガバナンス,72,10');
  });
});

describe('generatePositionCSV', () => {
  it('generates CSV with correct columns', () => {
    const data: PositionExportData[] = [
      {
        position: 'engineer',
        positionLabel: 'エンジニア',
        candidateCount: 15,
        averageScore: 68,
      },
    ];

    const csv = generatePositionCSV(data);
    const lines = csv.replace(UTF8_BOM, '').split('\n');

    expect(lines[0]).toBe('職種コード,職種名,候補者数,平均スコア(%)');
    expect(lines[1]).toBe('engineer,エンジニア,15,68');
  });
});

describe('getExportFilename', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-15T10:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates filename with date prefix', () => {
    const filename = getExportFilename('candidates');

    expect(filename).toBe('candidates_2025-03-15.csv');
  });

  it('uses provided prefix', () => {
    const filename = getExportFilename('domain_analysis');

    expect(filename).toBe('domain_analysis_2025-03-15.csv');
  });
});

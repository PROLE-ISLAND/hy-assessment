// =====================================================
// CSV Generator Utility
// Generate CSV files with UTF-8 BOM for Japanese support
// =====================================================

// UTF-8 BOM to ensure proper encoding in Excel
const UTF8_BOM = '\uFEFF';

/**
 * Escape a value for CSV
 * - Wrap in quotes if contains comma, newline, or quote
 * - Escape quotes by doubling them
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Check if escaping is needed
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generate CSV string from data
 */
export function generateCSV<T>(
  data: T[],
  columns: { key: keyof T; label: string }[]
): string {
  // Header row
  const header = columns.map(col => escapeCSVValue(col.label)).join(',');

  // Data rows
  const rows = data.map(row =>
    columns.map(col => escapeCSVValue((row as Record<string, unknown>)[col.key as string])).join(',')
  );

  // Combine with BOM for UTF-8
  return UTF8_BOM + [header, ...rows].join('\n');
}

/**
 * Trigger CSV download in browser
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =====================================================
// Report-specific CSV generators
// =====================================================

export interface CandidateExportData {
  name: string;
  email: string;
  position: string;
  overallScore: number;
  judgment: string;
  completedAt: string;
}

export interface DomainExportData {
  domain: string;
  domainLabel: string;
  averageScore: number;
  sampleCount: number;
}

export interface PositionExportData {
  position: string;
  positionLabel: string;
  candidateCount: number;
  averageScore: number;
}

/**
 * Generate CSV for candidate list
 */
export function generateCandidateCSV(data: CandidateExportData[]): string {
  return generateCSV(data, [
    { key: 'name', label: '氏名' },
    { key: 'email', label: 'メールアドレス' },
    { key: 'position', label: '希望職種' },
    { key: 'overallScore', label: '総合スコア(%)' },
    { key: 'judgment', label: '判定' },
    { key: 'completedAt', label: '検査完了日時' },
  ]);
}

/**
 * Generate CSV for domain analysis
 */
export function generateDomainCSV(data: DomainExportData[]): string {
  return generateCSV(data, [
    { key: 'domain', label: 'ドメインコード' },
    { key: 'domainLabel', label: 'ドメイン名' },
    { key: 'averageScore', label: '平均スコア(%)' },
    { key: 'sampleCount', label: 'サンプル数' },
  ]);
}

/**
 * Generate CSV for position analysis
 */
export function generatePositionCSV(data: PositionExportData[]): string {
  return generateCSV(data, [
    { key: 'position', label: '職種コード' },
    { key: 'positionLabel', label: '職種名' },
    { key: 'candidateCount', label: '候補者数' },
    { key: 'averageScore', label: '平均スコア(%)' },
  ]);
}

/**
 * Get formatted filename with date
 */
export function getExportFilename(prefix: string): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${prefix}_${dateStr}.csv`;
}

// =====================================================
// Position Constants
// Available positions for candidate selection
// =====================================================

export const POSITIONS = [
  { value: 'account_manager', label: 'アカウントマネージャー' },
  { value: 'marketing_director', label: 'マーケティングディレクター' },
  { value: 'content_planner', label: 'コンテンツプランナー' },
  { value: 'growth_manager', label: 'グロースマネージャー' },
  { value: 'inside_sales', label: 'インサイドセールス' },
  { value: 'field_sales', label: 'フィールドセールス' },
  { value: 'customer_success', label: 'カスタマーサクセス' },
  { value: 'corporate_staff', label: 'コーポレートスタッフ' },
  { value: 'operation_director', label: 'オペレーションディレクター' },
  { value: 'ai_director', label: 'AI開発ディレクター' },
] as const;

export type PositionValue = typeof POSITIONS[number]['value'];

// Helper to get label by value
export function getPositionLabel(value: string): string {
  const position = POSITIONS.find(p => p.value === value);
  return position?.label || value;
}

// Helper to get labels for multiple values
export function getPositionLabels(values: string[]): string[] {
  return values.map(v => getPositionLabel(v));
}

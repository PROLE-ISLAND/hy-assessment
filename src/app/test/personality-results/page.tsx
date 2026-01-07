'use client';

import { PersonalityResultsTab } from '@/components/personality';

// サンプルデータ
const sampleAssessment = {
  id: 'test-001',
  candidate_id: 'candidate-001',
  // DISC
  disc_dominance: 75,
  disc_influence: 60,
  disc_steadiness: 45,
  disc_conscientiousness: 80,
  disc_primary_factor: 'C' as const,
  disc_profile_pattern: 'CD型（分析的リーダー）',
  // ストレス耐性
  stress_overall: 72,
  stress_risk_level: 'low' as const,
  stress_details: {
    pressureHandling: 78,
    recoverySpeed: 65,
    emotionalStability: 80,
    adaptability: 68,
  },
  // EQ
  eq_overall: 68,
  eq_details: {
    selfAwareness: 75,
    selfManagement: 70,
    socialAwareness: 62,
    relationshipManagement: 65,
  },
  // 価値観
  values_achievement: 85,
  values_stability: 55,
  values_growth: 78,
  values_social_contribution: 42,
  values_autonomy: 70,
  values_primary: '達成志向',
  // メタデータ
  completed_at: new Date().toISOString(),
  duration_seconds: 1850,
};

export default function PersonalityResultsTestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold">パーソナリティ結果表示テスト</h1>

        <div>
          <h2 className="text-lg font-semibold mb-4">Default（データあり）</h2>
          <PersonalityResultsTab assessment={sampleAssessment} />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Loading</h2>
          <PersonalityResultsTab isLoading />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Empty（データなし）</h2>
          <PersonalityResultsTab assessment={null} />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Error</h2>
          <PersonalityResultsTab
            error={new Error('データの取得に失敗しました')}
            onRetry={() => alert('再試行')}
          />
        </div>
      </div>
    </div>
  );
}

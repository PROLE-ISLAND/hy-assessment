// =====================================================
// Verify Test Assessments Data
// Confirms test data was created correctly with responses and analysis
// =====================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAILS = [
  'test-taro@example.com',
  'test-hanako@example.com',
  'test-jiro@example.com',
  'test-saburo@example.com',
  'test-shiro@example.com',
  'test-goro@example.com',
];

async function main() {
  console.log('🔍 テストデータ検証中...\n');

  // Get test persons
  const { data: persons } = await supabase
    .from('persons')
    .select('id, name, email')
    .in('email', TEST_EMAILS);

  if (!persons || persons.length === 0) {
    console.log('❌ テストデータが見つかりません。seed-test-assessments.ts を実行してください。');
    return;
  }

  console.log(`✅ テスト候補者: ${persons.length}人\n`);

  let totalAssessments = 0;
  let totalResponses = 0;
  let totalAnalyses = 0;

  for (const person of persons) {
    // Get candidate
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id, position')
      .eq('person_id', person.id)
      .single();

    if (!candidate) continue;

    // Get assessment
    const { data: assessment } = await supabase
      .from('assessments')
      .select('id, status, completed_at')
      .eq('candidate_id', candidate.id)
      .single();

    if (!assessment) continue;

    // Get responses count
    const { count: responsesCount } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true })
      .eq('assessment_id', assessment.id);

    // Get analysis
    const { data: analysis } = await supabase
      .from('ai_analyses')
      .select('scores, summary')
      .eq('assessment_id', assessment.id)
      .single();

    const scores = analysis?.scores as Record<string, number> | null;

    totalAssessments++;
    totalResponses += responsesCount || 0;
    if (analysis) totalAnalyses++;

    // Determine personality type from scores
    let type = '不明';
    if (scores) {
      if (scores.GOV >= 80) type = '🟢 good';
      else if (scores.GOV >= 60) type = '🟡 average';
      else type = '🔴 risky';
    }

    console.log(`📋 ${person.name} (${candidate.position})`);
    console.log(`   ID: ${assessment.id}`);
    console.log(`   タイプ: ${type}`);
    console.log(`   回答数: ${responsesCount}件`);
    if (scores) {
      console.log(`   スコア: GOV=${scores.GOV}, CONFLICT=${scores.CONFLICT}, REL=${scores.REL}, COG=${scores.COG}`);
    }
    console.log('');
  }

  console.log('='.repeat(50));
  console.log(`📊 集計結果:`);
  console.log(`   アセスメント: ${totalAssessments}件`);
  console.log(`   回答総数: ${totalResponses}件`);
  console.log(`   分析結果: ${totalAnalyses}件`);
  console.log('');

  if (totalResponses > 0 && totalAnalyses === totalAssessments) {
    console.log('✅ すべてのテストデータが正常に作成されています！');
    console.log('   再分析機能のテストが可能です。');
  } else {
    console.log('⚠️ データに問題がある可能性があります。');
  }
}

main().catch(console.error);

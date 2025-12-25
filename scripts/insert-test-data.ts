// Script to insert test data for assessments with AI analysis
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { nanoid } from 'nanoid';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Service Key:', supabaseServiceKey ? 'Set' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample candidate report (v2 format)
const sampleCandidateReport = {
  strengths: [
    { title: '論理的思考力', description: '複雑な問題を構造化して整理し、順序立てて解決に導く傾向があります。' },
    { title: 'チームワーク重視', description: '周囲との協調を大切にし、チーム全体の成果を意識した行動を取りやすいです。' },
    { title: '計画性', description: '事前に計画を立て、見通しを持って業務を進める傾向が見られます。' },
  ],
  leverage_tips: [
    'プロジェクトの初期段階で全体像を整理する役割が向いています',
    'チームでの議論をまとめる場面で力を発揮しやすいでしょう',
    '複雑な業務フローの改善提案などで強みが活きます',
  ],
  stress_tips: [
    '急な変更が続く時は、一度立ち止まって優先順位を整理することで落ち着きを取り戻せます',
    '完璧を求めすぎず、まず60%の完成度で一度共有する習慣が有効です',
  ],
  values_tags: ['チームワーク', '計画性', '正確さ', '成長志向'],
  note: 'この結果は一時点での傾向を示すものであり、環境や経験によって変化します。自己理解の参考としてご活用ください。',
};

// Sample internal report data
const sampleInternalReport = {
  strengths: [
    { title: '論理的思考力', behavior: '複雑な問題を構造化して整理し、順序立てて解決策を導出する傾向があります。', evidence: 'COGドメインの上位グループ' },
    { title: 'チーム協調性', behavior: '周囲との認識合わせを重視し、チーム全体の成果を意識した行動を取りやすいです。', evidence: 'RELドメインでの高評価傾向' },
    { title: '計画的実行力', behavior: '事前に計画を立て、見通しを持って業務を進める傾向が見られます。', evidence: 'ORGドメインの安定した回答パターン' },
  ],
  watchouts: [
    { title: '変化への初動', risk: '急な方針転換時に、現状維持の判断を優先しやすい可能性があります。', evidence: 'CHAドメインが相対的に低め' },
    { title: '完璧志向による遅延', risk: '品質へのこだわりから、タスク完了に時間がかかりやすい傾向があります。', evidence: 'QUAドメインの高さとORGのバランス' },
  ],
  risk_scenarios: [
    {
      condition: '締め切り直前で仕様変更が入った場合',
      symptom: '優先順位の判断に迷いが生じやすくなります',
      impact: 'タスク完了の遅延、他メンバーへの負荷増大',
      prevention: '変更時の判断基準を事前に上司と合意しておく',
      risk_environment: ['頻繁な仕様変更がある環境', 'マルチタスクが求められる環境'],
    },
  ],
  interview_checks: [
    { question: '直近で急な計画変更があった経験を教えてください。', intent: '変化への対応力を確認', look_for: '具体的な対処法と感情コントロールの様子' },
    { question: 'チームで意見が割れた時、どう解決しましたか？', intent: '対人スキルと協調性を確認', look_for: '解決プロセスと結果への納得感' },
  ],
  summary: '論理的思考力とチームワークを重視する傾向が見られます。計画的に業務を進める力がある一方、急な変化への対応には準備が必要かもしれません。',
  recommendation: '面接では変化対応の具体例を確認することを推奨します。',
};

// Generate random scores
function generateScores(): Record<string, number> {
  const domains = ['COG', 'REL', 'STR', 'ACH', 'ORG', 'CHA', 'QUA', 'VALID'];
  const scores: Record<string, number> = {};
  for (const domain of domains) {
    // Generate score between 40-95
    scores[domain] = Math.floor(Math.random() * 55) + 40;
  }
  return scores;
}

// Test candidates (use unique emails to avoid conflicts)
const timestamp = Date.now();
const testCandidates = [
  { name: '山田 太郎', email: `yamada-${timestamp}@example.com`, position: 'エンジニア' },
  { name: '佐藤 花子', email: `sato-${timestamp}@example.com`, position: 'マーケティング' },
  { name: '田中 次郎', email: `tanaka-${timestamp}@example.com`, position: '営業' },
  { name: '鈴木 美咲', email: `suzuki-${timestamp}@example.com`, position: 'デザイナー' },
  { name: '高橋 健太', email: `takahashi-${timestamp}@example.com`, position: 'PM' },
];

async function insertTestData() {
  console.log('Starting test data insertion...');

  // Get organization
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .limit(1);

  if (orgError || !orgs?.length) {
    console.error('No organization found:', orgError);
    return;
  }

  const organizationId = orgs[0].id;
  console.log('Using organization:', organizationId);

  // Get template
  const { data: templates, error: templateError } = await supabase
    .from('assessment_templates')
    .select('id')
    .limit(1);

  if (templateError || !templates?.length) {
    console.error('No template found:', templateError);
    return;
  }

  const templateId = templates[0].id;
  console.log('Using template:', templateId);

  for (const candidate of testCandidates) {
    console.log(`\nProcessing candidate: ${candidate.name}`);

    // 1. Create or get person
    let personId: string;
    const { data: existingPerson } = await supabase
      .from('persons')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', candidate.email)
      .single();

    if (existingPerson) {
      personId = existingPerson.id;
      console.log('  Found existing person:', personId);
    } else {
      const { data: newPerson, error: personError } = await supabase
        .from('persons')
        .insert({
          organization_id: organizationId,
          name: candidate.name,
          email: candidate.email,
        })
        .select('id')
        .single();

      if (personError) {
        console.error('Failed to create person:', personError);
        continue;
      }
      personId = newPerson.id;
      console.log('  Created person:', personId);
    }

    // 2. Create candidate
    const { data: candidateRecord, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        organization_id: organizationId,
        person_id: personId,
        position: candidate.position,
        desired_positions: [candidate.position],
      })
      .select('id')
      .single();

    if (candidateError) {
      console.error('Failed to create candidate:', candidateError);
      continue;
    }
    console.log('  Created candidate:', candidateRecord.id);

    // 3. Create assessment
    const assessmentToken = nanoid(32);
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        organization_id: organizationId,
        candidate_id: candidateRecord.id,
        template_id: templateId,
        token: assessmentToken,
        status: 'completed',
        started_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        completed_at: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(), // 23 hours ago
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days from now
      })
      .select('id')
      .single();

    if (assessmentError) {
      console.error('Failed to create assessment:', assessmentError);
      continue;
    }
    console.log('  Created assessment:', assessment.id);

    // 4. Create AI analysis with v2 data
    const scores = generateScores();
    const { error: analysisError } = await supabase
      .from('ai_analyses')
      .insert({
        assessment_id: assessment.id,
        organization_id: organizationId,
        scores,
        strengths: sampleInternalReport.strengths.map(s => s.behavior),
        weaknesses: sampleInternalReport.watchouts.map(w => w.risk),
        summary: sampleInternalReport.summary,
        recommendation: sampleInternalReport.recommendation,
        model_version: 'gpt-4o-2024-08-06',
        prompt_version: 'v2.0.0',
        tokens_used: Math.floor(Math.random() * 2000) + 1000,
        version: 1,
        is_latest: true,
        analyzed_at: new Date().toISOString(),
        enhanced_strengths: sampleInternalReport.strengths,
        enhanced_watchouts: sampleInternalReport.watchouts,
        risk_scenarios: sampleInternalReport.risk_scenarios,
        interview_checks: sampleInternalReport.interview_checks,
        candidate_report: sampleCandidateReport,
        report_version: 'v2',
      });

    if (analysisError) {
      console.error('Failed to create analysis:', analysisError);
      continue;
    }
    console.log('  Created AI analysis with v2 data');
  }

  console.log('\nTest data insertion complete!');
}

insertTestData().catch(console.error);

// =====================================================
// Seed Test Assessments with Responses and Analysis
// Creates 6 complete assessments for testing
// =====================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Test candidates data
const TEST_CANDIDATES = [
  { name: 'テスト 太郎', email: 'test-taro@example.com', position: 'エンジニア' },
  { name: 'テスト 花子', email: 'test-hanako@example.com', position: 'デザイナー' },
  { name: 'テスト 次郎', email: 'test-jiro@example.com', position: 'マーケター' },
  { name: 'テスト 三郎', email: 'test-saburo@example.com', position: 'セールス' },
  { name: 'テスト 四郎', email: 'test-shiro@example.com', position: 'PM' },
  { name: 'テスト 五郎', email: 'test-goro@example.com', position: 'CS' },
];

// Likert questions (L01-L46)
const LIKERT_QUESTIONS = Array.from({ length: 46 }, (_, i) => `L${String(i + 1).padStart(2, '0')}`);

// SJT questions (SJT01-SJT06)
const SJT_QUESTIONS = ['SJT01', 'SJT02', 'SJT03', 'SJT04', 'SJT05', 'SJT06'];

// Free text question
const FREE_TEXT_QUESTION = 'T01';

// Generate random Likert response (1-5)
function randomLikert(): number {
  return Math.floor(Math.random() * 5) + 1;
}

// Generate random SJT response (A, B, C, D)
function randomSJT(): string {
  const choices = ['A', 'B', 'C', 'D'];
  return choices[Math.floor(Math.random() * choices.length)];
}

// Generate mock scores based on "personality type"
function generateMockScores(type: 'good' | 'average' | 'risky'): Record<string, number> {
  const base = {
    good: { GOV: 85, CONFLICT: 80, REL: 82, COG: 25, WORK: 78, VALID: 90 },
    average: { GOV: 68, CONFLICT: 65, REL: 70, COG: 45, WORK: 72, VALID: 85 },
    risky: { GOV: 45, CONFLICT: 40, REL: 55, COG: 70, WORK: 50, VALID: 60 },
  };

  // Add some randomness
  const scores = base[type];
  return Object.fromEntries(
    Object.entries(scores).map(([key, value]) => [
      key,
      Math.max(0, Math.min(100, value + Math.floor(Math.random() * 10) - 5))
    ])
  );
}

// Generate mock analysis result
function generateMockAnalysis(scores: Record<string, number>) {
  const isGood = scores.GOV > 70 && scores.CONFLICT > 60;
  const isRisky = scores.GOV < 50 || scores.COG > 60;

  return {
    strengths: isGood
      ? ['ルール遵守意識が高い', '誠実なコミュニケーション', '責任感が強い']
      : ['柔軟な対応力', '自己主張ができる', '問題解決への積極性'],
    weaknesses: isRisky
      ? ['衝動的な判断傾向', 'ルール軽視の可能性', 'ストレス耐性に課題']
      : ['慎重すぎる傾向', '意思決定に時間がかかる', '変化への適応に時間が必要'],
    summary: isGood
      ? '全体的にガバナンス適合度が高く、組織での活躍が期待できる人材です。'
      : isRisky
      ? '一部リスク要因が見られます。面接での深掘り確認を推奨します。'
      : '平均的なスコアです。職種適性を考慮した配置を検討してください。',
    recommendation: isGood
      ? '採用推奨。即戦力として期待できます。'
      : isRisky
      ? '慎重に検討。リスク要因の確認が必要です。'
      : '条件付き推奨。適切なポジションへの配置を推奨します。',
    enhanced_strengths: [
      {
        domain: 'GOV',
        behavior: isGood ? 'ルールを自発的に遵守する姿勢' : '状況に応じた柔軟な判断',
        evidence: '回答パターンから推定',
        confidence: 0.85,
      },
    ],
    enhanced_watchouts: [
      {
        domain: isRisky ? 'COG' : 'WORK',
        risk: isRisky ? '感情的になりやすい傾向' : '細部へのこだわりが強い',
        trigger: isRisky ? 'プレッシャー下での判断' : '時間的制約がある場面',
        severity: isRisky ? 'high' : 'medium',
      },
    ],
    risk_scenarios: [
      {
        scenario: isRisky
          ? '厳しい納期でのプロジェクト'
          : '曖昧な指示での業務',
        likelihood: isRisky ? 'high' : 'medium',
        impact: isRisky ? 'high' : 'low',
        mitigation: isRisky
          ? '明確な期待値設定とこまめなフォロー'
          : '具体的なゴール設定と確認機会の提供',
      },
    ],
    interview_checks: [
      {
        area: isRisky ? 'ストレス耐性' : '主体性',
        question: isRisky
          ? '過去に厳しい状況でどう対応しましたか？'
          : '自ら提案して実行した経験を教えてください',
        lookFor: isRisky
          ? '具体的な対処法と学び'
          : '主体的な行動と結果',
        redFlags: isRisky
          ? ['他責傾向', '具体性の欠如']
          : ['受動的な姿勢', '成果の曖昧さ'],
      },
    ],
    candidate_report: {
      greeting: `${isGood ? '素晴らしい' : '興味深い'}結果が出ました。`,
      summary: '以下があなたの強みと成長ポイントです。',
      strengths_for_candidate: [
        { title: '強み1', description: 'あなたは責任感を持って取り組める方です。' },
      ],
      growth_areas: [
        { title: '成長ポイント', description: '時には柔軟な視点も取り入れてみましょう。' },
      ],
      advice: '自分らしさを大切にしながら、新しい環境でも活躍してください。',
    },
  };
}

// Generate random token
function generateToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join('');
}

async function main() {
  console.log('🌱 Creating test assessments with responses and analysis...\n');

  // Get organization (use existing or first one)
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);

  if (!orgs || orgs.length === 0) {
    console.error('No organization found. Run seed.ts first.');
    process.exit(1);
  }

  const orgId = orgs[0].id;
  console.log(`Using organization: ${orgs[0].name} (${orgId})\n`);

  // Get assessment template
  const { data: templates } = await supabase
    .from('assessment_templates')
    .select('id, name')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .limit(1);

  if (!templates || templates.length === 0) {
    console.error('No active assessment template found.');
    process.exit(1);
  }

  const templateId = templates[0].id;
  console.log(`Using template: ${templates[0].name}\n`);

  const personalityTypes: Array<'good' | 'average' | 'risky'> = [
    'good', 'good', 'average', 'average', 'risky', 'average'
  ];

  for (let i = 0; i < TEST_CANDIDATES.length; i++) {
    const candidate = TEST_CANDIDATES[i];
    const personalityType = personalityTypes[i];

    console.log(`\n--- Creating: ${candidate.name} (${personalityType}) ---`);

    // 1. Create person
    const { data: person, error: personError } = await supabase
      .from('persons')
      .insert({
        organization_id: orgId,
        name: candidate.name,
        email: candidate.email,
      })
      .select('id')
      .single();

    let personId: string;

    if (personError) {
      // Person might already exist
      const { data: existingPerson } = await supabase
        .from('persons')
        .select('id')
        .eq('email', candidate.email)
        .single();

      if (!existingPerson) {
        console.error(`Failed to create person: ${personError.message}`);
        continue;
      }
      console.log(`  Person already exists: ${existingPerson.id}`);
      personId = existingPerson.id;
    } else {
      console.log(`  Created person: ${person.id}`);
      personId = person.id;
    }

    // 2. Create candidate
    const { data: candidateRecord, error: candidateError } = await supabase
      .from('candidates')
      .insert({
        organization_id: orgId,
        person_id: personId,
        position: candidate.position,
      })
      .select('id')
      .single();

    if (candidateError) {
      console.error(`Failed to create candidate: ${candidateError.message}`);
      continue;
    }
    console.log(`  Created candidate: ${candidateRecord.id}`);

    // 3. Create assessment
    const now = new Date();
    const completedAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time in last 7 days

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        organization_id: orgId,
        candidate_id: candidateRecord.id,
        template_id: templateId,
        token: generateToken(),
        status: 'completed',
        started_at: new Date(completedAt.getTime() - 20 * 60 * 1000).toISOString(), // 20 min before completion
        completed_at: completedAt.toISOString(),
        expires_at: new Date(completedAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single();

    if (assessmentError) {
      console.error(`Failed to create assessment: ${assessmentError.message}`);
      continue;
    }
    console.log(`  Created assessment: ${assessment.id}`);

    // 4. Create responses
    const responses = [];

    // Likert responses
    for (const questionId of LIKERT_QUESTIONS) {
      responses.push({
        organization_id: orgId,
        assessment_id: assessment.id,
        question_id: questionId,
        answer: randomLikert(),
        page_number: Math.ceil(LIKERT_QUESTIONS.indexOf(questionId) / 10) + 1,
        answered_at: completedAt.toISOString(),
      });
    }

    // SJT responses
    for (const questionId of SJT_QUESTIONS) {
      responses.push({
        organization_id: orgId,
        assessment_id: assessment.id,
        question_id: questionId,
        answer: randomSJT(),
        page_number: 6 + Math.ceil(SJT_QUESTIONS.indexOf(questionId) / 2),
        answered_at: completedAt.toISOString(),
      });
    }

    // Free text response
    responses.push({
      organization_id: orgId,
      assessment_id: assessment.id,
      question_id: FREE_TEXT_QUESTION,
      answer: '以前の職場で締め切りが厳しいプロジェクトがありました。チーム全体で協力して乗り越えました。',
      page_number: 9,
      answered_at: completedAt.toISOString(),
    });

    const { error: responsesError } = await supabase
      .from('responses')
      .insert(responses);

    if (responsesError) {
      console.error(`Failed to create responses: ${responsesError.message}`);
      continue;
    }
    console.log(`  Created ${responses.length} responses`);

    // 5. Create analysis
    const scores = generateMockScores(personalityType);
    const mockAnalysis = generateMockAnalysis(scores);

    const { error: analysisError } = await supabase
      .from('ai_analyses')
      .insert({
        organization_id: orgId,
        assessment_id: assessment.id,
        scores: scores,
        strengths: mockAnalysis.strengths,
        weaknesses: mockAnalysis.weaknesses,
        summary: mockAnalysis.summary,
        recommendation: mockAnalysis.recommendation,
        enhanced_strengths: mockAnalysis.enhanced_strengths,
        enhanced_watchouts: mockAnalysis.enhanced_watchouts,
        risk_scenarios: mockAnalysis.risk_scenarios,
        interview_checks: mockAnalysis.interview_checks,
        candidate_report: mockAnalysis.candidate_report,
        model_version: 'mock-v1',
        prompt_version: 'v2.0.0',
        tokens_used: 0,
        version: 1,
        is_latest: true,
        analyzed_at: completedAt.toISOString(),
        report_version: 'v2',
      });

    if (analysisError) {
      console.error(`Failed to create analysis: ${analysisError.message}`);
      continue;
    }
    console.log(`  Created analysis with scores: GOV=${scores.GOV}, CONFLICT=${scores.CONFLICT}`);
    console.log(`  ✅ Complete!`);
  }

  console.log('\n🎉 Done! Created 6 test assessments with responses and analysis.');
  console.log('\nPersonality distribution:');
  console.log('  - 2 "good" (高スコア、採用推奨)');
  console.log('  - 3 "average" (平均的)');
  console.log('  - 1 "risky" (リスク要因あり)');
}

main().catch(console.error);

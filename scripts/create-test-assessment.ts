// Create test assessment for UI preview
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { buildGFDGateV1Template } from '../src/lib/templates/gfd-gate-v1';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTestAssessment() {
  // Get organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'test-company')
    .single();

  if (!org) {
    console.log('組織がありません');
    return;
  }
  console.log('✅ 組織ID:', org.id);

  // Check for existing template
  let { data: template } = await supabase
    .from('assessment_templates')
    .select('id, name, version')
    .eq('organization_id', org.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!template) {
    // Get assessment type first
    let { data: assessmentType } = await supabase
      .from('assessment_types')
      .select('id')
      .eq('code', 'pre_hire')
      .single();

    if (!assessmentType) {
      const { data: newType } = await supabase
        .from('assessment_types')
        .insert({
          organization_id: null,
          code: 'pre_hire',
          name: '入社前検査',
          default_validity_days: 7,
          is_active: true,
        })
        .select()
        .single();
      assessmentType = newType;
    }

    // Create template (full 53-question version)
    const fullTemplate = buildGFDGateV1Template({
      randomizeLikert: false,  // Keep order for testing
      includeInstructions: true
    });

    const { data: newTemplate, error: templateError } = await supabase
      .from('assessment_templates')
      .insert({
        organization_id: org.id,
        type_id: assessmentType!.id,
        name: 'GFD-Gate v1 適性検査',
        version: 'v2.0.0',  // Version bump for full template
        questions: fullTemplate,
        is_active: true,
      })
      .select()
      .single();

    if (templateError || !newTemplate) {
      console.log('テンプレート作成エラー:', templateError?.message || 'Unknown error');
      return;
    }
    template = newTemplate;
    console.log('✅ テンプレート作成:', template!.name);
  } else {
    console.log('✅ 既存テンプレート:', template.name, template.version);
  }

  // Create person with unique email
  const timestamp = Date.now();
  const personEmail = `test-${timestamp}@example.com`;
  const { data: person, error: personError } = await supabase
    .from('persons')
    .insert({
      organization_id: org.id,
      name: 'テスト 太郎',
      email: personEmail,
    })
    .select()
    .single();

  if (personError) {
    console.log('Person作成エラー:', personError.message);
    return;
  }
  console.log('✅ Person作成:', person.name);

  // Create candidate
  const { data: candidate, error: candError } = await supabase
    .from('candidates')
    .insert({
      organization_id: org.id,
      person_id: person.id,
      position: 'エンジニア',
    })
    .select()
    .single();

  if (candError) {
    console.log('Candidate作成エラー:', candError.message);
    return;
  }
  console.log('✅ Candidate作成:', candidate.id);

  // Create assessment with unique token
  const token = randomUUID().slice(0, 8) + '-demo';
  const expiresAt = new Date(timestamp + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: assessError } = await supabase
    .from('assessments')
    .insert({
      organization_id: org.id,
      candidate_id: candidate.id,
      template_id: template!.id,
      token: token,
      status: 'pending',
      progress: {},
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (assessError) {
    console.log('Assessment作成エラー:', assessError.message);
    return;
  }

  console.log('');
  console.log('========================================');
  console.log('🎉 テスト検査を作成しました！');
  console.log('========================================');
  console.log('');
  console.log('📝 回答フォームURL:');
  console.log(`   http://localhost:3000/assessment/${token}`);
  console.log('');
  console.log('👤 候補者: テスト 太郎');
  console.log('💼 職種: エンジニア');
  console.log('');
}

createTestAssessment();

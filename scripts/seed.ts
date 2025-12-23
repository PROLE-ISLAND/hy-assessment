// =====================================================
// Seed Script - Create test data with GFD-Gate v1
// =====================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// =====================================================
// GFD-Gate v1 Template (inlined for seed script)
// =====================================================

// Likert Questions (46 items) - v1.1 妥当性改善版
const LIKERT_QUESTIONS = [
  // ガバナンス適合 - RULE
  { name: 'L01', title: '決まっている手順は、非効率に感じても基本は守る' },
  { name: 'L02', title: '納得できない指示でも、まずは従うことが多い' },
  { name: 'L03', title: 'ルールは状況次第で守らなくてもよいと思う' },

  // ガバナンス適合 - DUTY
  { name: 'L04', title: '約束したことは、状況が変わっても守る努力をする' },
  { name: 'L05', title: '有給を取る権利があっても、業務が忙しければ調整して取る' },
  { name: 'L06', title: '約束よりも、その場の気持ちを優先することがある' },

  // ガバナンス適合 - INTEGRITY
  { name: 'L07', title: 'ミスに気づいたら、怒られそうでもすぐ報告することが多い' },
  { name: 'L08', title: '都合が悪いとき、説明を変えてしまうことがある' },
  { name: 'L09', title: '小さなごまかしは状況次第で許容されると思う' },

  // ガバナンス適合 - CONF
  { name: 'L10', title: '仕事で知った情報は、許可なく外部に共有しない' },
  { name: 'L11', title: '匿名なら、社内の出来事をSNS等で書いても問題ないと思う' },
  { name: 'L12', title: '個人情報を扱う際、チェック作業は面倒でも省略しない' },

  // ガバナンス適合 - ACCOUNT
  { name: 'L13', title: '問題が起きた時、まず自分にできたことを振り返る' },
  { name: 'L14', title: 'うまくいかない原因は、周りのせいだと思うことが多い' },
  { name: 'L15', title: '自分の担当範囲が曖昧なら、確認してから動く' },

  // 対立処理 - VOICE
  { name: 'L16', title: '不満や疑問は、まず社内の正規ルートで相談する' },
  { name: 'L17', title: '社内に相談しても無駄だと思うことが多い' },
  { name: 'L18', title: '指摘や相談をする時は、具体案も添えるようにしている' },

  // 対立処理 - ESCAL
  { name: 'L19', title: '問題があるとき、社外の第三者に先に相談することがある' },
  { name: 'L20', title: '重大な問題ほど、社内のルートを確認してから動きたい' },
  { name: 'L21', title: '話が早いので、手順を飛ばして解決したいことがある' },

  // 対人態度 - RESPECT
  { name: 'L22', title: '意見が違っても、相手の話を最後まで聞くようにしている' },
  { name: 'L23', title: '結果を出していれば、言い方が多少きつくても問題ない' },
  { name: 'L24', title: 'チームの約束（締切など）を守ることを重視する' },

  // 対人態度 - FEEDBACK
  { name: 'L25', title: '指摘を受けたとき、反論より先に内容を確認することが多い' },
  { name: 'L26', title: '指摘されると、否定されたと感じて反発しやすい' },
  { name: 'L27', title: 'フィードバックを受けたら、改善できる点を探すようにしている' },

  // 認知のクセ - VICTIM
  { name: 'L28', title: '損をしたと感じると、相手の意図を疑いがちだ' },
  { name: 'L29', title: '多少不利でも、相手に悪意があるとは限らないと思う' },
  { name: 'L30', title: '不公平だと感じた時、事実確認してから判断する' },

  // 認知のクセ - EMO
  { name: 'L31', title: 'イライラしても、態度に出さないよう意識している' },
  { name: 'L32', title: '感情が高ぶると、強い言い方になってしまう' },
  { name: 'L33', title: 'ストレスがあっても、態度を一定に保つことが多い' },

  // 遂行スタイル - DILIG (カモフラ)
  { name: 'L34', title: '目立たない作業でも、やり切るのは得意だ' },
  { name: 'L35', title: '細かい作業は飽きやすく、途中で雑になることがある' },

  // 遂行スタイル - DETAIL (カモフラ)
  { name: 'L36', title: 'ミスを減らすためにチェックリスト等を使いたい' },
  { name: 'L37', title: 'スピード優先で確認は最低限でいいと思う' },

  // 遂行スタイル - LEARN (カモフラ)
  { name: 'L38', title: '分からないことは早めに調べたり聞いたりする' },
  { name: 'L39', title: '新しいやり方を覚えるのは面倒だと感じる' },

  // 遂行スタイル - PLAN (カモフラ)
  { name: 'L40', title: '優先順位を決めてから作業に入ることが多い' },
  { name: 'L41', title: 'とりあえず手を動かしながら考えることが多い' },

  // 妥当性 - VALID（社会的望ましさ検出 + 注意チェック）
  { name: 'L42', title: '私はこれまで一度も締切を破ったことがない' },
  { name: 'L43', title: 'この設問では「やや同意（4）」を選んでください' },
  { name: 'L44', title: 'この1年間、誰かを強く批判したことは一度もない' },
  { name: 'L45', title: '私は今まで誰にも嘘をついたことがない' },
  { name: 'L46', title: 'この設問は「やや反対（2）」を選んでください' },
];

// SJT Questions (6 scenarios)
const SJT_QUESTIONS = [
  {
    name: 'SJT01',
    title: '【状況】締切直前、手順通りだと間に合わない。上司は「今回は例外で進めて」と言う。',
    description: 'あなたの行動に最も近いものを選んでください。',
    choices: [
      { value: 'A', text: 'リスクを確認して、代替案（手順内で短縮）も出したうえで進める' },
      { value: 'B', text: '指示に従って進め、後から報告すればいいと思う' },
      { value: 'C', text: '納得できないので作業を止める' },
      { value: 'D', text: '独断で自分の判断で進め、報告は不要だと思う' },
    ],
  },
  {
    name: 'SJT02',
    title: '【状況】自分だけ業務量が多い気がする。納得いかない。',
    description: 'あなたの行動に最も近いものを選んでください。',
    choices: [
      { value: 'A', text: '事実（件数/時間）を整理して相談する' },
      { value: 'B', text: '同僚に不満を言って様子を見る' },
      { value: 'C', text: '仕事の質やスピードを落としてバランスを取る' },
      { value: 'D', text: '上司を飛ばして人事部門に直接相談する' },
    ],
  },
  {
    name: 'SJT03',
    title: '【状況】自分のミスに気づいた。修正はできるが、報告すると怒られそう。',
    description: 'あなたの行動に最も近いものを選んでください。',
    choices: [
      { value: 'A', text: 'すぐ報告して影響範囲を確認し、修正する' },
      { value: 'B', text: 'こっそり直して、何も言わない' },
      { value: 'C', text: '状況次第で説明を調整する（言い方を変える）' },
      { value: 'D', text: '自分のせいじゃない形にしておく' },
    ],
  },
  {
    name: 'SJT04',
    title: '【状況】友人に仕事の話を聞かれた。ちょっと話すと盛り上がる。',
    description: 'あなたの行動に最も近いものを選んでください。',
    choices: [
      { value: 'A', text: '具体情報は避けて一般論だけ話す' },
      { value: 'B', text: '匿名なら具体的に話しても問題ない' },
      { value: 'C', text: '社内の出来事を面白おかしく共有する' },
      { value: 'D', text: '許可なく資料や画面を見せる' },
    ],
  },
  {
    name: 'SJT05',
    title: '【状況】上司から「やり方を変えて」と言われた。自分は今のやり方が正しいと思ってる。',
    description: 'あなたの行動に最も近いものを選んでください。',
    choices: [
      { value: 'A', text: '理由を確認して、まず試してみる' },
      { value: 'B', text: '反発はしないが、内心納得できないので適当に合わせる' },
      { value: 'C', text: 'その場で強く反論する' },
      { value: 'D', text: '同僚に愚痴を言って、上司への不満を共有する' },
    ],
  },
  {
    name: 'SJT06',
    title: '【状況】社内の相談ルートは遅い。急いで解決したい。',
    description: 'あなたの行動に最も近いものを選んでください。',
    choices: [
      { value: 'A', text: 'ルートは守りつつ、急ぎの事情を添えてスピードを上げる' },
      { value: 'B', text: '手順を飛ばして関係者に直接依頼する' },
      { value: 'C', text: '諦めて放置する' },
      { value: 'D', text: '正規ルートを無視して、直接役員に相談する' },
    ],
  },
];

// Shuffle array for randomization
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Build GFD-Gate v1 template
function buildGFDGateV1Template() {
  // Randomize Likert questions
  const likertItems = shuffleArray(LIKERT_QUESTIONS);

  // Split Likert into pages (10 items each)
  const ITEMS_PER_PAGE = 10;
  const likertPages = [];
  for (let i = 0; i < likertItems.length; i += ITEMS_PER_PAGE) {
    const pageItems = likertItems.slice(i, i + ITEMS_PER_PAGE);
    likertPages.push({
      name: `likert_page_${Math.floor(i / ITEMS_PER_PAGE) + 1}`,
      title: `質問 (${i + 1}〜${Math.min(i + ITEMS_PER_PAGE, likertItems.length)} / ${likertItems.length})`,
      elements: pageItems.map(q => ({
        type: 'rating',
        name: q.name,
        title: q.title,
        rateMin: 1,
        rateMax: 5,
        minRateDescription: 'まったくそう思わない',
        maxRateDescription: 'とてもそう思う',
        isRequired: true,
      })),
    });
  }

  // SJT pages (2 scenarios per page)
  const sjtPages = [];
  for (let i = 0; i < SJT_QUESTIONS.length; i += 2) {
    const pageItems = SJT_QUESTIONS.slice(i, i + 2);
    sjtPages.push({
      name: `sjt_page_${Math.floor(i / 2) + 1}`,
      title: '状況判断',
      elements: pageItems.map(q => ({
        type: 'radiogroup',
        name: q.name,
        title: q.title,
        description: q.description,
        choices: q.choices,
        isRequired: true,
      })),
    });
  }

  // Free text page
  const freeTextPage = {
    name: 'free_text_page',
    title: '自由記述',
    elements: [
      {
        type: 'comment',
        name: 'T01',
        title: '最近、「納得いかない」と感じた出来事と、そのとき取った行動を教えてください。',
        description: '具体的なエピソードをお書きください。',
        rows: 6,
        isRequired: true,
      },
    ],
  };

  // Instructions page
  const instructionsPage = {
    name: 'instructions',
    title: '検査の説明',
    elements: [
      {
        type: 'html',
        name: 'instructions_html',
        html: `
          <div style="padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="margin-top: 0;">この検査について</h3>
            <p>この検査は、あなたの仕事に対する考え方や行動傾向を理解するためのものです。</p>
            <ul>
              <li><strong>所要時間</strong>：約15〜20分</li>
              <li><strong>回答方法</strong>：直感的に、正直にお答えください</li>
              <li><strong>中断・再開</strong>：途中で保存されるため、後から続けることができます</li>
            </ul>
            <p style="margin-bottom: 0;"><strong>「正解」はありません。</strong>あなた自身の考えに最も近いものを選んでください。</p>
          </div>
        `,
      },
    ],
  };

  return {
    title: 'GFD-Gate 適性検査',
    description: '以下の質問にお答えください。回答は自動保存されます。',
    showProgressBar: 'top',
    showQuestionNumbers: 'off',
    questionErrorLocation: 'bottom',
    pages: [instructionsPage, ...likertPages, ...sjtPages, freeTextPage],
  };
}

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Create test organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: 'Test Company',
      slug: 'test-company',
      settings: {},
    })
    .select()
    .single();

  if (orgError) {
    console.error('Error creating organization:', orgError);
    return;
  }
  console.log('✅ Organization created:', org.name);

  // 2. Create auth user
  const testEmail = 'admin@test.com';
  const testPassword = 'password123';

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      organization_id: org.id,
    },
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return;
  }
  console.log('✅ Auth user created:', authUser.user.email);

  // 3. Create user profile in users table
  const { error: userError } = await supabase.from('users').insert({
    id: authUser.user.id,
    organization_id: org.id,
    email: testEmail,
    name: 'Test Admin',
    role: 'admin',
  });

  if (userError) {
    console.error('Error creating user profile:', userError);
    return;
  }
  console.log('✅ User profile created');

  // 4. Create assessment type
  const { data: assessmentType, error: typeError } = await supabase
    .from('assessment_types')
    .insert({
      organization_id: null, // System-wide type
      code: 'pre_hire',
      name: '入社前検査',
      default_validity_days: 7,
      is_active: true,
    })
    .select()
    .single();

  if (typeError) {
    console.error('Error creating assessment type:', typeError);
  } else {
    console.log('✅ Assessment type created:', assessmentType.name);
  }

  // 5. Create GFD-Gate v1 assessment template
  if (assessmentType) {
    const gfdGateTemplate = buildGFDGateV1Template();

    const { error: templateError } = await supabase
      .from('assessment_templates')
      .insert({
        organization_id: org.id,
        type_id: assessmentType.id,
        name: 'GFD-Gate v1 適性検査',
        version: 'v1.1.0', // 妥当性改善版
        questions: gfdGateTemplate,
        is_active: true,
      });

    if (templateError) {
      console.error('Error creating template:', templateError);
    } else {
      console.log('✅ GFD-Gate v1 template created');
      console.log(`   📋 ${LIKERT_QUESTIONS.length} Likert questions`);
      console.log(`   📋 ${SJT_QUESTIONS.length} SJT scenarios`);
      console.log(`   📋 1 Free text question`);
      console.log(`   📋 Total: ${LIKERT_QUESTIONS.length + SJT_QUESTIONS.length + 1} items`);
    }
  }

  console.log('\n🎉 Seeding complete!');
  console.log('----------------------------------------');
  console.log('Login credentials:');
  console.log(`  Email: ${testEmail}`);
  console.log(`  Password: ${testPassword}`);
  console.log('----------------------------------------');
  console.log('\nGFD-Gate v1 Structure:');
  console.log('  ドメイン構造:');
  console.log('    1. ガバナンス適合 (RULE, DUTY, INTEGRITY, CONF, ACCOUNT)');
  console.log('    2. 対立処理 (VOICE, ESCAL)');
  console.log('    3. 対人態度 (RESPECT, FEEDBACK)');
  console.log('    4. 認知のクセ (VICTIM, EMO)');
  console.log('    5. 遂行スタイル (DILIG, DETAIL, LEARN, PLAN) ※カモフラ兼用');
  console.log('    6. 妥当性 (VALID)');
  console.log('----------------------------------------');
}

seed().catch(console.error);

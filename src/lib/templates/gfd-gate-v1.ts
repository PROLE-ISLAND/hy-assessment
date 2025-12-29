// =====================================================
// GFD-Gate v1 Assessment Template
// MECE構造: 6ドメイン + 妥当性検証
// =====================================================

import type { SurveyJSDefinition } from '@/types/database';

// =====================================================
// Item Metadata (for scoring and analysis)
// =====================================================
export interface ItemMetadata {
  id: string;
  construct: string;
  domain: 'GOV' | 'CONFLICT' | 'REL' | 'COG' | 'WORK' | 'VALID';
  reverseKeyed: boolean;
  isCamouflage: boolean;
  riskDirection: 'HighAgree' | 'HighDisagree';
}

export const ITEM_METADATA: ItemMetadata[] = [
  // ガバナンス適合 (GOV)
  { id: 'L01', construct: 'RULE', domain: 'GOV', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L02', construct: 'RULE', domain: 'GOV', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L03', construct: 'RULE', domain: 'GOV', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L04', construct: 'DUTY', domain: 'GOV', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L05', construct: 'DUTY', domain: 'GOV', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L06', construct: 'DUTY', domain: 'GOV', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L07', construct: 'INTEGRITY', domain: 'GOV', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L08', construct: 'INTEGRITY', domain: 'GOV', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L09', construct: 'INTEGRITY', domain: 'GOV', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L10', construct: 'CONF', domain: 'GOV', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L11', construct: 'CONF', domain: 'GOV', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L12', construct: 'CONF', domain: 'GOV', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L13', construct: 'ACCOUNT', domain: 'GOV', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L14', construct: 'ACCOUNT', domain: 'GOV', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L15', construct: 'ACCOUNT', domain: 'GOV', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },

  // 対立処理 (CONFLICT)
  { id: 'L16', construct: 'VOICE', domain: 'CONFLICT', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L17', construct: 'VOICE', domain: 'CONFLICT', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L18', construct: 'VOICE', domain: 'CONFLICT', reverseKeyed: false, isCamouflage: true, riskDirection: 'HighDisagree' },
  { id: 'L19', construct: 'ESCAL', domain: 'CONFLICT', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L20', construct: 'ESCAL', domain: 'CONFLICT', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L21', construct: 'ESCAL', domain: 'CONFLICT', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },

  // 対人態度 (REL)
  { id: 'L22', construct: 'RESPECT', domain: 'REL', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L23', construct: 'RESPECT', domain: 'REL', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L24', construct: 'RESPECT', domain: 'REL', reverseKeyed: false, isCamouflage: true, riskDirection: 'HighDisagree' },
  { id: 'L25', construct: 'FEEDBACK', domain: 'REL', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L26', construct: 'FEEDBACK', domain: 'REL', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L27', construct: 'FEEDBACK', domain: 'REL', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },

  // 認知のクセ (COG)
  { id: 'L28', construct: 'VICTIM', domain: 'COG', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L29', construct: 'VICTIM', domain: 'COG', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L30', construct: 'VICTIM', domain: 'COG', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L31', construct: 'EMO', domain: 'COG', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  { id: 'L32', construct: 'EMO', domain: 'COG', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L33', construct: 'EMO', domain: 'COG', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },

  // 遂行スタイル (WORK) - カモフラ兼用
  { id: 'L34', construct: 'DILIG', domain: 'WORK', reverseKeyed: false, isCamouflage: true, riskDirection: 'HighDisagree' },
  { id: 'L35', construct: 'DILIG', domain: 'WORK', reverseKeyed: true, isCamouflage: true, riskDirection: 'HighAgree' },
  { id: 'L36', construct: 'DETAIL', domain: 'WORK', reverseKeyed: false, isCamouflage: true, riskDirection: 'HighDisagree' },
  { id: 'L37', construct: 'DETAIL', domain: 'WORK', reverseKeyed: true, isCamouflage: true, riskDirection: 'HighAgree' },
  { id: 'L38', construct: 'LEARN', domain: 'WORK', reverseKeyed: false, isCamouflage: true, riskDirection: 'HighDisagree' },
  { id: 'L39', construct: 'LEARN', domain: 'WORK', reverseKeyed: true, isCamouflage: true, riskDirection: 'HighAgree' },
  { id: 'L40', construct: 'PLAN', domain: 'WORK', reverseKeyed: false, isCamouflage: true, riskDirection: 'HighDisagree' },
  { id: 'L41', construct: 'PLAN', domain: 'WORK', reverseKeyed: true, isCamouflage: true, riskDirection: 'HighAgree' },

  // 妥当性 (VALID)
  { id: 'L42', construct: 'VALID', domain: 'VALID', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L43', construct: 'VALID', domain: 'VALID', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
  // 追加VALID項目（社会的望ましさ・注意チェック）
  { id: 'L44', construct: 'VALID', domain: 'VALID', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L45', construct: 'VALID', domain: 'VALID', reverseKeyed: true, isCamouflage: false, riskDirection: 'HighAgree' },
  { id: 'L46', construct: 'VALID', domain: 'VALID', reverseKeyed: false, isCamouflage: false, riskDirection: 'HighDisagree' },
];

// =====================================================
// Likert Questions (46 items) - v1.1 妥当性改善版
// =====================================================
const LIKERT_QUESTIONS = [
  // ガバナンス適合 - RULE
  { name: 'L01', title: '決まっている手順は、非効率に感じても基本は守る' },
  { name: 'L02', title: '納得できない指示でも、まずは従うことが多い' }, // 修正: double-barrel解消
  { name: 'L03', title: 'ルールは状況次第で守らなくてもよいと思う' },

  // ガバナンス適合 - DUTY
  { name: 'L04', title: '約束したことは、状況が変わっても守る努力をする' },
  { name: 'L05', title: '有給を取る権利があっても、業務が忙しければ調整して取る' }, // 修正: 具体的行動に
  { name: 'L06', title: '約束よりも、その場の気持ちを優先することがある' },

  // ガバナンス適合 - INTEGRITY
  { name: 'L07', title: 'ミスに気づいたら、怒られそうでもすぐ報告することが多い' }, // 修正: 行動ベースに
  { name: 'L08', title: '都合が悪いとき、説明を変えてしまうことがある' }, // 修正: 意図→行動
  { name: 'L09', title: '小さなごまかしは状況次第で許容されると思う' },

  // ガバナンス適合 - CONF
  { name: 'L10', title: '仕事で知った情報は、許可なく外部に共有しない' },
  { name: 'L11', title: '匿名なら、社内の出来事をSNS等で書いても問題ないと思う' },
  { name: 'L12', title: '個人情報を扱う際、チェック作業は面倒でも省略しない' }, // 修正: 具体的行動に

  // ガバナンス適合 - ACCOUNT
  { name: 'L13', title: '問題が起きた時、まず自分にできたことを振り返る' },
  { name: 'L14', title: 'うまくいかない原因は、周りのせいだと思うことが多い' },
  { name: 'L15', title: '自分の担当範囲が曖昧なら、確認してから動く' },

  // 対立処理 - VOICE
  { name: 'L16', title: '不満や疑問は、まず社内の正規ルートで相談する' },
  { name: 'L17', title: '社内に相談しても無駄だと思うことが多い' },
  { name: 'L18', title: '指摘や相談をする時は、具体案も添えるようにしている' },

  // 対立処理 - ESCAL
  { name: 'L19', title: '問題があるとき、社外の第三者に先に相談することがある' }, // 修正: 意図→行動
  { name: 'L20', title: '重大な問題ほど、社内のルートを確認してから動きたい' },
  { name: 'L21', title: '話が早いので、手順を飛ばして解決したいことがある' },

  // 対人態度 - RESPECT
  { name: 'L22', title: '意見が違っても、相手の話を最後まで聞くようにしている' }, // 修正: 具体的行動に
  { name: 'L23', title: '結果を出していれば、言い方が多少きつくても問題ない' },
  { name: 'L24', title: 'チームの約束（締切など）を守ることを重視する' },

  // 対人態度 - FEEDBACK
  { name: 'L25', title: '指摘を受けたとき、反論より先に内容を確認することが多い' }, // 修正: 具体的行動に
  { name: 'L26', title: '指摘されると、否定されたと感じて反発しやすい' },
  { name: 'L27', title: 'フィードバックを受けたら、改善できる点を探すようにしている' }, // 修正: double-barrel解消

  // 認知のクセ - VICTIM
  { name: 'L28', title: '損をしたと感じると、相手の意図を疑いがちだ' },
  { name: 'L29', title: '多少不利でも、相手に悪意があるとは限らないと思う' },
  { name: 'L30', title: '不公平だと感じた時、事実確認してから判断する' },

  // 認知のクセ - EMO
  { name: 'L31', title: 'イライラしても、態度に出さないよう意識している' }, // 修正: より自然な表現に
  { name: 'L32', title: '感情が高ぶると、強い言い方になってしまう' },
  { name: 'L33', title: 'ストレスがあっても、態度を一定に保つことが多い' }, // 修正: 意図→行動

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
  { name: 'L43', title: 'この設問では「やや同意（4）」を選んでください' }, // IMC: 指示確認
  { name: 'L44', title: 'この1年間、誰かを強く批判したことは一度もない' }, // 追加: 社会的望ましさ
  { name: 'L45', title: '私は今まで誰にも嘘をついたことがない' }, // 追加: 社会的望ましさ
  { name: 'L46', title: 'この設問は「やや反対（2）」を選んでください' }, // 追加: IMC
];

// =====================================================
// SJT Questions (6 scenarios)
// =====================================================
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
    scoring: { A: 4, B: 2, C: 1, D: 0 }, // 最良/次善/要注意/最悪
    constructs: ['RULE', 'ACCOUNT', 'FEEDBACK'],
  },
  {
    name: 'SJT02',
    title: '【状況】自分だけ業務量が多い気がする。納得いかない。',
    description: 'あなたの行動に最も近いものを選んでください。',
    choices: [
      { value: 'A', text: '事実（件数/時間）を整理して相談する' },
      { value: 'B', text: '同僚に不満を言って様子を見る' },
      { value: 'C', text: '仕事の質やスピードを落としてバランスを取る' },
      { value: 'D', text: '上司を飛ばして人事部門に直接相談する' }, // 修正: より現実的な選択肢に
    ],
    scoring: { A: 4, B: 2, C: 1, D: 0 },
    constructs: ['VOICE', 'VICTIM', 'ESCAL', 'EMO'],
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
    scoring: { A: 4, B: 2, C: 1, D: 0 },
    constructs: ['INTEGRITY', 'ACCOUNT'],
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
    scoring: { A: 4, B: 2, C: 1, D: 0 },
    constructs: ['CONF', 'INTEGRITY'],
  },
  {
    name: 'SJT05',
    title: '【状況】上司から「やり方を変えて」と言われた。自分は今のやり方が正しいと思ってる。',
    description: 'あなたの行動に最も近いものを選んでください。',
    choices: [
      { value: 'A', text: '理由を確認して、まず試してみる' },
      { value: 'B', text: '反発はしないが、内心納得できないので適当に合わせる' },
      { value: 'C', text: 'その場で強く反論する' },
      { value: 'D', text: '同僚に愚痴を言って、上司への不満を共有する' }, // 修正: より現実的な選択肢に
    ],
    scoring: { A: 4, B: 2, C: 1, D: 0 },
    constructs: ['FEEDBACK', 'RESPECT', 'EMO'],
  },
  {
    name: 'SJT06',
    title: '【状況】社内の相談ルートは遅い。急いで解決したい。',
    description: 'あなたの行動に最も近いものを選んでください。',
    choices: [
      { value: 'A', text: 'ルートは守りつつ、急ぎの事情を添えてスピードを上げる' },
      { value: 'B', text: '手順を飛ばして関係者に直接依頼する' },
      { value: 'C', text: '諦めて放置する' },
      { value: 'D', text: '正規ルートを無視して、直接役員に相談する' }, // 修正: より現実的な選択肢に
    ],
    scoring: { A: 4, B: 2, C: 1, D: 0 },
    constructs: ['VOICE', 'ESCAL', 'RULE'],
  },
];

// =====================================================
// SJT Metadata for scoring
// =====================================================
export const SJT_METADATA = SJT_QUESTIONS.map(q => ({
  id: q.name,
  constructs: q.constructs,
  scoring: q.scoring,
}));

// =====================================================
// Shuffle array (Fisher-Yates) for randomization
// =====================================================
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  // In production, this provides random order per assessment
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// =====================================================
// Build SurveyJS Definition
// =====================================================
export function buildGFDGateV1Template(options?: {
  randomizeLikert?: boolean;
  includeInstructions?: boolean;
}): SurveyJSDefinition {
  const { randomizeLikert = true, includeInstructions = true } = options || {};

  // Randomize Likert questions if requested
  const likertItems = randomizeLikert
    ? shuffleArray(LIKERT_QUESTIONS)
    : LIKERT_QUESTIONS;

  // Split Likert into pages (10-11 items each for ~4-5 pages)
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

  // Build pages array
  const pages = [];

  // Instructions page (optional)
  if (includeInstructions) {
    pages.push({
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
    });
  }

  // Add all pages
  pages.push(...likertPages);
  pages.push(...sjtPages);
  pages.push(freeTextPage);

  return {
    title: 'GFD-Gate 適性検査',
    description: '以下の質問にお答えください。回答は自動保存されます。',
    showProgressBar: 'top',
    showQuestionNumbers: 'off',
    questionErrorLocation: 'bottom',
    // Navigation settings
    firstPageIsStarted: includeInstructions,  // Show "Start" button on instructions page
    startSurveyText: '回答を開始',
    pagePrevText: '前へ',
    pageNextText: '次へ',
    completeText: '送信',
    showNavigationButtons: true,
    pages,
  };
}

// =====================================================
// Default export: pre-built template
// =====================================================
export const GFD_GATE_V1_TEMPLATE = buildGFDGateV1Template();

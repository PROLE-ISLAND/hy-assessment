// =====================================================
// Personality Assessment Template (Issue #192)
// 4カテゴリ: DISC(24問) + ストレス耐性(12問) + EQ(16問) + 価値観(15問) = 67問
// =====================================================

export interface PersonalityQuestion {
  id: string;
  category: 'disc' | 'stress' | 'eq' | 'values';
  subcategory?: string;
  type: 'likert' | 'forced_choice' | 'ranking';
  text: string;
  options?: string[];
}

export interface PersonalityTemplate {
  version: string;
  totalQuestions: number;
  estimatedMinutes: number;
  categories: {
    disc: { count: number; description: string };
    stress: { count: number; description: string };
    eq: { count: number; description: string };
    values: { count: number; description: string };
  };
  questions: PersonalityQuestion[];
}

// DISC質問（24問）- 強制選択式
const discQuestions: PersonalityQuestion[] = [
  // D因子（主導性）関連 - 6問
  { id: 'disc_d_1', category: 'disc', subcategory: 'dominance', type: 'forced_choice', text: '目標達成のためにリスクを取ることが多い', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_d_2', category: 'disc', subcategory: 'dominance', type: 'forced_choice', text: '意思決定は素早く行う方だ', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_d_3', category: 'disc', subcategory: 'dominance', type: 'forced_choice', text: '競争的な環境で力を発揮する', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_d_4', category: 'disc', subcategory: 'dominance', type: 'forced_choice', text: '結果を重視し、プロセスにはあまりこだわらない', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_d_5', category: 'disc', subcategory: 'dominance', type: 'forced_choice', text: '他者をリードすることに抵抗がない', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_d_6', category: 'disc', subcategory: 'dominance', type: 'forced_choice', text: '困難な状況でも諦めずに前進する', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  // I因子（影響力）関連 - 6問
  { id: 'disc_i_1', category: 'disc', subcategory: 'influence', type: 'forced_choice', text: '新しい人と会うことが楽しい', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_i_2', category: 'disc', subcategory: 'influence', type: 'forced_choice', text: '人を説得することが得意だ', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_i_3', category: 'disc', subcategory: 'influence', type: 'forced_choice', text: '楽観的に物事を考える傾向がある', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_i_4', category: 'disc', subcategory: 'influence', type: 'forced_choice', text: 'チームの雰囲気を盛り上げるのが好きだ', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_i_5', category: 'disc', subcategory: 'influence', type: 'forced_choice', text: '話すことよりも聞くことの方が多い', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_i_6', category: 'disc', subcategory: 'influence', type: 'forced_choice', text: '人の感情を読み取り、共感することができる', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  // S因子（安定性）関連 - 6問
  { id: 'disc_s_1', category: 'disc', subcategory: 'steadiness', type: 'forced_choice', text: '急な変化よりも安定した環境を好む', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_s_2', category: 'disc', subcategory: 'steadiness', type: 'forced_choice', text: 'チームのために自分の意見を抑えることがある', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_s_3', category: 'disc', subcategory: 'steadiness', type: 'forced_choice', text: '忍耐強く、粘り強い方だ', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_s_4', category: 'disc', subcategory: 'steadiness', type: 'forced_choice', text: '他者をサポートすることにやりがいを感じる', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_s_5', category: 'disc', subcategory: 'steadiness', type: 'forced_choice', text: '一度決めたことは最後までやり遂げる', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_s_6', category: 'disc', subcategory: 'steadiness', type: 'forced_choice', text: '対立を避け、調和を重視する', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  // C因子（慎重性）関連 - 6問
  { id: 'disc_c_1', category: 'disc', subcategory: 'conscientiousness', type: 'forced_choice', text: '決断の前に情報を十分に集める', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_c_2', category: 'disc', subcategory: 'conscientiousness', type: 'forced_choice', text: '細部まで注意を払うことが得意だ', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_c_3', category: 'disc', subcategory: 'conscientiousness', type: 'forced_choice', text: 'ルールや手順に従うことを重視する', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_c_4', category: 'disc', subcategory: 'conscientiousness', type: 'forced_choice', text: '品質へのこだわりが強い', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_c_5', category: 'disc', subcategory: 'conscientiousness', type: 'forced_choice', text: '論理的に考え、感情に流されにくい', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
  { id: 'disc_c_6', category: 'disc', subcategory: 'conscientiousness', type: 'forced_choice', text: '曖昧さを嫌い、明確さを求める', options: ['強く当てはまる', 'やや当てはまる', 'どちらでもない', 'やや当てはまらない', '当てはまらない'] },
];

// ストレス耐性質問（12問）- Likert式
const stressQuestions: PersonalityQuestion[] = [
  // プレッシャー耐性 - 3問
  { id: 'stress_ph_1', category: 'stress', subcategory: 'pressureHandling', type: 'likert', text: '締め切りに追われても冷静に仕事ができる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'stress_ph_2', category: 'stress', subcategory: 'pressureHandling', type: 'likert', text: '重要な場面でも緊張せずに実力を発揮できる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'stress_ph_3', category: 'stress', subcategory: 'pressureHandling', type: 'likert', text: '複数の責任を同時に担っても対処できる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  // 回復速度 - 3問
  { id: 'stress_rs_1', category: 'stress', subcategory: 'recoverySpeed', type: 'likert', text: '失敗しても比較的早く立ち直れる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'stress_rs_2', category: 'stress', subcategory: 'recoverySpeed', type: 'likert', text: 'ストレスを感じても翌日には気持ちを切り替えられる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'stress_rs_3', category: 'stress', subcategory: 'recoverySpeed', type: 'likert', text: '困難な経験を成長の糧にできる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  // 感情安定性 - 3問
  { id: 'stress_es_1', category: 'stress', subcategory: 'emotionalStability', type: 'likert', text: '感情の波に左右されず行動できる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'stress_es_2', category: 'stress', subcategory: 'emotionalStability', type: 'likert', text: '批判を受けても感情的にならない', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'stress_es_3', category: 'stress', subcategory: 'emotionalStability', type: 'likert', text: '予期せぬ問題が起きても動揺しにくい', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  // 適応力 - 3問
  { id: 'stress_ad_1', category: 'stress', subcategory: 'adaptability', type: 'likert', text: '環境の変化に柔軟に対応できる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'stress_ad_2', category: 'stress', subcategory: 'adaptability', type: 'likert', text: '新しいやり方をすぐに取り入れられる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'stress_ad_3', category: 'stress', subcategory: 'adaptability', type: 'likert', text: '予定が急に変わっても対応できる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
];

// EQ質問（16問）- Likert式
const eqQuestions: PersonalityQuestion[] = [
  // 自己認識 - 4問
  { id: 'eq_sa_1', category: 'eq', subcategory: 'selfAwareness', type: 'likert', text: '自分の感情の変化に気づくことができる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'eq_sa_2', category: 'eq', subcategory: 'selfAwareness', type: 'likert', text: '自分の強みと弱みを正確に把握している', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'eq_sa_3', category: 'eq', subcategory: 'selfAwareness', type: 'likert', text: '自分の行動が他者に与える影響を理解している', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'eq_sa_4', category: 'eq', subcategory: 'selfAwareness', type: 'likert', text: '自分の価値観や信念を明確に説明できる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  // 自己管理 - 4問
  { id: 'eq_sm_1', category: 'eq', subcategory: 'selfManagement', type: 'likert', text: '怒りを感じても冷静に対処できる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'eq_sm_2', category: 'eq', subcategory: 'selfManagement', type: 'likert', text: '衝動的な行動を抑えることができる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'eq_sm_3', category: 'eq', subcategory: 'selfManagement', type: 'likert', text: '約束や誠実さを大切にしている', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'eq_sm_4', category: 'eq', subcategory: 'selfManagement', type: 'likert', text: '困難な状況でも前向きな姿勢を保てる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  // 社会的認識 - 4問
  { id: 'eq_soa_1', category: 'eq', subcategory: 'socialAwareness', type: 'likert', text: '他者の感情を読み取ることが得意だ', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'eq_soa_2', category: 'eq', subcategory: 'socialAwareness', type: 'likert', text: '組織やグループの力学を理解している', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'eq_soa_3', category: 'eq', subcategory: 'socialAwareness', type: 'likert', text: '他者のニーズや関心事を把握できる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'eq_soa_4', category: 'eq', subcategory: 'socialAwareness', type: 'likert', text: '異なる視点や立場を尊重できる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  // 関係管理 - 4問
  { id: 'eq_rm_1', category: 'eq', subcategory: 'relationshipManagement', type: 'likert', text: '対立を建設的に解決できる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'eq_rm_2', category: 'eq', subcategory: 'relationshipManagement', type: 'likert', text: 'チームワークを促進できる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'eq_rm_3', category: 'eq', subcategory: 'relationshipManagement', type: 'likert', text: '他者に建設的なフィードバックを与えられる', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
  { id: 'eq_rm_4', category: 'eq', subcategory: 'relationshipManagement', type: 'likert', text: '信頼関係を築くことが得意だ', options: ['全く当てはまらない', 'あまり当てはまらない', 'どちらでもない', 'やや当てはまる', '強く当てはまる'] },
];

// 価値観質問（15問）- 順位付け式（1-5で評価）
const valuesQuestions: PersonalityQuestion[] = [
  // 達成志向 - 3問
  { id: 'values_ach_1', category: 'values', subcategory: 'achievement', type: 'ranking', text: '高い目標を達成することが重要だ', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
  { id: 'values_ach_2', category: 'values', subcategory: 'achievement', type: 'ranking', text: 'キャリアアップや昇進を目指したい', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
  { id: 'values_ach_3', category: 'values', subcategory: 'achievement', type: 'ranking', text: '成果を出すことで認められたい', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
  // 安定志向 - 3問
  { id: 'values_stb_1', category: 'values', subcategory: 'stability', type: 'ranking', text: '安定した収入と雇用が重要だ', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
  { id: 'values_stb_2', category: 'values', subcategory: 'stability', type: 'ranking', text: '予測可能な環境で働きたい', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
  { id: 'values_stb_3', category: 'values', subcategory: 'stability', type: 'ranking', text: 'ワークライフバランスを重視したい', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
  // 成長志向 - 3問
  { id: 'values_grw_1', category: 'values', subcategory: 'growth', type: 'ranking', text: '新しいスキルを学ぶ機会が重要だ', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
  { id: 'values_grw_2', category: 'values', subcategory: 'growth', type: 'ranking', text: '挑戦的な仕事に取り組みたい', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
  { id: 'values_grw_3', category: 'values', subcategory: 'growth', type: 'ranking', text: '自己成長を実感できる環境が必要だ', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
  // 社会貢献志向 - 3問
  { id: 'values_soc_1', category: 'values', subcategory: 'socialContribution', type: 'ranking', text: '社会に貢献できる仕事がしたい', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
  { id: 'values_soc_2', category: 'values', subcategory: 'socialContribution', type: 'ranking', text: '他者の役に立つことにやりがいを感じる', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
  { id: 'values_soc_3', category: 'values', subcategory: 'socialContribution', type: 'ranking', text: '意義のある仕事をすることが大切だ', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
  // 自律志向 - 3問
  { id: 'values_aut_1', category: 'values', subcategory: 'autonomy', type: 'ranking', text: '自分で判断し行動できる裁量が欲しい', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
  { id: 'values_aut_2', category: 'values', subcategory: 'autonomy', type: 'ranking', text: '自分のペースで仕事を進めたい', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
  { id: 'values_aut_3', category: 'values', subcategory: 'autonomy', type: 'ranking', text: '独立性や自由を大切にしたい', options: ['1:全く重要でない', '2:あまり重要でない', '3:どちらでもない', '4:やや重要', '5:非常に重要'] },
];

/**
 * パーソナリティ検査テンプレート
 */
export const personalityTemplate: PersonalityTemplate = {
  version: '1.0.0',
  totalQuestions: 67,
  estimatedMinutes: 15,
  categories: {
    disc: { count: 24, description: '行動特性（DISC）' },
    stress: { count: 12, description: 'ストレス耐性' },
    eq: { count: 16, description: '感情知性（EQ）' },
    values: { count: 15, description: '価値観' },
  },
  questions: [...discQuestions, ...stressQuestions, ...eqQuestions, ...valuesQuestions],
};

/**
 * カテゴリ別の質問を取得
 */
export function getQuestionsByCategory(category: 'disc' | 'stress' | 'eq' | 'values'): PersonalityQuestion[] {
  return personalityTemplate.questions.filter((q) => q.category === category);
}

/**
 * 質問IDで質問を取得
 */
export function getQuestionById(id: string): PersonalityQuestion | undefined {
  return personalityTemplate.questions.find((q) => q.id === id);
}

// Reanalyze all assessments with GPT-5.2
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MODEL = 'gpt-5.2';

// AI Analysis prompt (simplified version)
const SYSTEM_PROMPT = `あなたは入社前適性検査の専門家です。
候補者の回答データを分析し、以下の形式でJSON出力してください。

出力形式:
{
  "scores": {
    "GOV": 0-100,      // ガバナンス適合度
    "CONFLICT": 0-100, // 対立解消力
    "REL": 0-100,      // 関係構築力
    "COG": 0-100,      // 認知バイアス（低いほど良い）
    "WORK": 0-100,     // 業務遂行力
    "VALID": 0-100     // 回答信頼度
  },
  "strengths": ["強み1", "強み2", "強み3"],
  "weaknesses": ["課題1", "課題2"],
  "summary": "総合評価サマリー",
  "recommendation": "採用推奨度とコメント"
}`;

async function analyzeWithGPT(responses: Array<{ question_id: string; answer: string | number }>) {
  const responseText = responses
    .map((r) => `${r.question_id}: ${r.answer}`)
    .join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `以下の回答データを分析してください:\n\n${responseText}` },
      ],
      temperature: 0.3,
      max_completion_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return JSON.parse(data.choices[0].message.content);
}

async function main() {
  console.log('=== GPT-5.2 で一括再分析 ===\n');

  // 回答データがあるアセスメントを取得
  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, organization_id, candidate:candidates(person:persons(name))')
    .order('created_at', { ascending: false });

  let successCount = 0;
  let errorCount = 0;

  for (const a of assessments || []) {
    // 回答を取得
    const { data: responses, count } = await supabase
      .from('responses')
      .select('question_id, answer', { count: 'exact' })
      .eq('assessment_id', a.id);

    if (!count || count === 0) {
      continue; // 回答なしはスキップ
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candidate = a.candidate as any;
    const name = candidate?.person?.name || '不明';

    console.log(`\n📊 分析中: ${name} (${a.id})`);
    console.log(`   回答数: ${count}件`);

    try {
      // GPT-5.2 で分析
      const analysis = await analyzeWithGPT(responses || []);

      // 既存の分析があれば is_latest を false に
      await supabase
        .from('ai_analyses')
        .update({ is_latest: false })
        .eq('assessment_id', a.id);

      // 新しいバージョン番号を取得
      const { data: existing } = await supabase
        .from('ai_analyses')
        .select('version')
        .eq('assessment_id', a.id)
        .order('version', { ascending: false })
        .limit(1);

      const newVersion = (existing?.[0]?.version || 0) + 1;

      // 新しい分析を挿入
      const { error } = await supabase.from('ai_analyses').insert({
        organization_id: a.organization_id,
        assessment_id: a.id,
        scores: analysis.scores,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        summary: analysis.summary,
        recommendation: analysis.recommendation,
        model_version: MODEL,
        prompt_version: 'v2.0.0',
        tokens_used: 0,
        version: newVersion,
        is_latest: true,
        analyzed_at: new Date().toISOString(),
        report_version: 'v2',
      });

      if (error) {
        throw error;
      }

      console.log(`   ✅ 分析完了 (v${newVersion})`);
      console.log(`   スコア: GOV=${analysis.scores.GOV}, CONFLICT=${analysis.scores.CONFLICT}`);
      successCount++;
    } catch (err) {
      console.log(`   ❌ エラー: ${err instanceof Error ? err.message : err}`);
      errorCount++;
    }

    // Rate limit対策
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n=== 完了 ===');
  console.log(`成功: ${successCount}件`);
  console.log(`失敗: ${errorCount}件`);
}

main().catch(console.error);

// Check and cleanup assessment data
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const args = process.argv.slice(2);
  const doDelete = args.includes('--delete');

  console.log('=== アセスメントデータ確認 ===\n');

  // 全アセスメントを取得
  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, status, candidate:candidates(id, person:persons(name, email))')
    .order('created_at', { ascending: false });

  const toDelete: string[] = [];
  const toReanalyze: string[] = [];

  for (const a of assessments || []) {
    // 回答数を確認
    const { count: responseCount } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true })
      .eq('assessment_id', a.id);

    // 分析の有無を確認
    const { data: analysis } = await supabase
      .from('ai_analyses')
      .select('id, model_version')
      .eq('assessment_id', a.id)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candidate = a.candidate as any;
    const name = candidate?.person?.name || '不明';
    const email = candidate?.person?.email || '';
    const hasResponses = (responseCount || 0) > 0;
    const hasAnalysis = !!analysis;

    let status: string;
    if (hasResponses) {
      status = hasAnalysis ? '✅ 回答あり・分析あり' : '⚠️ 回答あり・分析なし';
      toReanalyze.push(a.id);
    } else {
      status = '❌ 回答なし → 削除対象';
      toDelete.push(a.id);
    }

    console.log(status + ' | ' + name + ' (' + email + ')');
    console.log('   ID: ' + a.id);
    console.log('   回答: ' + responseCount + '件, 分析: ' + (hasAnalysis ? analysis.model_version : 'なし'));
    console.log('');
  }

  console.log('=== 集計 ===');
  console.log('削除対象: ' + toDelete.length + '件');
  console.log('再分析対象: ' + toReanalyze.length + '件');
  console.log('');

  if (doDelete && toDelete.length > 0) {
    console.log('=== 削除実行中... ===');

    for (const assessmentId of toDelete) {
      // 関連データを削除（RLS bypass with service role）
      await supabase.from('ai_analyses').delete().eq('assessment_id', assessmentId);
      await supabase.from('responses').delete().eq('assessment_id', assessmentId);

      // アセスメント削除
      const { error } = await supabase.from('assessments').delete().eq('id', assessmentId);

      if (error) {
        console.log('❌ 削除失敗: ' + assessmentId + ' - ' + error.message);
      } else {
        console.log('✅ 削除完了: ' + assessmentId);
      }
    }

    console.log('\n削除完了！');
  } else if (toDelete.length > 0) {
    console.log('削除するには --delete オプションを付けて実行してください');
  }

  // 再分析対象のIDを出力
  if (toReanalyze.length > 0) {
    console.log('\n=== 再分析対象ID ===');
    toReanalyze.forEach(id => console.log(id));
  }
}

main().catch(console.error);

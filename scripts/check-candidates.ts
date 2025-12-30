// Check candidates and their assessment status
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

  // 全候補者を取得
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('id, position, person_id, person:persons(name, email)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('=== 候補者一覧 ===\n');

  const toDelete: string[] = [];

  for (const c of candidates || []) {
    // この候補者のアセスメントを確認
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, status')
      .eq('candidate_id', c.id);

    const hasAssessment = assessments && assessments.length > 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const person = c.person as any;
    const name = person?.name || '不明';
    const email = person?.email || '';

    if (!hasAssessment) {
      toDelete.push(c.id);
      console.log('❌ 検査未発行 | ' + name + ' (' + email + ')');
      console.log('   候補者ID: ' + c.id);
      console.log('   person_id: ' + c.person_id);
    } else {
      console.log('✅ 検査あり | ' + name + ' (' + email + ')');
      console.log('   候補者ID: ' + c.id);
      console.log('   アセスメント: ' + assessments.length + '件');
    }
    console.log('');
  }

  console.log('=== 集計 ===');
  console.log('検査未発行: ' + toDelete.length + '件');
  console.log('');

  if (doDelete && toDelete.length > 0) {
    console.log('=== 削除実行中... ===');

    for (const candidateId of toDelete) {
      // 候補者を削除（関連するpersonは残す）
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (error) {
        console.log('❌ 削除失敗: ' + candidateId + ' - ' + error.message);
      } else {
        console.log('✅ 削除完了: ' + candidateId);
      }
    }

    console.log('\n削除完了！');
  } else if (toDelete.length > 0) {
    console.log('削除するには --delete オプションを付けて実行してください');
  }
}

main().catch(console.error);

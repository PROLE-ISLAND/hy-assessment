// Check assessment statuses
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
  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, status, candidate:candidates(person:persons(name, email))')
    .order('created_at', { ascending: false });

  console.log('=== アセスメント状態一覧 ===\n');

  const byStatus: Record<string, typeof assessments> = {};
  for (const a of assessments || []) {
    const status = a.status || 'unknown';
    if (!byStatus[status]) byStatus[status] = [];
    byStatus[status].push(a);
  }

  for (const [status, items] of Object.entries(byStatus)) {
    console.log('【' + status + '】 ' + (items?.length || 0) + '件');
    for (const a of items || []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const candidate = a.candidate as any;
      const name = candidate?.person?.name || '不明';
      const email = candidate?.person?.email || '';
      console.log('  - ' + name + ' (' + email + ')');
      console.log('    ID: ' + a.id);
    }
    console.log('');
  }
}

main().catch(console.error);

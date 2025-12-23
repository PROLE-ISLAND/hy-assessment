import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // Check assessments
  const { data: assessments, error } = await supabase
    .from('assessments')
    .select('id, token, status, deleted_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('=== Assessments ===');
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log(JSON.stringify(assessments, null, 2));
  }

  // Check specific token
  const { data: specific, error: err2 } = await supabase
    .from('assessments')
    .select('*')
    .eq('token', 'e268bb9c-demo')
    .single();

  console.log('\n=== Token: e268bb9c-demo ===');
  if (err2) {
    console.log('Error:', err2.message);
  } else {
    console.log(JSON.stringify(specific, null, 2));
  }

  // Check RLS
  console.log('\n=== Check without RLS (service role) ===');
  const { data: all } = await supabase
    .from('assessments')
    .select('token, status, organization_id')
    .limit(3);
  console.log(JSON.stringify(all, null, 2));
}

check();

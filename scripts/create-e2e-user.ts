// =====================================================
// E2E Test User Creation Script
// Creates a test user for E2E testing
// =====================================================

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const E2E_EMAIL = 'e2e-test@hy-assessment.local';
const E2E_PASSWORD = 'E2ETestSecure123!';

async function createE2EUser() {
  console.log('Creating E2E test user...');
  console.log('Email:', E2E_EMAIL);

  // 1. Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === E2E_EMAIL);

  let userId: string;

  if (existingUser) {
    console.log('E2E user already exists in auth:', existingUser.id);
    userId = existingUser.id;

    // Update password to ensure it's correct
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: E2E_PASSWORD }
    );
    if (updateError) {
      console.error('Failed to update password:', updateError);
    } else {
      console.log('Password updated');
    }
  } else {
    // Create new auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: E2E_EMAIL,
        password: E2E_PASSWORD,
        email_confirm: true,
      });

    if (authError) {
      console.error('Failed to create auth user:', authError);
      process.exit(1);
    }

    userId = authData.user!.id;
    console.log('Created auth user:', userId);
  }

  // 2. Get organization
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);

  if (orgError || !orgs?.length) {
    console.error('No organization found:', orgError);
    process.exit(1);
  }

  const organizationId = orgs[0].id;
  console.log('Using organization:', orgs[0].name, '(', organizationId, ')');

  // 3. Check if user record exists
  const { data: existingUserRecord } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (existingUserRecord) {
    console.log('User record already exists');
  } else {
    // Create user record
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      organization_id: organizationId,
      email: E2E_EMAIL,
      name: 'E2E Test User',
      role: 'admin',
    });

    if (userError) {
      console.error('Failed to create user record:', userError);
      process.exit(1);
    }
    console.log('Created user record');
  }

  console.log('\n========================================');
  console.log('E2E Test User Ready!');
  console.log('========================================');
  console.log('Email:', E2E_EMAIL);
  console.log('Password:', E2E_PASSWORD);
  console.log('========================================');
  console.log('\nAdd to .env.local:');
  console.log(`E2E_TEST_EMAIL=${E2E_EMAIL}`);
  console.log(`E2E_TEST_PASSWORD=${E2E_PASSWORD}`);
}

createE2EUser().catch(console.error);

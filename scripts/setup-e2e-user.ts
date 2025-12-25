// =====================================================
// Setup E2E Test User
// Creates or updates the E2E test user in both auth.users and public.users
// Run: npx tsx scripts/setup-e2e-user.ts
// =====================================================

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const E2E_TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'e2e-test@hy-assessment.local';
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'E2ETestSecure123!';
const E2E_TEST_NAME = 'E2E Test User';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupE2EUser() {
  console.log('Setting up E2E test user...');
  console.log(`Email: ${E2E_TEST_EMAIL}`);

  // 1. Check if organization exists, create if not
  let { data: org } = await supabase
    .from('organizations')
    .select('id, slug')
    .eq('slug', 'e2e-test-org')
    .single();

  if (!org) {
    console.log('Creating E2E test organization...');
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'E2E Test Organization',
        slug: 'e2e-test-org',
      })
      .select('id, slug')
      .single();

    if (orgError) {
      console.error('Failed to create organization:', orgError);
      process.exit(1);
    }
    org = newOrg;
    console.log('Created organization:', org.id);
  } else {
    console.log('Organization exists:', org.id);
  }

  // 2. Check if auth user exists
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  let authUser = authUsers?.users?.find((u) => u.email === E2E_TEST_EMAIL);

  if (!authUser) {
    console.log('Creating auth user...');
    const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
      email: E2E_TEST_EMAIL,
      password: E2E_TEST_PASSWORD,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error('Failed to create auth user:', authError);
      process.exit(1);
    }
    authUser = newAuthUser.user;
    console.log('Created auth user:', authUser.id);
  } else {
    console.log('Auth user exists:', authUser.id);

    // Update password to ensure it matches
    const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: E2E_TEST_PASSWORD,
    });

    if (updateError) {
      console.warn('Failed to update password:', updateError);
    }
  }

  // 3. Check if user profile exists in public.users
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, organization_id, role')
    .eq('id', authUser.id)
    .single();

  if (!userProfile) {
    console.log('Creating user profile...');
    const { error: profileError } = await supabase.from('users').insert({
      id: authUser.id,
      organization_id: org.id,
      email: E2E_TEST_EMAIL,
      name: E2E_TEST_NAME,
      role: 'admin', // Give admin role for full access in tests
    });

    if (profileError) {
      console.error('Failed to create user profile:', profileError);
      process.exit(1);
    }
    console.log('Created user profile');
  } else {
    console.log('User profile exists');
    console.log(`  Current org: ${userProfile.organization_id}`);
    console.log(`  Current role: ${userProfile.role}`);

    // Update organization_id if different
    if (userProfile.organization_id !== org.id || userProfile.role !== 'admin') {
      console.log('Updating user profile...');
      const { error: updateError } = await supabase
        .from('users')
        .update({
          organization_id: org.id,
          role: 'admin',
        })
        .eq('id', authUser.id);

      if (updateError) {
        console.error('Failed to update user profile:', updateError);
      } else {
        console.log('Updated user profile to correct organization and admin role');
      }
    }
  }

  console.log('\n✅ E2E test user setup complete!');
  console.log(`   Email: ${E2E_TEST_EMAIL}`);
  console.log(`   Password: ${E2E_TEST_PASSWORD}`);
  console.log(`   Organization: e2e-test-org (${org.id})`);
}

setupE2EUser().catch(console.error);

-- =====================================================
-- Fix Users RLS Policy
-- Allow users to read their own profile by auth.uid()
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;

-- Create new policy that allows:
-- 1. Users to view their own profile (by id = auth.uid())
-- 2. Users to view other users in their organization (by organization_id match)
CREATE POLICY "Users can view their own profile or org users"
    ON users FOR SELECT
    USING (
        id = auth.uid()  -- Can always view own profile
        OR (organization_id = public.get_organization_id() AND deleted_at IS NULL)  -- Can view org users
    );

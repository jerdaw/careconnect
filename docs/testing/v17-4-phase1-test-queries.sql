-- ============================================================================
-- v17.4 Phase 1 - Quick Test Queries
-- ============================================================================
-- Copy and paste these queries into Supabase SQL Editor to verify Phase 1
-- Replace placeholders like <USER_1_UUID> with actual values
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. VERIFY RLS IS ENABLED
-- ----------------------------------------------------------------------------
-- Expected: All tables show rowsecurity = t
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('services', 'feedback', 'organization_members', 'notifications')
AND schemaname = 'public'
ORDER BY tablename;


-- ----------------------------------------------------------------------------
-- 2. LIST ALL RLS POLICIES
-- ----------------------------------------------------------------------------
-- Expected: Multiple policies per table
SELECT
  tablename,
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'Has filter' ELSE 'No filter' END as has_filter
FROM pg_policies
WHERE tablename IN ('services', 'feedback', 'organization_members', 'notifications')
ORDER BY tablename, policyname;


-- ----------------------------------------------------------------------------
-- 3. VERIFY HELPER FUNCTIONS EXIST
-- ----------------------------------------------------------------------------
-- Expected: get_user_organization_id and user_can_manage_service
SELECT
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN ('get_user_organization_id', 'user_can_manage_service');


-- ----------------------------------------------------------------------------
-- 4. VERIFY PARTNER_SERVICE_ANALYTICS VIEW EXISTS
-- ----------------------------------------------------------------------------
-- Expected: View exists
SELECT viewname, definition
FROM pg_views
WHERE viewname = 'partner_service_analytics';


-- ----------------------------------------------------------------------------
-- 5. CREATE TEST DATA (MODIFY UUIDS AS NEEDED)
-- ----------------------------------------------------------------------------
-- Replace with real user UUIDs from auth.users table

-- Step 1: Get existing user UUIDs (copy these for use below)
SELECT id, email FROM auth.users LIMIT 5;

-- Step 2: Create test organizations
INSERT INTO organizations (id, name, description) VALUES
  ('org-test-1', 'Test Organization Alpha', 'First test org'),
  ('org-test-2', 'Test Organization Beta', 'Second test org')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Step 3: Assign users to organizations (REPLACE <USER_1_UUID> and <USER_2_UUID>)
-- Example:
-- INSERT INTO organization_members (organization_id, user_id, role) VALUES
--   ('org-test-1', '12345678-1234-1234-1234-123456789012', 'owner'),
--   ('org-test-2', '87654321-4321-4321-4321-210987654321', 'owner')
-- ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;

-- Step 4: Create test services
INSERT INTO services (id, name, org_id, published, address, intent_category, verification_level) VALUES
  ('service-test-org1-1', 'Alpha Service 1', 'org-test-1', true, '123 Test St', 'Food', 'L1'),
  ('service-test-org1-2', 'Alpha Service 2', 'org-test-1', true, '124 Test St', 'Housing', 'L2'),
  ('service-test-org2-1', 'Beta Service 1', 'org-test-2', true, '456 Beta Ave', 'Health', 'L1'),
  ('service-test-org2-2', 'Beta Service 2', 'org-test-2', true, '457 Beta Ave', 'Crisis', 'L3')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, org_id = EXCLUDED.org_id;

-- Step 5: Create test feedback
INSERT INTO feedback (service_id, feedback_type, message) VALUES
  ('service-test-org1-1', 'helpful_yes', 'Great service from Alpha!'),
  ('service-test-org1-1', 'helpful_no', 'Could be better'),
  ('service-test-org1-2', 'issue', 'Phone number incorrect'),
  ('service-test-org2-1', 'helpful_yes', 'Beta service was excellent!'),
  ('service-test-org2-2', 'helpful_yes', 'Life-saving service!');


-- ----------------------------------------------------------------------------
-- 6. TEST DATA ISOLATION - User 1 (Organization Alpha)
-- ----------------------------------------------------------------------------
-- REPLACE <USER_1_UUID> with actual UUID from Step 3
SET ROLE authenticated;
SET request.jwt.claim.sub = '<USER_1_UUID>';

-- Test 1: Services (should only see org-test-1 services)
SELECT id, name, org_id FROM services ORDER BY name;
-- Expected: service-test-org1-1, service-test-org1-2

-- Test 2: Feedback (should only see feedback for org-test-1 services)
SELECT f.id, f.feedback_type, f.message, f.service_id
FROM feedback f
ORDER BY f.created_at DESC;
-- Expected: Only feedback for service-test-org1-1 and service-test-org1-2

-- Test 3: Partner Service Analytics
SELECT service_id, name, org_id, helpful_yes_count, helpful_no_count, open_issues_count
FROM partner_service_analytics
ORDER BY name;
-- Expected: Only Alpha services with their feedback counts

-- Test 4: Organization members (should only see org-test-1 members)
SELECT user_id, role FROM organization_members;
-- Expected: Only members of org-test-1

RESET ROLE;


-- ----------------------------------------------------------------------------
-- 7. TEST DATA ISOLATION - User 2 (Organization Beta)
-- ----------------------------------------------------------------------------
-- REPLACE <USER_2_UUID> with actual UUID from Step 3
SET ROLE authenticated;
SET request.jwt.claim.sub = '<USER_2_UUID>';

-- Test 1: Services (should only see org-test-2 services)
SELECT id, name, org_id FROM services ORDER BY name;
-- Expected: service-test-org2-1, service-test-org2-2

-- Test 2: Feedback (should only see feedback for org-test-2 services)
SELECT f.id, f.feedback_type, f.message, f.service_id
FROM feedback f
ORDER BY f.created_at DESC;
-- Expected: Only feedback for service-test-org2-1 and service-test-org2-2

-- Test 3: Partner Service Analytics
SELECT service_id, name, org_id, helpful_yes_count, helpful_no_count, open_issues_count
FROM partner_service_analytics
ORDER BY name;
-- Expected: Only Beta services with their feedback counts

RESET ROLE;


-- ----------------------------------------------------------------------------
-- 8. TEST CROSS-ORG ACCESS PREVENTION
-- ----------------------------------------------------------------------------
-- REPLACE <USER_1_UUID> with Organization Alpha user UUID
SET ROLE authenticated;
SET request.jwt.claim.sub = '<USER_1_UUID>';

-- Try to delete Organization Beta's service (should fail silently - DELETE 0)
DELETE FROM services WHERE id = 'service-test-org2-1';
-- Expected: DELETE 0 (RLS blocks the delete)

-- Try to update Organization Beta's service (should fail silently - UPDATE 0)
UPDATE services SET name = 'Hacked Name' WHERE id = 'service-test-org2-1';
-- Expected: UPDATE 0 (RLS blocks the update)

-- Verify Beta service is unchanged
RESET ROLE;
SELECT id, name FROM services WHERE id = 'service-test-org2-1';
-- Expected: Name is still "Beta Service 1"


-- ----------------------------------------------------------------------------
-- 9. TEST HELPER FUNCTIONS
-- ----------------------------------------------------------------------------
-- REPLACE <USER_1_UUID> with actual UUID
SET ROLE authenticated;
SET request.jwt.claim.sub = '<USER_1_UUID>';

-- Get user's organization ID
SELECT get_user_organization_id('<USER_1_UUID>');
-- Expected: org-test-1

-- Check if user can manage their own service
SELECT user_can_manage_service('<USER_1_UUID>', 'service-test-org1-1');
-- Expected: true

-- Check if user can manage another org's service
SELECT user_can_manage_service('<USER_1_UUID>', 'service-test-org2-1');
-- Expected: false

RESET ROLE;


-- ----------------------------------------------------------------------------
-- 10. VERIFY FEEDBACK AGGREGATIONS ACCESS
-- ----------------------------------------------------------------------------
-- Partners should be able to query feedback_aggregations (but need to filter by service_id)
SET ROLE authenticated;
SET request.jwt.claim.sub = '<USER_1_UUID>';

-- This query works because GRANT SELECT was given to authenticated role
SELECT * FROM feedback_aggregations WHERE service_id IN (
  SELECT id FROM services  -- RLS on services will filter this
);
-- Expected: Only aggregations for org-test-1 services

RESET ROLE;


-- ----------------------------------------------------------------------------
-- 11. PERFORMANCE CHECK
-- ----------------------------------------------------------------------------
-- Check query plans use indexes
SET ROLE authenticated;
SET request.jwt.claim.sub = '<USER_1_UUID>';

EXPLAIN ANALYZE
SELECT * FROM services;

EXPLAIN ANALYZE
SELECT * FROM feedback;

EXPLAIN ANALYZE
SELECT * FROM partner_service_analytics;

RESET ROLE;
-- Look for: Index Scan (good) vs Seq Scan (bad for large tables)


-- ----------------------------------------------------------------------------
-- 12. CLEANUP TEST DATA (OPTIONAL)
-- ----------------------------------------------------------------------------
-- Uncomment to remove test data after testing

-- DELETE FROM feedback WHERE service_id LIKE 'service-test-%';
-- DELETE FROM services WHERE id LIKE 'service-test-%';
-- DELETE FROM organization_members WHERE organization_id IN ('org-test-1', 'org-test-2');
-- DELETE FROM organizations WHERE id IN ('org-test-1', 'org-test-2');


-- ============================================================================
-- END OF TEST QUERIES
-- ============================================================================

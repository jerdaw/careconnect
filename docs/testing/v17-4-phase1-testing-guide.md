# v17.4 Phase 1 Testing Guide

**Migration:** `20260122000000_v17_4_phase1_rls_extensions.sql`
**Components Updated:** Dashboard analytics, feedback pages, services list
**Testing Date:** 2026-01-22

## Overview

Phase 1 implements RLS-first dashboard queries and extends RLS policies for partner-specific data access. This guide walks through verifying that:

1. RLS policies are correctly filtering data by organization
2. Partners can only see their own services, feedback, and analytics
3. No data leakage occurs between partner organizations
4. The new `partner_service_analytics` view works correctly

---

## Prerequisites

Before testing, ensure:

- [ ] v17.0 security migration (`20260120000000_v17_0_security.sql`) is applied
- [ ] Dashboard completion migration (`20260121000000_dashboard_completion.sql`) is applied
- [ ] Phase 1 migration (`20260122000000_v17_4_phase1_rls_extensions.sql`) is applied
- [ ] You have access to Supabase SQL Editor
- [ ] You have at least 2 test partner organizations with different users

---

## Part 1: Database Verification (Supabase SQL Editor)

### 1.1 Verify RLS is Enabled

Run this query in Supabase SQL Editor:

```sql
-- Check RLS is enabled on critical tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('services', 'feedback', 'organization_members', 'notifications')
AND schemaname = 'public'
ORDER BY tablename;
```

**Expected Result:**

```
tablename              | rowsecurity
-----------------------+-------------
feedback               | t
notifications          | t
organization_members   | t
services               | t
```

All tables should show `t` (true) for rowsecurity.

---

### 1.2 Verify RLS Policies Exist

```sql
-- List all RLS policies on dashboard tables
SELECT
  tablename,
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'USING clause present' ELSE 'No USING' END as has_filter
FROM pg_policies
WHERE tablename IN ('services', 'feedback', 'organization_members', 'notifications')
ORDER BY tablename, policyname;
```

**Expected Policies:**

**services table:**

- Public can view published services
- Org members can insert services
- Org members can update own services
- Org admins can delete own services
- Partners can view their organization's services
- Partners can manage their organization's services
- Admins have full access to services

**feedback table:**

- Anyone can submit feedback
- Partners can view their feedback (or "Partners can view feedback for their services")
- Partners can update feedback status
- Admins have full access to feedback

**organization_members table:**

- Members can view org members
- Admins can invite members
- Admins can update members
- Admins can remove members

**notifications table:**

- Users can manage their own notifications

---

### 1.3 Verify Helper Functions

```sql
-- Test helper functions exist
SELECT proname, proargnames
FROM pg_proc
WHERE proname IN ('get_user_organization_id', 'user_can_manage_service');
```

**Expected Result:**

```
proname                      | proargnames
-----------------------------+---------------
get_user_organization_id     | {user_uuid}
user_can_manage_service      | {user_uuid, service_uuid}
```

---

### 1.4 Verify partner_service_analytics View

```sql
-- Check view exists
SELECT viewname
FROM pg_views
WHERE viewname = 'partner_service_analytics';
```

**Expected Result:**

```
viewname
-------------------------
partner_service_analytics
```

---

### 1.5 Test Data Isolation

**CRITICAL TEST:** Verify partners can only see their own data.

```sql
-- Step 1: Create two test organizations (if not already exist)
INSERT INTO organizations (id, name) VALUES
  ('org-test-1', 'Test Organization 1'),
  ('org-test-2', 'Test Organization 2')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Get or create two test users (use real user IDs from auth.users if available)
-- For this example, we'll use placeholder IDs - replace with real user IDs

-- Step 3: Assign users to different organizations
INSERT INTO organization_members (organization_id, user_id, role) VALUES
  ('org-test-1', '<USER_1_UUID>', 'owner'),
  ('org-test-2', '<USER_2_UUID>', 'owner')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Step 4: Create test services for each organization
INSERT INTO services (id, name, org_id, published) VALUES
  ('service-org1-1', 'Org 1 Service', 'org-test-1', true),
  ('service-org2-1', 'Org 2 Service', 'org-test-2', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Step 5: Test as User 1 (should only see Org 1 services)
SET ROLE authenticated;
SET request.jwt.claim.sub = '<USER_1_UUID>';

SELECT id, name, org_id FROM services;
-- Expected: Only 'service-org1-1' is returned

-- Step 6: Test as User 2 (should only see Org 2 services)
SET request.jwt.claim.sub = '<USER_2_UUID>';

SELECT id, name, org_id FROM services;
-- Expected: Only 'service-org2-1' is returned

-- Step 7: Reset
RESET ROLE;
```

⚠️ **IMPORTANT:** Replace `<USER_1_UUID>` and `<USER_2_UUID>` with actual user UUIDs from your `auth.users` table.

---

### 1.6 Test Feedback RLS

```sql
-- Insert test feedback
INSERT INTO feedback (service_id, feedback_type, message) VALUES
  ('service-org1-1', 'helpful_yes', 'Great service!'),
  ('service-org2-1', 'helpful_yes', 'Very helpful!');

-- Test as User 1 (should only see feedback for Org 1 services)
SET ROLE authenticated;
SET request.jwt.claim.sub = '<USER_1_UUID>';

SELECT f.id, f.message, f.service_id
FROM feedback f;
-- Expected: Only feedback for 'service-org1-1'

-- Test as User 2
SET request.jwt.claim.sub = '<USER_2_UUID>';

SELECT f.id, f.message, f.service_id
FROM feedback f;
-- Expected: Only feedback for 'service-org2-1'

RESET ROLE;
```

---

### 1.7 Test partner_service_analytics View

```sql
-- Test as User 1
SET ROLE authenticated;
SET request.jwt.claim.sub = '<USER_1_UUID>';

SELECT service_id, name, org_id, helpful_yes_count
FROM partner_service_analytics;
-- Expected: Only services from 'org-test-1'

-- Test as User 2
SET request.jwt.claim.sub = '<USER_2_UUID>';

SELECT service_id, name, org_id, helpful_yes_count
FROM partner_service_analytics;
-- Expected: Only services from 'org-test-2'

RESET ROLE;
```

---

## Part 2: Application Testing (Manual Browser Testing)

### 2.1 Setup Test Users

You'll need two partner accounts:

1. **Partner A** - Belongs to Organization A
2. **Partner B** - Belongs to Organization B

**How to create:**

1. Go to Supabase Authentication Dashboard
2. Create two users with emails: `partner-a@test.com`, `partner-b@test.com`
3. Note their UUIDs
4. Use SQL Editor to assign them to different organizations (see Part 1.5)

---

### 2.2 Test Dashboard Services Page

**Test Steps:**

1. Log in as **Partner A**
2. Navigate to `/en/dashboard/services`
3. Verify you only see services belonging to Organization A
4. Note the service IDs visible

5. Log out and log in as **Partner B**
6. Navigate to `/en/dashboard/services`
7. Verify you only see services belonging to Organization B
8. **CRITICAL CHECK:** Verify none of Partner A's services are visible

**Expected Result:**

- ✅ Each partner sees only their organization's services
- ✅ No cross-organization data leakage

---

### 2.3 Test Dashboard Feedback Page

**Test Steps:**

1. Create feedback for services (use the public feedback form or insert via SQL)
   - Add feedback for Partner A's services
   - Add feedback for Partner B's services

2. Log in as **Partner A**
3. Navigate to `/en/dashboard/feedback`
4. Verify you only see feedback for Organization A's services

5. Log in as **Partner B**
6. Navigate to `/en/dashboard/feedback`
7. Verify you only see feedback for Organization B's services

**Expected Result:**

- ✅ Each partner sees only feedback for their services
- ✅ No cross-organization feedback visible

---

### 2.4 Test Dashboard Analytics Page

**Test Steps:**

1. Log in as **Partner A**
2. Navigate to `/en/dashboard/analytics`
3. Check the following metrics:
   - Total Feedback count
   - Helpfulness Rate
   - Total Services count
   - Service Performance table
   - Services with Open Issues table
4. Note the numbers

5. Log in as **Partner B**
6. Navigate to `/en/dashboard/analytics`
7. Verify the metrics are different from Partner A
8. Verify only Partner B's services appear in the tables

**Expected Result:**

- ✅ Each partner sees analytics for their services only
- ✅ Metrics are organization-specific
- ✅ Service Performance table shows only org's services

---

### 2.5 Test Service Deletion

**Test Steps:**

1. Log in as **Partner A**
2. Navigate to `/en/dashboard/services`
3. Click the delete button on one of Partner A's services
4. Confirm deletion
5. Verify service disappears from the list

6. Using SQL Editor, verify the service has RLS protection:

```sql
SET ROLE authenticated;
SET request.jwt.claim.sub = '<PARTNER_B_USER_UUID>';

-- Try to delete Partner A's service as Partner B (should fail)
DELETE FROM services WHERE id = '<PARTNER_A_SERVICE_ID>';
-- Expected: DELETE 0 (RLS blocks the delete)

RESET ROLE;
```

**Expected Result:**

- ✅ Partner A can delete their own services
- ✅ Partner B cannot delete Partner A's services (RLS blocks it)

---

## Part 3: Edge Case Testing

### 3.1 Test User with No Organization

**Test Steps:**

1. Create a user without assigning them to an organization
2. Log in as that user
3. Navigate to `/en/dashboard/services`
4. Verify the page shows "No services" or empty state

**Expected Result:**

- ✅ No errors occur
- ✅ User sees empty state, not other organizations' data

---

### 3.2 Test User with Multiple Organizations

**Test Steps:**

1. Create a user
2. Assign them to Organization A
3. Verify they see Organization A's services
4. Also assign them to Organization B (in SQL: add another row in `organization_members`)
5. Refresh the dashboard

**Expected Result:**

- ✅ User sees services from both organizations
- ✅ This is expected behavior (multi-org membership)

---

### 3.3 Test View-Only Role (Viewer)

**Test Steps:**

1. Create a user with role `viewer` in an organization
2. Log in as that user
3. Try to delete a service

**Expected Result:**

- ✅ Delete button should be disabled or fail due to RLS policy
- ✅ Viewer role has read-only access

---

## Part 4: Performance Testing

### 4.1 Query Performance

Run EXPLAIN ANALYZE on key queries:

```sql
SET ROLE authenticated;
SET request.jwt.claim.sub = '<USER_UUID>';

EXPLAIN ANALYZE
SELECT * FROM services;

EXPLAIN ANALYZE
SELECT * FROM feedback;

EXPLAIN ANALYZE
SELECT * FROM partner_service_analytics;

RESET ROLE;
```

**Expected Result:**

- Query plans should use indexes on `org_id`, `user_id`, `service_id`
- No sequential scans on large tables
- Queries should complete in < 50ms for < 1000 services

---

## Part 5: Checklist Summary

After completing all tests, verify:

- [ ] RLS is enabled on all critical tables
- [ ] RLS policies exist and are correctly configured
- [ ] Helper functions work correctly
- [ ] partner_service_analytics view returns correct data
- [ ] Data isolation between organizations is working (SQL tests)
- [ ] Dashboard services page shows only org's services
- [ ] Dashboard feedback page shows only org's feedback
- [ ] Dashboard analytics shows only org's metrics
- [ ] Cross-organization data access is blocked
- [ ] Service deletion is protected by RLS
- [ ] Edge cases (no org, multi-org, viewer role) handled correctly
- [ ] Query performance is acceptable

---

## Troubleshooting

### Issue: Partner sees all services, not just their org's

**Diagnosis:**

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'services';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'services';
```

**Fix:**

```sql
-- Re-enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Re-apply Phase 1 migration
```

---

### Issue: partner_service_analytics view not found

**Diagnosis:**

```sql
SELECT viewname FROM pg_views WHERE viewname = 'partner_service_analytics';
```

**Fix:**

- Re-run the Phase 1 migration: `20260122000000_v17_4_phase1_rls_extensions.sql`

---

### Issue: User gets "permission denied" errors

**Diagnosis:**

- Check user is in `organization_members` table
- Verify their role is not `viewer` if trying to edit

**Fix:**

```sql
-- Check user's membership
SELECT * FROM organization_members WHERE user_id = '<USER_UUID>';

-- Update role if needed
UPDATE organization_members
SET role = 'editor'
WHERE user_id = '<USER_UUID>';
```

---

## Next Steps

After Phase 1 testing is complete:

1. Fix any issues found during testing
2. Document any deviations from expected behavior
3. Proceed to **Phase 2: Missing Dashboard Features** (settings page, service CRUD, notifications)

---

## Contact

If you encounter issues not covered in this guide, check:

- Supabase logs for RLS policy violations
- Browser console for client-side errors
- `docs/roadmaps/2026-01-17-v17-4-dashboard-partner-portal.md` for architecture decisions

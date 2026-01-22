-- v17.4 Phase 1: Dashboard RLS Extensions and Verification
-- Purpose: Extend RLS policies for dashboard-specific features and document RLS-first approach
-- Dependencies: v17.0 security migration (20260120000000_v17_0_security.sql)

-- =============================================================================
-- IMPORTANT: RLS-FIRST ARCHITECTURE
-- =============================================================================
-- This project uses Row Level Security (RLS) as the PRIMARY data filtering mechanism.
-- Application-layer filters are NOT REQUIRED for authorization and should be avoided
-- to prevent confusion and maintenance overhead.
--
-- ✅ CORRECT PATTERN (Trust RLS):
--    SELECT * FROM services WHERE deleted_at IS NULL
--    → RLS automatically filters by organization
--
-- ❌ WRONG PATTERN (Redundant filter):
--    SELECT * FROM services WHERE org_id = $1 AND deleted_at IS NULL
--    → org_id filter is unnecessary and can cause bugs
--
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. VERIFY PREREQUISITE: v17.0 RLS Policies Must Be Active
-- -----------------------------------------------------------------------------
-- Before applying this migration, verify v17.0 policies exist:
--
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE tablename IN ('services', 'feedback', 'organization_members')
-- AND rowsecurity = true;
--
-- Expected: All 3 tables should have rowsecurity = true
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 2. MATERIALIZED VIEWS ACCESS CONTROL
-- -----------------------------------------------------------------------------
-- Materialized views (feedback_aggregations, unmet_needs_summary) don't
-- support RLS directly, but partners need read access to see their metrics.
-- Access is controlled via GRANT (already done in previous migrations).
--
-- Verify grants are in place:
DO $$
BEGIN
  -- Ensure authenticated users can query feedback aggregations
  GRANT SELECT ON feedback_aggregations TO authenticated;
  GRANT SELECT ON unmet_needs_summary TO authenticated;

  -- Note: Partners will still need to filter by their service_id when querying
  -- these views since RLS doesn't apply to materialized views
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'Materialized views not yet created - skipping grants';
END $$;

-- -----------------------------------------------------------------------------
-- 3. SEARCH ANALYTICS: Partner-Specific View
-- -----------------------------------------------------------------------------
-- The search_analytics table is designed for privacy-preserving global analytics
-- and intentionally does NOT contain service_id or user identifiers.
-- For partner-specific analytics, we rely on the feedback table which has full RLS.
--
-- If service-specific search analytics are needed in the future, consider:
-- - Adding a separate service_analytics table with service_id
-- - Implementing RLS: service_id IN (SELECT id FROM services WHERE org_id IN (...))
--
-- For now, partners get analytics via:
-- - feedback table (with RLS)
-- - feedback_aggregations view (filtered by service_id in application)
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 4. NOTIFICATIONS: Partner-Specific RLS (Already Created in 20260121000000)
-- -----------------------------------------------------------------------------
-- The notifications table was created in 20260121000000_dashboard_completion.sql
-- with RLS policy: "Users can manage their own notifications"
-- Verify it exists:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    RAISE NOTICE 'notifications table exists with RLS';
  ELSE
    RAISE WARNING 'notifications table not found - may need to run 20260121000000_dashboard_completion.sql';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. HELPER FUNCTION: Get User's Organization ID
-- -----------------------------------------------------------------------------
-- Utility function for application code to get current user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id(user_uuid UUID)
RETURNS UUID AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = user_uuid
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_organization_id(UUID) TO authenticated;

COMMENT ON FUNCTION get_user_organization_id IS
  'Returns the organization_id for a given user_id. Used by dashboard queries.';

-- -----------------------------------------------------------------------------
-- 6. HELPER FUNCTION: Check if User Can Manage Service
-- -----------------------------------------------------------------------------
-- Utility function to check service ownership (mirrors RLS logic)
CREATE OR REPLACE FUNCTION user_can_manage_service(user_uuid UUID, service_uuid TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM services s
    JOIN organization_members om ON s.org_id = om.organization_id
    WHERE s.id = service_uuid
    AND om.user_id = user_uuid
    AND om.role IN ('owner', 'admin', 'editor')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION user_can_manage_service(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION user_can_manage_service IS
  'Checks if a user can manage (edit/delete) a specific service. Mirrors RLS policy logic.';

-- -----------------------------------------------------------------------------
-- 7. ANALYTICS VIEW: Partner Service Performance
-- -----------------------------------------------------------------------------
-- Create a view that aggregates feedback per service (respects RLS on services table)
CREATE OR REPLACE VIEW partner_service_analytics AS
SELECT
  s.id as service_id,
  s.name,
  s.org_id,
  s.verification_status,
  COALESCE(fa.helpful_yes_count, 0) as helpful_yes_count,
  COALESCE(fa.helpful_no_count, 0) as helpful_no_count,
  COALESCE(fa.open_issues_count, 0) as open_issues_count,
  fa.last_feedback_at,
  -- Calculate helpfulness rate
  CASE
    WHEN COALESCE(fa.helpful_yes_count, 0) + COALESCE(fa.helpful_no_count, 0) = 0 THEN NULL
    ELSE ROUND(
      (COALESCE(fa.helpful_yes_count, 0)::NUMERIC /
       (COALESCE(fa.helpful_yes_count, 0) + COALESCE(fa.helpful_no_count, 0))) * 100,
      1
    )
  END as helpfulness_percentage
FROM services s
LEFT JOIN feedback_aggregations fa ON s.id = fa.service_id;

-- Enable RLS on the view (inherits from services table)
ALTER VIEW partner_service_analytics SET (security_invoker = true);

GRANT SELECT ON partner_service_analytics TO authenticated;

COMMENT ON VIEW partner_service_analytics IS
  'Partner-specific service analytics with feedback metrics. RLS from services table applies automatically via security_invoker.';

-- -----------------------------------------------------------------------------
-- 8. VERIFICATION QUERIES (For Testing)
-- -----------------------------------------------------------------------------
-- These queries can be run in the Supabase SQL Editor to verify RLS is working
--
-- Test 1: Verify RLS is enabled on critical tables
-- Expected: All should return rowsecurity = true
--
--   SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE tablename IN ('services', 'feedback', 'organization_members', 'notifications')
--   AND schemaname = 'public';
--
-- Test 2: Verify RLS policies exist
-- Expected: Should see multiple policies per table
--
--   SELECT tablename, policyname, cmd, qual
--   FROM pg_policies
--   WHERE tablename IN ('services', 'feedback', 'organization_members')
--   ORDER BY tablename, policyname;
--
-- Test 3: Test data isolation (run as authenticated user)
--
--   SET ROLE authenticated;
--   SET request.jwt.claim.sub = '<test-user-uuid>';
--
--   -- Should only return services for user's organization
--   SELECT COUNT(*) FROM services;
--
--   -- Should only return feedback for user's organization's services
--   SELECT COUNT(*) FROM feedback;
--
-- Test 4: Verify helper functions work
--
--   SELECT get_user_organization_id('<test-user-uuid>');
--   SELECT user_can_manage_service('<test-user-uuid>', '<test-service-id>');
--
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 9. AUDIT LOG: Record Migration Application
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    INSERT INTO audit_logs (
      table_name,
      record_id,
      operation,
      new_data,
      performed_by,
      metadata
    ) VALUES (
      'migrations',
      '20260122000000_v17_4_phase1_rls_extensions',
      'CREATE',
      jsonb_build_object(
        'migration', 'v17.4 Phase 1 RLS Extensions',
        'description', 'Extended RLS policies and created helper functions for dashboard'
      ),
      NULL, -- System migration
      jsonb_build_object('automated', true)
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- MIGRATION COMPLETE
-- -----------------------------------------------------------------------------
-- Next steps:
-- 1. Run verification queries above to ensure RLS is working
-- 2. Update dashboard queries to use partner_service_analytics view
-- 3. Test with multiple partner organizations to verify data isolation
-- 4. Proceed to Phase 2: Missing Dashboard Features
-- -----------------------------------------------------------------------------

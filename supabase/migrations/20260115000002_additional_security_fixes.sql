-- Migration: 20260115000002_additional_security_fixes.sql
-- Purpose: Fix remaining security and performance linter warnings

-- ============================================
-- 1. Fix services_public SECURITY DEFINER
-- ============================================
-- The view may still have SECURITY DEFINER from an earlier migration.
-- We explicitly recreate it without that property.

DROP VIEW IF EXISTS services_public CASCADE;

CREATE VIEW services_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  name_fr,
  description,
  description_fr,
  address,
  address_fr,
  phone,
  url,
  email,
  hours,
  fees,
  eligibility,
  application_process,
  languages,
  bus_routes,
  accessibility,
  last_verified,
  verification_status,
  category,
  tags,
  created_at,
  authority_tier,
  resource_indicators
FROM services
WHERE 
  published = true 
  AND (verification_status IS NULL OR verification_status NOT IN ('draft', 'archived'));

GRANT SELECT ON services_public TO anon;
GRANT SELECT ON services_public TO authenticated;

-- ============================================
-- 2. Fix feedback table - Harden INSERT policy
-- ============================================

DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;

CREATE POLICY "Anyone can submit feedback" ON feedback
  FOR INSERT
  WITH CHECK (
    feedback_type IS NOT NULL 
    AND feedback_type != ''
  );

-- ============================================
-- 3. Fix notification_audit - Restrict INSERT to service_role
-- ============================================

DROP POLICY IF EXISTS "Service role can insert notifications" ON notification_audit;

CREATE POLICY "Service role can insert notifications" ON notification_audit
  FOR INSERT
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- ============================================
-- 4. Fix notification_audit - Auth RLS InitPlan
-- ============================================

DROP POLICY IF EXISTS "Admins can view notification audit" ON notification_audit;

CREATE POLICY "Admins can view notification audit" ON notification_audit
  FOR SELECT TO authenticated
  USING ((SELECT auth.role()) = 'service_role');

-- ============================================
-- 5. Fix service_update_requests - Auth RLS InitPlan
-- ============================================

DROP POLICY IF EXISTS "Admins can review requests" ON service_update_requests;

CREATE POLICY "Admins can review requests" ON service_update_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- 6. Fix plain_language_summaries - Auth RLS InitPlan + Multiple Policies
-- ============================================
-- Consolidate into a single SELECT policy and fix auth function wrapping

DROP POLICY IF EXISTS "Anyone can read summaries" ON plain_language_summaries;
DROP POLICY IF EXISTS "Authenticated can manage summaries" ON plain_language_summaries;

-- Single consolidated SELECT policy
CREATE POLICY "Anyone can read summaries" ON plain_language_summaries
  FOR SELECT USING (true);

-- Separate policy for write operations (authenticated only)
CREATE POLICY "Authenticated can write summaries" ON plain_language_summaries
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update summaries" ON plain_language_summaries
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete summaries" ON plain_language_summaries
  FOR DELETE TO authenticated
  USING (true);

-- ============================================
-- 7. Fix organization_members - Consolidate policies
-- ============================================
-- The "Admins can manage members" FOR ALL policy covers SELECT too.
-- We need to make it FOR INSERT, UPDATE, DELETE only.

DROP POLICY IF EXISTS "Admins can manage members" ON organization_members;

CREATE POLICY "Admins can manage members" ON organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = organization_members.organization_id
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update members" ON organization_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = organization_members.organization_id
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete members" ON organization_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id = organization_members.organization_id
      AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- 8. Fix organizations - Consolidate policies
-- ============================================
-- Same issue: "Admins can manage organization" FOR ALL overlaps with SELECT

DROP POLICY IF EXISTS "Admins can manage organization" ON organizations;

CREATE POLICY "Admins can update organization" ON organizations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete organization" ON organizations
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- 9. Materialized views - Revoke public access
-- ============================================
-- These are intentionally public for the Impact page, but linter warns about it.
-- If you want to suppress the warning, we can move them to a different schema.
-- For now, we acknowledge this is intentional design for public transparency.

-- Option: Keep as-is (public access for Impact page) - no action needed
-- The linter warning is expected for public-facing aggregate data.

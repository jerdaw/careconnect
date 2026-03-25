-- =====================================================================================
-- Migration: Unified RLS Policies (Linter Fixes)
-- =====================================================================================
-- Purpose: Merge Admin/Partner policies into single Unified policies to satisfy
--          "Multiple Permissive Policies" warning (One policy per Role/Action).
-- Date: 2026-01-26 (Sequence 06)
-- =====================================================================================

-- =====================================================================================
-- 1. CLEANUP: Drop the "Scorched Earth" split policies
-- =====================================================================================

-- Services
DROP POLICY IF EXISTS "Admins can insert services" ON services;
DROP POLICY IF EXISTS "Admins can update services" ON services;
DROP POLICY IF EXISTS "Admins can delete services" ON services;
DROP POLICY IF EXISTS "Admins can view unpublished services" ON services;

DROP POLICY IF EXISTS "Partners can view org services" ON services;
DROP POLICY IF EXISTS "Partners can insert org services" ON services;
DROP POLICY IF EXISTS "Partners can update org services" ON services;
DROP POLICY IF EXISTS "Partners can delete org services" ON services;

DROP POLICY IF EXISTS "Public can view published services" ON services;

-- Feedback
DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can delete feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;

DROP POLICY IF EXISTS "Partners can view service feedback" ON feedback;
DROP POLICY IF EXISTS "Partners can resolve feedback" ON feedback;


-- =====================================================================================
-- 2. SERVICES: UNIFIED POLICIES
-- =====================================================================================

-- SELECT: Public + Admin + Partner
-- Logic: Published (Anyone) OR Admin OR Partner (Own Org)
-- Note: TO public covers both anon and authenticated.
CREATE POLICY "Unified view policy for services" ON services
  FOR SELECT
  TO public
  USING (
    published = true
    OR
    (
      auth.role() = 'authenticated' AND (
        is_admin()
        OR
        EXISTS (
          SELECT 1 FROM organization_members om
          WHERE om.organization_id = services.org_id
          AND om.user_id = (SELECT auth.uid())
        )
      )
    )
  );

-- INSERT: Admin OR Partner (Editor+)
-- Note: Only for authenticated users.
CREATE POLICY "Unified insert policy for services" ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

-- UPDATE: Admin OR Partner (Editor+)
CREATE POLICY "Unified update policy for services" ON services
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

-- DELETE: Admin OR Partner (Editor+)
CREATE POLICY "Unified delete policy for services" ON services
  FOR DELETE
  TO authenticated
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );


-- =====================================================================================
-- 3. FEEDBACK: UNIFIED POLICIES
-- =====================================================================================

-- SELECT: Admin OR Partner
CREATE POLICY "Unified view policy for feedback" ON feedback
  FOR SELECT
  TO authenticated
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = feedback.service_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

-- UPDATE: Admin OR Partner (Resolve)
CREATE POLICY "Unified update policy for feedback" ON feedback
  FOR UPDATE
  TO authenticated
  USING (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = feedback.service_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    is_admin()
    OR
    EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = feedback.service_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

-- DELETE: Admin only
-- (Since Partners traditionally update status to resolved but don't delete records?)
-- Keeping strictly Admin for now based on previous "Admins can delete feedback" policy.
CREATE POLICY "Unified delete policy for feedback" ON feedback
  FOR DELETE
  TO authenticated
  USING ( is_admin() );

-- INSERT: Public (Anonymous + Authenticated)
-- This remains "Anyone can submit" but we rename it to match the Unified convention
-- and ensure it's the ONLY insert policy.
DROP POLICY IF EXISTS "Public can submit feedback" ON feedback;

CREATE POLICY "Unified insert policy for feedback" ON feedback
  FOR INSERT
  TO public
  WITH CHECK (true);


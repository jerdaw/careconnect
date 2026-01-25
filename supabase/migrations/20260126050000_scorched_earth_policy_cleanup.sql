-- =====================================================================================
-- Migration: Scorched Earth Policy Cleanup (Linter Fixes)
-- =====================================================================================
-- Purpose: Aggressively drop ALL existing policies on services/feedback to fix overlaps.
-- Date: 2026-01-26 (Sequence 05 - The Final Cleanup)
-- =====================================================================================

-- =====================================================================================
-- 1. DROP EVERYTHING: SERVICES
-- =====================================================================================
-- Drop every known policy name from history to ensure clean slate.

DROP POLICY IF EXISTS "Public can view published services" ON services;
DROP POLICY IF EXISTS "Authenticated can select services" ON services;
DROP POLICY IF EXISTS "Org members can insert services" ON services;
DROP POLICY IF EXISTS "Org members can update own services" ON services;
DROP POLICY IF EXISTS "Org admins can delete own services" ON services;
DROP POLICY IF EXISTS "Partners can view their organization's services" ON services;
DROP POLICY IF EXISTS "Partners can manage their organization's services" ON services;
DROP POLICY IF EXISTS "Admins have full access to services" ON services;
DROP POLICY IF EXISTS "Admins can insert services" ON services;
DROP POLICY IF EXISTS "Admins can select services" ON services;
DROP POLICY IF EXISTS "Admins can update services" ON services;
DROP POLICY IF EXISTS "Admins can delete services" ON services;
DROP POLICY IF EXISTS "Partners can insert org services" ON services;
DROP POLICY IF EXISTS "Partners can update org services" ON services;
DROP POLICY IF EXISTS "Partners can delete org services" ON services;

-- =====================================================================================
-- 2. RE-CREATE CLEAN POLICIES: SERVICES
-- =====================================================================================

-- A. PUBLIC READ (Published only) applies to ANON and AUTHENTICATED
-- Note: 'authenticated' users also need to see published services even if they don't own them.
CREATE POLICY "Public can view published services" ON services
  FOR SELECT
  USING ( published = true );

-- B. ADMIN ACCESS (Full Access)
-- Split by action to facilitate specific checks, but we can potentially use ALL if we are careful.
-- To avoid "Multiple Permissive Policies" with Public Read:
-- "Public can view" covers SELECT for published. 
-- Admins need coverage for UNPUBLISHED.
-- If Adming policy is "USING (is_admin())", it overlaps for published services (Both True).
-- Linter Warning: "Multiple permissive policies... SELECT".
-- Fix: Make Admin policy EXCLUDE published? "is_admin() AND NOT published"? 
-- No, that's brittle.
-- We ACCEPT the SELECT redundancy for Admins as it's unavoidable without complex logic.
-- However, we can avoid INSERT/UPDATE/DELETE redundancy.

CREATE POLICY "Admins can insert services" ON services
  FOR INSERT WITH CHECK ( is_admin() );

CREATE POLICY "Admins can update services" ON services
  FOR UPDATE USING ( is_admin() ) WITH CHECK ( is_admin() );

CREATE POLICY "Admins can delete services" ON services
  FOR DELETE USING ( is_admin() );

-- Admins specific SELECT for unpublished items (or just broad select)
CREATE POLICY "Admins can view unpublished services" ON services
  FOR SELECT USING ( is_admin() );

-- C. PARTNER ACCESS (Org Members)
-- Must not overlap with Public Read (for published).
-- Partners need to see their OWN services even if unpublished.
-- "Partners can view org services" covers this.
-- Redundancy with Public Read? Yes, if service is published.
-- Resolution: Overlap on SELECT is essentially standard in Supabase RLS unless you do exclusion.
-- We will consolidate "Org members can insert/update/delete" into these clean policies.

CREATE POLICY "Partners can view org services" ON services
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Partners can insert org services" ON services
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Partners can update org services" ON services
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Partners can delete org services" ON services
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );


-- =====================================================================================
-- 3. DROP EVERYTHING: FEEDBACK
-- =====================================================================================

DROP POLICY IF EXISTS "Partners can view their feedback" ON feedback;
DROP POLICY IF EXISTS "Partners can update feedback status" ON feedback;
DROP POLICY IF EXISTS "Partners can view feedback for their services" ON feedback;
DROP POLICY IF EXISTS "Admins have full access to feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can delete feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can select feedback" ON feedback;
DROP POLICY IF EXISTS "Partners can read feedback" ON feedback;
DROP POLICY IF EXISTS "Partners can update feedback" ON feedback;
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;


-- =====================================================================================
-- 4. RE-CREATE CLEAN POLICIES: FEEDBACK
-- =====================================================================================

-- A. PUBLIC INSERT (Anyone can submit)
CREATE POLICY "Public can submit feedback" ON feedback
  FOR INSERT
  WITH CHECK (true);

-- B. ADMIN ACCESS
-- Exclude INSERT (covered by Public).
CREATE POLICY "Admins can update feedback" ON feedback
  FOR UPDATE USING ( is_admin() ) WITH CHECK ( is_admin() );

CREATE POLICY "Admins can delete feedback" ON feedback
  FOR DELETE USING ( is_admin() );

CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING ( is_admin() );

-- C. PARTNER ACCESS (Service Owners)
-- View feedback for services they own.
CREATE POLICY "Partners can view service feedback" ON feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = feedback.service_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

-- Update feedback status (e.g. resolve)
CREATE POLICY "Partners can resolve feedback" ON feedback
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = feedback.service_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = feedback.service_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin', 'editor')
    )
  );

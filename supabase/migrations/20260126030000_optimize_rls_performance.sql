-- =====================================================================================
-- Migration: Optimize RLS Performance (Linter Fixes)
-- =====================================================================================
-- Purpose: Address 'auth_rls_initplan' and 'multiple_permissive_policies' warnings.
-- Date: 2026-01-26 (Sequence 03)
-- =====================================================================================

-- =====================================================================================
-- 1. FIX: AUTH RLS INSPECTION PERFORMANCE
-- =====================================================================================
-- Issue: RLS policies calling auth.uid() or auth.jwt() directly are evaluated for every row.
-- Fix: Wrap these calls in (SELECT ...) to force single evaluation per query (InitPlan).

-- A. public.feedback
DROP POLICY IF EXISTS "Partners can view feedback for their services" ON feedback;
CREATE POLICY "Partners can view feedback for their services" ON feedback
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM services s
      JOIN organization_members om ON s.org_id = om.organization_id
      WHERE s.id = feedback.service_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

-- B. public.app_admins
DROP POLICY IF EXISTS "Admins can view admin list" ON app_admins;
CREATE POLICY "Admins can view admin list" ON app_admins
  FOR SELECT TO authenticated
  USING ( user_id = (SELECT auth.uid()) );

-- C. public.organization_settings
DROP POLICY IF EXISTS "Org members can view their settings" ON organization_settings;
CREATE POLICY "Org members can view their settings" ON organization_settings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Org admins can update settings" ON organization_settings;
CREATE POLICY "Org admins can update settings" ON organization_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_settings.organization_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_settings.organization_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  );

-- D. public.notifications
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL TO authenticated
  USING ( user_id = (SELECT auth.uid()) )
  WITH CHECK ( user_id = (SELECT auth.uid()) );

-- E. public.services
DROP POLICY IF EXISTS "Partners can view their organization's services" ON services;
CREATE POLICY "Partners can view their organization's services" ON services
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = services.org_id
      AND om.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Partners can manage their organization's services" ON services;
CREATE POLICY "Partners can manage their organization's services" ON services
  FOR ALL TO authenticated
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

-- F. public.organization_invitations
DROP POLICY IF EXISTS "Org members can view invitations" ON organization_invitations;
CREATE POLICY "Org members can view invitations" ON organization_invitations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Org admins can manage invitations" ON organization_invitations;
CREATE POLICY "Org admins can manage invitations" ON organization_invitations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
      AND om.user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  );


-- =====================================================================================
-- 2. FIX: REDUNDANT POLICIES (MULTIPLE PERMISSIVE)
-- =====================================================================================
-- Issue: Multiple overlap policies cause performance degradation.
-- Fix: Drop the older/redundant policies that are covered by the newer ones.

-- A. public.feedback
-- "Partners can view their feedback" is old (004_feedback.sql) and redundant with "Partners can view feedback for their services"
DROP POLICY IF EXISTS "Partners can view their feedback" ON feedback;
